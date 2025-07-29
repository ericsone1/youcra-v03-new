import { doc, getDoc, setDoc, updateDoc, increment, runTransaction, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 토큰 시스템 서비스
 * - 시청시간 집계 → 토큰 발급
 * - 토큰 할당 및 차감
 */

// 토큰 비율: 10분 시청 = 1토큰
const MINUTES_PER_TOKEN = 10;

/**
 * 사용자의 토큰 현황 조회
 */
export const getUserWatchStats = async (uid) => {
  try {
    const statsRef = doc(db, 'users', uid, 'stats', 'watchStats');
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
      return statsSnap.data();
    } else {
      // 초기 데이터 생성
      const initialStats = {
        totalWatchSeconds: 0,
        totalTokens: 0,
        spentTokens: 0,
        availableTokens: 0,
        lastUpdated: new Date()
      };
      await setDoc(statsRef, initialStats);
      return initialStats;
    }
  } catch (error) {
    console.error('❌ [tokenService] 토큰 현황 조회 실패:', error);
    throw error;
  }
};

/**
 * 시청시간 추가 및 토큰 발급
 */
export const addWatchTime = async (uid, watchTimeSeconds) => {
  try {
    const statsRef = doc(db, 'users', uid, 'stats', 'watchStats');
    
    return await runTransaction(db, async (transaction) => {
      const statsSnap = await transaction.get(statsRef);
      
      let currentStats;
      if (statsSnap.exists()) {
        currentStats = statsSnap.data();
      } else {
        currentStats = {
          totalWatchSeconds: 0,
          totalTokens: 0,
          spentTokens: 0,
          availableTokens: 0
        };
      }
      
      // 새로운 누적 시청시간
      const newTotalSeconds = currentStats.totalWatchSeconds + watchTimeSeconds;
      const newTotalMinutes = Math.floor(newTotalSeconds / 60);
      
      // 발급해야 할 토큰 계산
      const shouldHaveTokens = Math.floor(newTotalMinutes / MINUTES_PER_TOKEN);
      const newTokensToAdd = shouldHaveTokens - currentStats.totalTokens;
      
      const updatedStats = {
        totalWatchSeconds: newTotalSeconds,
        totalTokens: shouldHaveTokens,
        spentTokens: currentStats.spentTokens,
        availableTokens: currentStats.availableTokens + newTokensToAdd,
        lastUpdated: new Date()
      };
      
      transaction.set(statsRef, updatedStats);
      
      // 새 토큰이 발급되었다면 로그
      if (newTokensToAdd > 0) {
        console.log(`🪙 [tokenService] ${uid}님이 ${newTokensToAdd}개 토큰 획득! (총 ${shouldHaveTokens}개)`);
      }
      
      return { newTokensEarned: newTokensToAdd, updatedStats };
    });
    
  } catch (error) {
    console.error('❌ [tokenService] 시청시간 추가 실패:', error);
    throw error;
  }
};

/**
 * 토큰 사용 (영상 노출에 할당)
 */
export const spendTokens = async (uid, amount) => {
  try {
    const statsRef = doc(db, 'users', uid, 'stats', 'watchStats');
    
    return await runTransaction(db, async (transaction) => {
      const statsSnap = await transaction.get(statsRef);
      
      if (!statsSnap.exists()) {
        throw new Error('토큰 정보가 없습니다');
      }
      
      const currentStats = statsSnap.data();
      
      if (currentStats.availableTokens < amount) {
        throw new Error(`토큰이 부족합니다. 보유: ${currentStats.availableTokens}개, 필요: ${amount}개`);
      }
      
      const updatedStats = {
        ...currentStats,
        spentTokens: currentStats.spentTokens + amount,
        availableTokens: currentStats.availableTokens - amount,
        lastUpdated: new Date()
      };
      
      transaction.set(statsRef, updatedStats);
      return updatedStats;
    });
    
  } catch (error) {
    console.error('❌ [tokenService] 토큰 사용 실패:', error);
    throw error;
  }
};

/**
 * 시청시간을 분:초 형태로 포맷
 */
export const formatWatchTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else {
    return `${minutes}분`;
  }
};

/**
 * 토큰으로 변환 가능한 시청시간 계산
 */
export const calculateTokensFromTime = (totalSeconds) => {
  const totalMinutes = Math.floor(totalSeconds / 60);
  return Math.floor(totalMinutes / MINUTES_PER_TOKEN);
};

/**
 * 영상 노출 시 토큰 차감
 */
export const consumeVideoToken = async (videoDocId) => {
  try {
    const videoRef = doc(db, 'videos', videoDocId);
    
    return await runTransaction(db, async (transaction) => {
      const videoSnap = await transaction.get(videoRef);
      
      if (!videoSnap.exists()) {
        throw new Error('영상을 찾을 수 없습니다');
      }
      
      const videoData = videoSnap.data();
      const remainingTokens = videoData.remainingTokens || 0;
      const totalExposures = videoData.totalExposures || 0;
      
      if (remainingTokens <= 0) {
        // 토큰이 없으면 영상을 비활성화
        transaction.update(videoRef, {
          isActive: false,
          lastUpdated: new Date()
        });
        throw new Error('토큰이 소진되어 노출할 수 없습니다');
      }
      
      // 토큰 차감 및 노출 횟수 증가
      const updatedData = {
        remainingTokens: remainingTokens - 1,
        totalExposures: totalExposures + 1,
        isActive: remainingTokens - 1 > 0, // 남은 토큰이 0이면 비활성화
        lastExposedAt: new Date(),
        lastUpdated: new Date()
      };
      
      transaction.update(videoRef, updatedData);
      
      console.log(`�� [tokenService] 영상 노출 토큰 차감: ${videoDocId} (남은 토큰: ${remainingTokens - 1})`);
      
      return {
        success: true,
        remainingTokens: remainingTokens - 1,
        totalExposures: totalExposures + 1,
        isActive: remainingTokens - 1 > 0
      };
    });
    
  } catch (error) {
    console.error('❌ [tokenService] 토큰 차감 실패:', error);
    throw error;
  }
};

/**
 * 활성화된 영상만 필터링 (토큰이 있는 영상)
 */
export const filterActiveVideos = (videos) => {
  if (!Array.isArray(videos)) return [];
  
  return videos.filter(video => {
    const isActive = video.isActive !== false; // undefined도 true로 처리 (기존 영상 호환)
    const hasTokens = (video.remainingTokens || 0) > 0;
    
    // 기존 영상 (토큰 필드가 없는 경우)는 계속 노출
    if (video.remainingTokens === undefined && video.allocatedTokens === undefined) {
      return true;
    }
    
    return isActive && hasTokens;
  });
};

/**
 * 영상 토큰 정보 조회
 */
export const getVideoTokenInfo = async (videoDocId) => {
  try {
    const videoRef = doc(db, 'videos', videoDocId);
    const videoSnap = await getDoc(videoRef);
    
    if (!videoSnap.exists()) {
      throw new Error('영상을 찾을 수 없습니다');
    }
    
    const data = videoSnap.data();
    return {
      allocatedTokens: data.allocatedTokens || 0,
      remainingTokens: data.remainingTokens || 0,
      totalExposures: data.totalExposures || 0,
      isActive: data.isActive !== false
    };
  } catch (error) {
    console.error('❌ [tokenService] 토큰 정보 조회 실패:', error);
    throw error;
  }
}; 

/**
 * 기존 시청 기록을 분석하여 토큰을 소급 지급
 * @param {string} userId - 사용자 ID
 * @returns {Object} 지급 결과
 */
export const retroactiveTokenGrant = async (userId) => {
  try {
    console.log(`🔄 [tokenService] ${userId} 소급 토큰 지급 시작`);
    
    // 0. 이미 소급 지급을 받았는지 확인
    const watchStatsRef = doc(db, 'users', userId, 'stats', 'watchStats');
    const existingStatsSnap = await getDoc(watchStatsRef);
    
    if (existingStatsSnap.exists()) {
      const existingData = existingStatsSnap.data();
      if (existingData.retroactiveGrantedAt) {
        console.log(`ℹ️ [tokenService] ${userId} 이미 소급 지급받음:`, existingData.retroactiveGrantedAt);
        return { 
          success: false, 
          message: '이미 토큰 소급 지급을 받았습니다', 
          totalSeconds: existingData.retroactiveWatchSeconds || existingData.totalWatchSeconds || 0, 
          tokensEarned: existingData.retroactiveTokens || 0,
          alreadyGranted: true,
          grantedAt: existingData.retroactiveGrantedAt
        };
      }
      
      // 기존에 누적된 실제 시청 시간이 있다면 그것을 기반으로 토큰 지급
      const existingWatchSeconds = existingData.totalWatchSeconds || 0;
      if (existingWatchSeconds > 0) {
        console.log(`📊 [tokenService] ${userId} 기존 누적 시청시간 발견: ${Math.floor(existingWatchSeconds/60)}분 (${existingWatchSeconds}초)`);
        
        // 기존 시청시간 기반 토큰 계산 (10분 = 600초 = 1토큰)
        const tokensToGrant = Math.floor(existingWatchSeconds / 600);
        
        console.log(`🧮 [tokenService] ${userId} 기존 데이터 기반 계산:`, {
          기존시청시간: `${Math.floor(existingWatchSeconds / 60)}분 ${existingWatchSeconds % 60}초`,
          기존토큰: existingData.totalTokens || 0,
          계산된토큰: tokensToGrant,
          추가지급토큰: Math.max(0, tokensToGrant - (existingData.totalTokens || 0))
        });
        
        const additionalTokens = Math.max(0, tokensToGrant - (existingData.totalTokens || 0));
        
        if (additionalTokens > 0) {
          // 부족한 토큰만 추가 지급
          return await runTransaction(db, async (transaction) => {
            const currentStatsSnap = await transaction.get(watchStatsRef);
            const currentStats = currentStatsSnap.data();
            
            const updatedStats = {
              ...currentStats,
              totalTokens: tokensToGrant,
              availableTokens: (currentStats.availableTokens || 0) + additionalTokens,
              retroactiveWatchSeconds: existingWatchSeconds,
              retroactiveTokens: additionalTokens,
              retroactiveGrantedAt: new Date(),
              lastUpdated: new Date()
            };
            
            transaction.set(watchStatsRef, updatedStats, { merge: true });
            
            console.log(`✅ [tokenService] ${userId} 기존 데이터 기반 소급 지급 완료: ${additionalTokens}개 토큰 추가`);
            
            return {
              success: true,
              message: `${additionalTokens}개 토큰이 소급 지급되었습니다 (기존 시청 기록 기반)`,
              totalSeconds: existingWatchSeconds,
              tokensEarned: additionalTokens,
              updatedStats
            };
          });
        } else {
          // 이미 충분한 토큰이 있는 경우
          const updatedStats = {
            ...existingData,
            retroactiveWatchSeconds: existingWatchSeconds,
            retroactiveTokens: 0,
            retroactiveGrantedAt: new Date(),
            lastUpdated: new Date()
          };
          
          await setDoc(watchStatsRef, updatedStats, { merge: true });
          
          return {
            success: true,
            message: '이미 충분한 토큰을 보유하고 있습니다',
            totalSeconds: existingWatchSeconds,
            tokensEarned: 0,
            updatedStats
          };
        }
      }
    }
    
    // 1. 기존 시청 시간 데이터가 없는 경우, watchedVideos에서 영상 정보 수집
    const watchedRef = collection(db, 'users', userId, 'watchedVideos');
    const watchedSnap = await getDocs(watchedRef);
    
    if (watchedSnap.empty) {
      console.log(`ℹ️ [tokenService] ${userId} 시청 기록 없음`);
      return { success: true, message: '시청 기록이 없습니다', totalSeconds: 0, tokensEarned: 0 };
    }
    
    console.log(`📊 [tokenService] ${userId} 시청 영상 수: ${watchedSnap.docs.length}`);
    
    let totalWatchSeconds = 0;
    const watchedVideoDetails = [];
    
    // 2. 각 시청 영상의 duration 정보 수집 (기존 로직 유지)
    for (const watchedDoc of watchedSnap.docs) {
      const watchedData = watchedDoc.data();
      const videoId = watchedDoc.id;
      
      console.log(`🔍 [tokenService] 영상 분석 중: ${videoId}`, {
        watchedData,
        certified: watchedData.certified,
        watchedAt: watchedData.watchedAt,
        lastWatchedAt: watchedData.lastWatchedAt
      });
      
      // 영상의 실제 duration 찾기 (여러 소스에서 검색)
      let videoDuration = 0;
      let videoTitle = '제목 없음';
      
      // 먼저 전체 videos 컬렉션에서 찾기
      const videosQuery = query(collection(db, 'videos'), where('videoId', '==', videoId));
      const videosSnap = await getDocs(videosQuery);
      
      if (!videosSnap.empty) {
        const videoData = videosSnap.docs[0].data();
        videoDuration = videoData.duration || videoData.durationSeconds || 0;
        videoTitle = videoData.title || '제목 없음';
        console.log(`✅ [tokenService] videos 컬렉션에서 발견: ${videoTitle} (${videoDuration}초)`);
      } else {
        // videos 컬렉션에 없으면 채팅방별 videos에서 찾기
        const roomsQuery = query(collection(db, 'chatRooms'));
        const roomsSnap = await getDocs(roomsQuery);
        
        for (const roomDoc of roomsSnap.docs) {
          const videoRef = doc(db, 'chatRooms', roomDoc.id, 'videos', videoId);
          const videoSnap = await getDoc(videoRef);
          
          if (videoSnap.exists()) {
            const videoData = videoSnap.data();
            videoDuration = videoData.duration || videoData.durationSeconds || 0;
            videoTitle = videoData.title || '제목 없음';
            console.log(`✅ [tokenService] 채팅방 ${roomDoc.id}에서 발견: ${videoTitle} (${videoDuration}초)`);
            break;
          }
        }
      }
      
      if (videoDuration > 0) {
        // ⚠️ 주의: 여기서는 영상 전체 길이가 아닌 추정 시청 시간을 계산
        // 실제로는 영상을 끝까지 보지 않았을 가능성이 높으므로 60% 정도로 추정
        const estimatedWatchTime = Math.floor(videoDuration * 0.6);
        totalWatchSeconds += estimatedWatchTime;
        watchedVideoDetails.push({
          videoId,
          title: videoTitle,
          duration: videoDuration,
          estimatedWatchTime,
          watchedAt: watchedData.watchedAt || watchedData.lastWatchedAt?.toMillis?.() || Date.now()
        });
        console.log(`⏰ [tokenService] ${videoTitle}: ${videoDuration}초 영상 → 추정 시청시간 ${estimatedWatchTime}초 (60%) → 누적: ${totalWatchSeconds}초 (${Math.floor(totalWatchSeconds/60)}분)`);
      } else {
        console.warn(`⚠️ [tokenService] ${videoId} duration 정보 없음`);
      }
    }
    
    // 3. 토큰 계산 (10분 = 600초 = 1토큰)
    const tokensToGrant = Math.floor(totalWatchSeconds / 600);
    
    console.log(`🧮 [tokenService] ${userId} 최종 계산 결과:`, {
      총추정시청시간: `${Math.floor(totalWatchSeconds / 60)}분 ${totalWatchSeconds % 60}초`,
      총시청영상수: watchedVideoDetails.length,
      지급토큰: tokensToGrant,
      계산방식: '영상별 60% 추정 시청'
    });
    
    if (tokensToGrant === 0) {
      return { 
        success: true, 
        message: '지급할 토큰이 없습니다 (추정 시청시간 10분 미만)', 
        totalSeconds: totalWatchSeconds, 
        tokensEarned: 0,
        watchedVideos: watchedVideoDetails.length
      };
    }
    
    // 4. watchStats 문서 생성/업데이트 (소급 지급)
    return await runTransaction(db, async (transaction) => {
      const watchStatsSnap = await transaction.get(watchStatsRef);
      
      let currentStats = {
        totalWatchSeconds: 0,
        totalTokens: 0,
        availableTokens: 0,
        spentTokens: 0,
        lastUpdated: new Date()
      };
      
      // 기존 통계가 있으면 가져오기
      if (watchStatsSnap.exists()) {
        currentStats = { ...currentStats, ...watchStatsSnap.data() };
        console.log(`📋 [tokenService] 기존 통계:`, currentStats);
        
        // 트랜잭션 내에서 다시 한번 중복 확인
        if (currentStats.retroactiveGrantedAt) {
          throw new Error('이미 토큰 소급 지급을 받았습니다');
        }
      }
      
      // 소급 지급 (기존 통계에 토큰 추가)
      const updatedStats = {
        ...currentStats,
        totalWatchSeconds: currentStats.totalWatchSeconds + totalWatchSeconds, // 추정 시청시간 누적
        retroactiveWatchSeconds: totalWatchSeconds, // 소급 적용된 시청시간
        retroactiveTokens: tokensToGrant, // 소급 적용된 토큰
        totalTokens: currentStats.totalTokens + tokensToGrant,
        availableTokens: currentStats.availableTokens + tokensToGrant,
        retroactiveGrantedAt: new Date(),
        lastUpdated: new Date()
      };
      
      transaction.set(watchStatsRef, updatedStats, { merge: true });
      
      console.log(`✅ [tokenService] ${userId} 소급 지급 완료:`, {
        기존토큰: currentStats.totalTokens,
        소급토큰: tokensToGrant,
        최종토큰: updatedStats.totalTokens
      });
      
      return {
        success: true,
        message: `${tokensToGrant}개 토큰이 소급 지급되었습니다 (추정 시청시간 기반)`,
        totalSeconds: totalWatchSeconds,
        tokensEarned: tokensToGrant,
        watchedVideos: watchedVideoDetails.length,
        updatedStats
      };
    });
    
  } catch (error) {
    console.error(`❌ [tokenService] ${userId} 소급 지급 실패:`, error);
    throw error;
  }
};

/**
 * 모든 사용자에게 토큰 소급 지급
 * @returns {Object} 전체 지급 결과
 */
export const retroactiveTokenGrantForAllUsers = async () => {
  try {
    console.log('🚀 [tokenService] 전체 사용자 소급 토큰 지급 시작');
    
    // 1. 모든 사용자 ID 수집 (watchedVideos 컬렉션이 있는 사용자들)
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    const userIds = [];
    for (const userDoc of usersSnap.docs) {
      // watchedVideos 서브컬렉션이 있는지 확인
      const watchedRef = collection(db, 'users', userDoc.id, 'watchedVideos');
      const watchedSnap = await getDocs(query(watchedRef, limit(1)));
      
      if (!watchedSnap.empty) {
        userIds.push(userDoc.id);
      }
    }
    
    console.log(`👥 [tokenService] 시청 기록이 있는 사용자 수: ${userIds.length}`);
    
    if (userIds.length === 0) {
      return { success: true, message: '시청 기록이 있는 사용자가 없습니다', processedUsers: 0 };
    }
    
    // 2. 각 사용자별로 소급 지급 실행
    const results = [];
    let totalTokensGranted = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (const userId of userIds) {
      try {
        console.log(`🔄 [tokenService] 처리 중: ${userId} (${successCount + errorCount + 1}/${userIds.length})`);
        
        const result = await retroactiveTokenGrant(userId);
        results.push({ userId, ...result });
        
        if (result.success) {
          totalTokensGranted += result.tokensEarned;
          successCount++;
          console.log(`✅ [tokenService] ${userId} 완료: ${result.tokensEarned}토큰`);
        }
        
        // API 레이트 리미트 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ [tokenService] ${userId} 처리 실패:`, error);
        results.push({ userId, success: false, error: error.message });
        errorCount++;
      }
    }
    
    console.log('🎉 [tokenService] 전체 소급 지급 완료:', {
      총처리유저: userIds.length,
      성공: successCount,
      실패: errorCount,
      총지급토큰: totalTokensGranted
    });
    
    return {
      success: true,
      message: `${successCount}명에게 총 ${totalTokensGranted}개 토큰을 소급 지급했습니다`,
      processedUsers: userIds.length,
      successCount,
      errorCount,
      totalTokensGranted,
      details: results
    };
    
  } catch (error) {
    console.error('❌ [tokenService] 전체 소급 지급 실패:', error);
    throw error;
  }
}; 

/**
 * 토큰 소급 지급 상태 초기화 (재계산을 위해)
 * @param {string} userId - 사용자 ID
 * @returns {Object} 초기화 결과
 */
export const resetRetroactiveGrant = async (userId) => {
  try {
    console.log(`🔄 [tokenService] ${userId} 소급 지급 상태 초기화`);
    
    const watchStatsRef = doc(db, 'users', userId, 'stats', 'watchStats');
    const existingStatsSnap = await getDoc(watchStatsRef);
    
    if (!existingStatsSnap.exists()) {
      return { success: true, message: '토큰 데이터가 없습니다' };
    }
    
    const existingData = existingStatsSnap.data();
    const updatedStats = {
      ...existingData,
      retroactiveGrantedAt: null, // 소급 지급 상태 초기화
      retroactiveWatchSeconds: null,
      retroactiveTokens: null
    };
    
    await setDoc(watchStatsRef, updatedStats, { merge: true });
    
    console.log(`✅ [tokenService] ${userId} 소급 지급 상태 초기화 완료`);
    
    return {
      success: true,
      message: '소급 지급 상태가 초기화되었습니다. 이제 다시 토큰을 받을 수 있습니다.',
      resetData: updatedStats
    };
    
  } catch (error) {
    console.error(`❌ [tokenService] ${userId} 소급 지급 상태 초기화 실패:`, error);
    throw error;
  }
}; 

/**
 * 모든 유저에게 기본 토큰 지급 (10토큰)
 * @returns {Object} 지급 결과
 */
export const grantBasicTokensToAllUsers = async () => {
  try {
    console.log('🎁 [tokenService] 모든 유저에게 기본 토큰 지급 시작');
    
    // 1. 모든 사용자 ID 수집
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    if (usersSnap.empty) {
      return { success: true, message: '사용자가 없습니다', processedUsers: 0 };
    }
    
    console.log(`👥 [tokenService] 총 사용자 수: ${usersSnap.docs.length}`);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let totalTokensGranted = 0;
    
    // 2. 각 사용자별로 기본 토큰 지급
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      
      try {
        const watchStatsRef = doc(db, 'users', userId, 'stats', 'watchStats');
        
        await runTransaction(db, async (transaction) => {
          const statsSnap = await transaction.get(watchStatsRef);
          
          let currentStats = {
            totalWatchSeconds: 0,
            totalTokens: 0,
            spentTokens: 0,
            availableTokens: 0,
            lastUpdated: new Date()
          };
          
          // 기존 통계가 있으면 가져오기
          if (statsSnap.exists()) {
            currentStats = { ...currentStats, ...statsSnap.data() };
          }
          
          // 기본 토큰 10개 지급
          const basicTokens = 10;
          const updatedStats = {
            ...currentStats,
            totalTokens: currentStats.totalTokens + basicTokens,
            availableTokens: currentStats.availableTokens + basicTokens,
            basicTokensGranted: true,
            basicTokensGrantedAt: new Date(),
            lastUpdated: new Date()
          };
          
          transaction.set(watchStatsRef, updatedStats, { merge: true });
        });
        
        console.log(`✅ [tokenService] ${userId} 기본 토큰 지급 완료: 10개`);
        results.push({ userId, success: true, tokensGranted: 10 });
        successCount++;
        totalTokensGranted += 10;
        
      } catch (error) {
        console.error(`❌ [tokenService] ${userId} 기본 토큰 지급 실패:`, error);
        results.push({ userId, success: false, error: error.message });
        errorCount++;
      }
      
      // API 부하 방지를 위한 작은 딜레이
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const finalResult = {
      success: true,
      message: `기본 토큰 지급 완료`,
      processedUsers: usersSnap.docs.length,
      successCount,
      errorCount,
      totalTokensGranted,
      results
    };
    
    console.log('🎉 [tokenService] 모든 유저 기본 토큰 지급 완료:', finalResult);
    return finalResult;
    
  } catch (error) {
    console.error('❌ [tokenService] 모든 유저 기본 토큰 지급 실패:', error);
    throw error;
  }
}; 
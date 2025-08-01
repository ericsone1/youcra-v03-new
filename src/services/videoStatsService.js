import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

/**
 * 비디오 통계 집계 서비스
 * 성능 최적화를 위한 집계 컬렉션 관리
 */

// videoStats 컬렉션 구조
const VIDEO_STATS_SCHEMA = {
  videoId: '', // YouTube 비디오 ID
  totalViews: 0, // 총 시청 횟수
  totalLikes: 0, // 총 좋아요 수
  uniqueViewers: 0, // 고유 시청자 수
  viewers: [], // 시청자 UID 배열
  lastUpdated: null, // 마지막 업데이트 시간
  createdAt: null // 생성 시간
};

/**
 * 비디오 통계 조회
 * @param {string} videoId - YouTube 비디오 ID
 * @returns {Promise<Object>} 비디오 통계 데이터
 */
export const getVideoStats = async (videoId) => {
  try {
    const statsRef = doc(db, 'videoStats', videoId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      return statsDoc.data();
    } else {
      // 통계가 없으면 기본값 반환
      return {
        videoId,
        totalViews: 0,
        totalLikes: 0,
        uniqueViewers: 0,
        viewers: [],
        lastUpdated: null,
        createdAt: null
      };
    }
  } catch (error) {
    console.error('❌ [videoStatsService] 비디오 통계 조회 실패:', error);
    return null;
  }
};

/**
 * 여러 비디오의 통계 일괄 조회
 * @param {Array<string>} videoIds - YouTube 비디오 ID 배열
 * @returns {Promise<Object>} 비디오 ID별 통계 데이터
 */
export const getMultipleVideoStats = async (videoIds) => {
  try {
    const statsMap = {};
    
    // Firestore 'in' 쿼리는 최대 10개만 지원하므로 배치 처리
    const batchSize = 10;
    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize);
      
      const statsQuery = query(
        collection(db, 'videoStats'),
        where('videoId', 'in', batch)
      );
      
      const statsSnapshot = await getDocs(statsQuery);
      
      statsSnapshot.forEach(doc => {
        const data = doc.data();
        statsMap[data.videoId] = data;
      });
    }
    
    // 없는 비디오는 기본값으로 채우기
    videoIds.forEach(videoId => {
      if (!statsMap[videoId]) {
        statsMap[videoId] = {
          videoId,
          totalViews: 0,
          totalLikes: 0,
          uniqueViewers: 0,
          viewers: [],
          lastUpdated: null,
          createdAt: null
        };
      }
    });
    
    return statsMap;
  } catch (error) {
    console.error('❌ [videoStatsService] 다중 비디오 통계 조회 실패:', error);
    return {};
  }
};

/**
 * 시청 기록 추가 (통계 업데이트)
 * @param {string} videoId - YouTube 비디오 ID
 * @param {string} userId - 사용자 UID
 * @param {Object} watchData - 시청 데이터
 * @returns {Promise<void>}
 */
export const addWatchRecord = async (videoId, userId, watchData = {}) => {
  try {
    console.log('📝 [videoStatsService] 시청 기록 추가:', { videoId, userId });
    
    const statsRef = doc(db, 'videoStats', videoId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      // 기존 통계 업데이트
      const currentData = statsDoc.data();
      const isNewViewer = !currentData.viewers.includes(userId);
      
      await updateDoc(statsRef, {
        totalViews: increment(1),
        uniqueViewers: isNewViewer ? increment(1) : currentData.uniqueViewers,
        viewers: isNewViewer ? arrayUnion(userId) : currentData.viewers,
        lastUpdated: serverTimestamp(),
        ...watchData
      });
    } else {
      // 새로운 통계 생성
      await setDoc(statsRef, {
        videoId,
        totalViews: 1,
        totalLikes: 0,
        uniqueViewers: 1,
        viewers: [userId],
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp(),
        ...watchData
      });
    }
    
    console.log('✅ [videoStatsService] 시청 기록 추가 완료');
  } catch (error) {
    console.error('❌ [videoStatsService] 시청 기록 추가 실패:', error);
  }
};

/**
 * 좋아요 기록 추가 (통계 업데이트)
 * @param {string} videoId - YouTube 비디오 ID
 * @param {string} userId - 사용자 UID
 * @param {boolean} isLike - 좋아요 여부
 * @returns {Promise<void>}
 */
export const updateLikeRecord = async (videoId, userId, isLike) => {
  try {
    console.log('👍 [videoStatsService] 좋아요 기록 업데이트:', { videoId, userId, isLike });
    
    const statsRef = doc(db, 'videoStats', videoId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const currentData = statsDoc.data();
      const hasLiked = currentData.likedBy?.includes(userId) || false;
      
      if (isLike && !hasLiked) {
        // 좋아요 추가
        await updateDoc(statsRef, {
          totalLikes: increment(1),
          likedBy: arrayUnion(userId),
          lastUpdated: serverTimestamp()
        });
      } else if (!isLike && hasLiked) {
        // 좋아요 취소
        await updateDoc(statsRef, {
          totalLikes: increment(-1),
          likedBy: arrayRemove(userId),
          lastUpdated: serverTimestamp()
        });
      }
    } else if (isLike) {
      // 새로운 통계 생성 (좋아요만)
      await setDoc(statsRef, {
        videoId,
        totalViews: 0,
        totalLikes: 1,
        uniqueViewers: 0,
        viewers: [],
        likedBy: [userId],
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }
    
    console.log('✅ [videoStatsService] 좋아요 기록 업데이트 완료');
  } catch (error) {
    console.error('❌ [videoStatsService] 좋아요 기록 업데이트 실패:', error);
  }
};

/**
 * 통계 데이터 초기화 (기존 데이터로부터 집계)
 * @param {Array<Object>} videos - 비디오 데이터 배열
 * @returns {Promise<void>}
 */
export const initializeVideoStats = async (videos) => {
  try {
    console.log('🔄 [videoStatsService] 통계 데이터 초기화 시작:', videos.length);
    
    // 모든 사용자의 시청 기록을 조회하여 통계 생성
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const statsMap = {};
    
    // 각 비디오별로 통계 초기화
    videos.forEach(video => {
      statsMap[video.videoId] = {
        videoId: video.videoId,
        totalViews: 0,
        totalLikes: 0,
        uniqueViewers: 0,
        viewers: [],
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      };
    });
    
    // 각 사용자의 시청 기록을 확인하여 통계 업데이트
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      try {
        const watchedVideosSnapshot = await getDocs(collection(db, 'users', userId, 'watchedVideos'));
        
        watchedVideosSnapshot.forEach(watchedDoc => {
          const videoId = watchedDoc.id;
          const watchData = watchedDoc.data();
          
          if (statsMap[videoId]) {
            const isNewViewer = !statsMap[videoId].viewers.includes(userId);
            
            statsMap[videoId].totalViews += watchData.watchCount || 1;
            if (isNewViewer) {
              statsMap[videoId].uniqueViewers += 1;
              statsMap[videoId].viewers.push(userId);
            }
          }
        });
      } catch (error) {
        console.error(`❌ [videoStatsService] 사용자 ${userId} 처리 실패:`, error);
      }
    }
    
    // 통계 데이터를 Firestore에 저장
    const batch = [];
    Object.values(statsMap).forEach(stats => {
      const statsRef = doc(db, 'videoStats', stats.videoId);
      batch.push(setDoc(statsRef, stats));
    });
    
    await Promise.all(batch);
    console.log('✅ [videoStatsService] 통계 데이터 초기화 완료');
    
    // 결과 요약 출력
    const totalViews = Object.values(statsMap).reduce((sum, stats) => sum + stats.totalViews, 0);
    const totalUniqueViewers = Object.values(statsMap).reduce((sum, stats) => sum + stats.uniqueViewers, 0);
    const videosWithViews = Object.values(statsMap).filter(stats => stats.totalViews > 0).length;
    
    console.log('📊 [videoStatsService] 초기화 결과:', {
      총영상수: videos.length,
      시청기록있는영상: videosWithViews,
      총시청횟수: totalViews,
      총고유시청자: totalUniqueViewers
    });
  } catch (error) {
    console.error('❌ [videoStatsService] 통계 데이터 초기화 실패:', error);
  }
};

export default {
  getVideoStats,
  getMultipleVideoStats,
  addWatchRecord,
  updateLikeRecord,
  initializeVideoStats
}; 
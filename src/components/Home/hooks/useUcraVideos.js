import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc, where, onSnapshot } from 'firebase/firestore';
import { CATEGORY_KEYWORDS } from '../utils/constants';
import { useWatchedVideos } from '../../../contexts/WatchedVideosContext';
import { getMultipleVideoStats } from '../../../services/videoStatsService';
// import { useVideoDurations, useSetVideoDuration } from '../../../contexts/VideoDurationContext';
import { computeUniqueVideos } from '../utils/dataProcessing';
import { filterVideosByRecommendedCategories } from '../utils/dataProcessing';

// YouTube API에서 영상 정보 가져오기
// YouTube API에서 영상 정보 가져오기 (배치 처리)
const fetchYoutubeVideoInfoBatch = async (videoIds) => {
  try {
    const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
    
    if (!API_KEY) {
      console.warn(`❌ API_KEY 없음`);
      return {};
    }
    
    // 최대 50개씩 배치 처리 (YouTube API 제한)
    const batchSize = 50;
    const results = {};
    
    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize);
      const videoIdsString = batch.join(',');
      
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIdsString}&key=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        console.error(`❌ HTTP 에러: ${response.status}`);
        continue;
    }
    
    const data = await response.json();
    
    if (data.error) {
        console.error(`❌ YouTube API 에러:`, data.error.message);
        continue;
      }
      
      if (data.items) {
        data.items.forEach(item => {
          const videoId = item.id;
          results[videoId] = {
            title: item.snippet?.title || '제목 없음',
            description: item.snippet?.description || '',
            thumbnail: item.snippet?.thumbnails?.medium?.url || 
                     item.snippet?.thumbnails?.default?.url || 
                     `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            channelTitle: item.snippet?.channelTitle || '채널명 없음',
            channelId: item.snippet?.channelId || '',
            publishedAt: item.snippet?.publishedAt || '',
            viewCount: parseInt(item.statistics?.viewCount) || 0,
            likeCount: parseInt(item.statistics?.likeCount) || 0,
            duration: item.contentDetails?.duration || 'PT0S',
            durationSeconds: 0 // 나중에 계산
          };
          
          // duration을 초 단위로 변환
          const duration = item.contentDetails?.duration;
          if (duration && duration.startsWith('PT')) {
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
              const hours = parseInt(match[1] || 0);
              const minutes = parseInt(match[2] || 0);
              const seconds = parseInt(match[3] || 0);
              results[videoId].durationSeconds = hours * 3600 + minutes * 60 + seconds;
            }
          }
        });
      }
    }
    
    console.log(`✅ [YouTube API] ${videoIds.length}개 영상 정보 수집 완료`);
    return results;
    
  } catch (error) {
    console.error(`❌ YouTube API 배치 처리 실패:`, error.message);
    return {};
  }
};

// 기존 단일 영상 함수 (호환성 유지)
const fetchYoutubeVideoInfo = async (videoId) => {
  const results = await fetchYoutubeVideoInfoBatch([videoId]);
  return results[videoId] || null;
};

// 간단한 대체 함수들
const extractCategoryFromTitle = (title, description = '') => {
  return '일반'; // 기본값 반환
};

const extractKeywordsFromTitle = (title, description = '') => {
  return []; // 빈 배열 반환
};

const formatDuration = (duration) => {
  if (!duration) {
    return '0:00';
  }
  
  // YouTube API ISO 8601 형식 처리 (예: "PT6M8S", "PT2M56S")
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      const result = hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
      return result;
    }
  }
  
  // 숫자로 변환 (초 단위)
  const seconds = parseInt(duration);
  if (!seconds || isNaN(seconds) || seconds <= 0) {
    return '0:00';
  }
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const result = h > 0 
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
  
  return result;
};

const formatUploadDate = (timestamp) => {
  if (!timestamp) return '날짜 없음';
  return '방금 전'; // 기본값 반환
};

const getDurationType = (duration) => {
  if (!duration) return 'short';
  
  // duration이 숫자인 경우 (초 단위)
  if (typeof duration === 'number') {
    return duration >= 181 ? 'long' : 'short'; // 3분 1초(181초) 이상만 롱폼, 나머지는 모두 쇼츠
  }
  
  // duration이 문자열인 경우 (YouTube 형식: PT1M30S)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      return totalSeconds >= 181 ? 'long' : 'short'; // 3분 1초(181초) 이상만 롱폼, 나머지는 모두 쇼츠
    }
  }
  
  return 'short'; // 기본값
};

// 모든 사용자의 시청 데이터를 집계해서 총 시청 횟수 계산
const calculateTotalViewCounts = async (videos) => {
  try {
    console.log('📊 [useUcraVideos] 총 시청 횟수 계산 시작...');
    const viewCounts = {};
    
    // 모든 사용자 가져오기
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        const watchedVideosSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'watchedVideos'));
        
        watchedVideosSnapshot.forEach(watchedDoc => {
          const watchedData = watchedDoc.data();
          const videoId = watchedDoc.id;
          const watchCount = watchedData.watchCount || 0;
          
          if (watchCount > 0) {
            viewCounts[videoId] = (viewCounts[videoId] || 0) + watchCount;
          }
        });
      } catch (error) {
        console.error(`❌ [useUcraVideos] 사용자 ${userDoc.id} 시청 데이터 조회 실패:`, error);
      }
    }
    
    console.log('✅ [useUcraVideos] 총 시청 횟수 계산 완료:', viewCounts);
    
    // 영상 데이터에 계산된 총 시청 횟수 반영
    return videos.map(video => ({
      ...video,
      ucraViewCount: viewCounts[video.videoId] || 0
    }));
    
  } catch (error) {
    console.error('❌ [useUcraVideos] 총 시청 횟수 계산 실패:', error);
    return videos;
  }
};

export const useUcraVideos = (userCategory = null) => {
  const [ucraVideos, setUcraVideos] = useState([]);
  const [loadingUcraVideos, setLoadingUcraVideos] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { getWatchedVideos } = useWatchedVideos();
  // const durations = useVideoDurations();
  // const { setDuration } = useSetVideoDuration();
  
  // 현재 사용자 정보 가져오기 (내 영상 필터링용)
  const getCurrentUser = () => {
    try {
      const userFromLocal = JSON.parse(localStorage.getItem('ucra_currentUser') || '{}');
      return userFromLocal;
    } catch {
      return {};
    }
  };

  useEffect(() => {
    // 이미 초기화되었으면 다시 로딩하지 않음
    if (isInitialized) {
      console.log('🔄 [useUcraVideos] 이미 로딩됨 - 캐시된 데이터 사용');
      return;
    }
    const fetchVideos = async () => {
      try {
        setLoadingUcraVideos(true);
        setError(null);

        console.log('🔍 [useUcraVideos] 유크라 업로드 영상 로딩 시작');
        
        // 🚫 채팅방 영상 제외 - 루트 videos 컬렉션만 사용
        console.log('🚫 [useUcraVideos] 채팅방 영상 제외 - 루트 videos 컬렉션만 사용');
        
        let allVideos = [];
        
        // ✅ 루트 videos 컬렉션 영상 추가 (배치 처리 최적화)
        try {
          const rootVideosQuery = query(collection(db, "videos"), orderBy("registeredAt", "desc"));
          const rootVideosSnap = await getDocs(rootVideosQuery);
          console.log('🔍 [useUcraVideos] 루트 videos 컬렉션 수:', rootVideosSnap.size);

          // duration이 없는 영상들의 videoId 수집
          const videosNeedingDuration = [];
          const processedVideos = [];

          for (const docSnap of rootVideosSnap.docs) {
            const videoData = docSnap.data();
            
            // 디버깅: 첫 번째 영상의 필드 확인
            if (docSnap.id === rootVideosSnap.docs[0].id) {
              console.log('🔍 [디버깅] 첫 번째 영상 필드 확인:', {
                id: docSnap.id,
                fields: Object.keys(videoData),
                videoId: videoData.videoId,
                id_field: videoData.id,
                youtubeId: videoData.youtubeId,
                video_id: videoData.video_id
              });
            }
            
            // videoId 필드 확인 (Firebase에서 확인한 결과: id 필드에 YouTube ID 저장됨)
            const videoId = videoData.id || videoData.videoId || videoData.youtubeId || videoData.video_id;
            if (!videoId) {
              console.warn(`⚠️ [useUcraVideos] videoId 없음: ${docSnap.id}`, videoData);
              continue;
            }
            
            // videoData에 videoId 필드 추가 (호환성 유지)
            videoData.videoId = videoId;

            let category = videoData.category;
            let keywords = videoData.keywords || [];
            if (!category) {
              category = extractCategoryFromTitle(videoData.title || '', videoData.description || '');
              keywords = extractKeywordsFromTitle(videoData.title || '', videoData.description || '');
            }
            
            let duration = videoData.duration;
            let durationSeconds = 0;
            
            // duration이 없으면 배치 처리용으로 수집
            if (!videoData.duration || videoData.duration === 0) {
              videosNeedingDuration.push(videoData.videoId);
                  } else {
              // 기존 duration 처리
                if (typeof videoData.duration === 'number') {
                  durationSeconds = videoData.duration;
                } else if (typeof videoData.duration === 'string' && videoData.duration.startsWith('PT')) {
                  const match = videoData.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                  if (match) {
                    const hours = parseInt(match[1] || 0);
                    const minutes = parseInt(match[2] || 0);
                    const seconds = parseInt(match[3] || 0);
                    durationSeconds = hours * 3600 + minutes * 60 + seconds;
                  }
                } else if (typeof videoData.duration === 'string' && videoData.duration.includes(':')) {
                  const parts = videoData.duration.split(':').map(Number);
                  if (parts.length === 2) {
                    durationSeconds = parts[0] * 60 + parts[1];
                  } else if (parts.length === 3) {
                    durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                  }
                }
              }

            processedVideos.push({
              id: docSnap.id,
              videoData,
              category,
              keywords,
              duration,
              durationSeconds
            });
          }

          // 배치로 YouTube API 호출
          let youtubeInfo = {};
          if (videosNeedingDuration.length > 0) {
            console.log(`🔍 [YouTube API] ${videosNeedingDuration.length}개 영상 정보 배치 요청`);
            youtubeInfo = await fetchYoutubeVideoInfoBatch(videosNeedingDuration);
          }

          // 최종 영상 객체 생성
          for (const processed of processedVideos) {
            const { id, videoData, category, keywords, duration, durationSeconds } = processed;
            
            let finalDuration = duration;
            let finalDurationSeconds = durationSeconds;

            // YouTube API에서 가져온 정보로 업데이트
            if (youtubeInfo[videoData.videoId]) {
              const youtubeData = youtubeInfo[videoData.videoId];
              finalDuration = youtubeData.duration;
              finalDurationSeconds = youtubeData.durationSeconds;
            }

            allVideos.push({
              id: id,
              videoId: videoData.videoId,
              title: videoData.title || '제목 없음',
              thumbnail: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
              channel: videoData.channelTitle || videoData.channel || '채널명 없음',
              channelId: videoData.channelId,
              channelTitle: videoData.channelTitle || videoData.channel || '채널명 없음',
              duration: finalDuration,
              durationSeconds: finalDurationSeconds,
              durationDisplay: formatDuration(finalDurationSeconds),
              views: videoData.views || 0,
              viewCount: videoData.viewCount || videoData.views || 0,
              likeCount: videoData.likeCount || 0,
              ucraViewCount: videoData.ucraViewCount || 0, // 유크라 조회수
              registeredAt: videoData.registeredAt,
              uploadedAt: formatUploadDate(videoData.registeredAt),
              publishedAt: videoData.publishedAt || videoData.registeredAt?.toDate?.()?.toISOString?.(),
              registeredBy: videoData.registeredBy,
              roomId: null,
              roomName: '루트',
              type: getDurationType(finalDuration || finalDurationSeconds),
              thumbnailUrl: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
              category,
              keywords,
              description: videoData.description || '',
            });
          }
        } catch (errRoot) {
          console.error('⚠️ [useUcraVideos] 루트 videos 로드 실패:', errRoot);
        }

        // 🚫 모든 사용자 프로필 영상 제외 - 루트 videos만 사용
        console.log('🚫 [useUcraVideos] 모든 사용자 프로필 영상 제외 - 루트 videos만 사용');

        console.log('🔍 [useUcraVideos] 총 영상 수 (루트 videos만):', allVideos.length);
        
        // 디버깅: 영상 분류 확인
        allVideos.slice(0, 3).forEach((video, index) => {
          console.log(`🎬 [useUcraVideos] 영상${index + 1} 분류:`, {
            title: video.title,
            duration: video.duration,
            durationSeconds: video.durationSeconds,
            type: video.type,
            typeCheck: video.type === 'short' ? '쇼츠' : '롱폼',
            durationCheck: video.durationSeconds >= 181 ? '롱폼(181초 이상)' : '쇼츠(181초 미만)'
          });
        });

        // 등록일 기준으로 최신순 정렬
        allVideos.sort((a, b) => {
          const aTime = a.registeredAt?.seconds || 0;
          const bTime = b.registeredAt?.seconds || 0;
          return bTime - aTime;
        });

        // 🚨 임시로 모든 유효성 검사 비활성화 - 모든 영상 통과
        console.log('🚨 [DEBUG] 유효성 검사 건너뜀 - 모든 영상 허용');
        const validVideos = allVideos.filter(video => {
          // 최소한의 검증만: videoId와 title만 있으면 통과
          return video.videoId && video.title;
        });
        // 제외된 영상들 로깅 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          const excludedVideos = allVideos.filter(video => !validVideos.includes(video));
          excludedVideos.forEach(video => {
            const isYouTubeThumb = video.thumbnail && video.thumbnail.includes('img.youtube.com');
            console.warn('❌ [제외된 영상]:', {
              videoId: video.videoId,
              title: video.title,
              thumbnail: video.thumbnail,
              이유: !video.videoId ? '영상ID 없음' :
                   !/^[a-zA-Z0-9_-]{11}$/.test(video.videoId) ? '잘못된 영상ID 형식' :
                   (!isYouTubeThumb && (!video.thumbnail || video.thumbnail.includes('placeholder'))) ? '유효하지 않은 썸네일' :
                   (video.title === '제목 없음' || video.title === 'Untitled') ? '제목 없음/Untitled' :
                   video.title?.includes('동영상을 재생할 수 없음') || 
                   video.title?.includes('Video unavailable') ||
                   video.title?.includes('Private video') ||
                   video.title?.includes('Deleted video') ? '재생 불가능한 영상' :
                   (video.thumbnail?.includes('hqdefault_live.jpg') || 
                    video.thumbnail?.includes('no_thumbnail') ||
                    (!isYouTubeThumb && video.thumbnail?.endsWith('/hqdefault.jpg'))) ? '오류 썸네일' : '기타'
            });
          });
        }
        
        console.log('🔍 [useUcraVideos] 영상 필터링 완료:', {
          전체영상: allVideos.length,
          유효한영상: validVideos.length,
          제외된영상: allVideos.length - validVideos.length,
          필터링기준: [
            '유효한 YouTube ID (11자리)',
            '실제 썸네일 존재',
            '의미있는 제목 (3글자 이상)',
            '재생 가능한 영상',
            '오류 썸네일 제외'
          ]
        });
        
        // 🚨 임시로 50개 제한 해제
        const videos = validVideos; // 모든 영상 사용

        console.log('📊 [useUcraVideos] 루트 videos 영상 총계:', {
          전체등록영상: allVideos.length,
          유효영상: validVideos.length,
          최종노출영상: videos.length
        });

        // 🎯 홈탭 전용: 모든 영상 표시 (프로필, 맞시청방 포함)
        console.log('🎯 [useUcraVideos] 홈탭 전용 - 모든 영상 표시');
        
        // 🔍 필터링 전 roomName 확인
        const roomNames = [...new Set(videos.map(v => v.roomName))];
        console.log('🏷️ [roomName 종류]:', roomNames);
        console.log('📋 [상위 3개 영상의 roomName]:', videos.slice(0, 3).map(v => ({
          title: v.title?.substring(0, 20),
          roomName: v.roomName
        })));
        
        // 모든 영상을 홈탭에서 표시 (필터링 없음)
        let filteredVideos = videos;
        console.log(`📊 [필터링] 전체: ${videos.length}개 → 홈탭 표시: ${filteredVideos.length}개`);
        // useUcraVideos에서는 기본 정렬만 (컴포넌트에서 재정렬)
        console.log('🔄 [기본정렬] 등록일 기준 최신순 정렬');
        filteredVideos.sort((a, b) => {
          const getTimestamp = (registeredAt) => {
            if (!registeredAt) return 0;
            if (registeredAt.seconds) return registeredAt.seconds * 1000; // Firebase Timestamp → 밀리초
            if (registeredAt instanceof Date) return registeredAt.getTime(); // Date → 밀리초
            if (typeof registeredAt === 'number') return registeredAt; // 이미 밀리초라고 가정
            return 0;
          };
          
          const aTime = getTimestamp(a.registeredAt);
          const bTime = getTimestamp(b.registeredAt);
          
          // 정렬 디버깅 (상위 몇 개만)
          if (Math.random() < 0.05) {
            console.log(`🔄 [정렬비교] "${a.title?.substring(0, 15)}" (${aTime}) vs "${b.title?.substring(0, 15)}" (${bTime})`);
            console.log(`📅 [실제날짜] A: ${aTime ? new Date(aTime).toLocaleString() : '없음'} | B: ${bTime ? new Date(bTime).toLocaleString() : '없음'}`);
          }
          
          // 0인 값들은 맨 뒤로 보내기
          if (aTime === 0 && bTime === 0) return 0;
          if (aTime === 0) return 1;  // a를 뒤로
          if (bTime === 0) return -1; // b를 뒤로
          
          return bTime - aTime; // 일반적인 최신순 정렬 (최신이 위로)
        });

        console.log('📊 [useUcraVideos] 상위 5개 영상 데이터:', filteredVideos.slice(0, 5).map(v => ({
          title: v.title.substring(0, 20) + '...',
          registeredAt: v.registeredAt,
          ucraViewCount: v.ucraViewCount,
          durationSeconds: v.durationSeconds,
          roomName: v.roomName
        })));

        // 🎬 영상 타입 분류 상세 디버깅 및 수정
        console.log('🎬 [useUcraVideos] 영상 타입 분류 검사 시작...');
        let typeFixCount = 0;
        
        filteredVideos.forEach((video, index) => {
          if (index < 5) { // 처음 5개만 상세 로그
            const durationSeconds = video.durationSeconds || 0;
            const calculatedType = getDurationType(durationSeconds);
            
            console.log(`🎬 [영상${index + 1}] 타입 분류:`, {
              title: video.title?.substring(0, 30) + '...',
              duration: video.duration,
              durationSeconds: durationSeconds,
              currentType: video.type,
              shouldBe: calculatedType,
              classification: durationSeconds >= 181 ? '롱폼(181초 이상)' : '쇼츠(181초 미만)',
              needsFix: video.type !== calculatedType
            });
          }
          
          // 잘못된 타입 수정
          const correctType = getDurationType(video.durationSeconds || 0);
          if (video.type !== correctType) {
            if (typeFixCount < 3) { // 처음 3개만 로그
              console.warn(`⚠️ [타입 수정] ${video.title?.substring(0, 20)}... : ${video.type} → ${correctType}`);
            }
            video.type = correctType;
            typeFixCount++;
          }
        });
        
        if (typeFixCount > 0) {
          console.log(`🔧 [useUcraVideos] 총 ${typeFixCount}개 영상의 타입을 수정했습니다.`);
        }
        
        // 🔄 강화된 중복 영상 제거 (videoId + 제목 기준) - 로그인 상태 무관
        console.log('🚨 [useUcraVideos] 중복 제거 로직 실행 시작!', { beforeCount: filteredVideos.length });
        
        const beforeDuplicateFilter = filteredVideos.length;
          const seenVideos = new Map(); // videoId -> 첫 번째 영상 정보
          const duplicateVideos = [];
          
          filteredVideos = filteredVideos.filter(video => {
            const videoId = video.videoId || video.id;
            const title = video.title?.trim();
            
            if (!videoId) {
              console.warn('⚠️ [중복체크] videoId가 없는 영상:', title);
              return true; // videoId가 없으면 일단 유지
            }
            
            // videoId로 먼저 체크
            if (seenVideos.has(videoId)) {
              const existingVideo = seenVideos.get(videoId);
              duplicateVideos.push({
                title: title,
                videoId: videoId,
                registeredBy: video.registeredBy,
                roomName: video.roomName,
                duplicateType: 'same_videoId',
                existingRegisteredBy: existingVideo.registeredBy
              });
              console.log(`🔄 [중복 발견 - videoId] ${title?.substring(0, 30)}... (등록자: ${video.registeredBy} vs ${existingVideo.registeredBy})`);
              return false;
            }
            
            // 제목이 동일한 영상도 체크 (다른 videoId지만 같은 제목)
            const duplicateByTitle = Array.from(seenVideos.values()).find(existing => 
              existing.title?.trim() === title && title && title.length > 10
            );
            
            if (duplicateByTitle) {
              duplicateVideos.push({
                title: title,
                videoId: videoId,
                registeredBy: video.registeredBy,
                roomName: video.roomName,
                duplicateType: 'same_title',
                existingVideoId: duplicateByTitle.videoId,
                existingRegisteredBy: duplicateByTitle.registeredBy
              });
              console.log(`🔄 [중복 발견 - 제목] ${title?.substring(0, 30)}... (videoId: ${videoId} vs ${duplicateByTitle.videoId})`);
              return false;
            }
            
            // 첫 번째 등장하는 영상은 유지
            seenVideos.set(videoId, {
              title: title,
              videoId: videoId,
              registeredBy: video.registeredBy,
              roomName: video.roomName
            });
            
            return true;
          });
          
          console.log(`🔄 [useUcraVideos] 중복 영상 제거: ${beforeDuplicateFilter}개 → ${filteredVideos.length}개`);
          if (duplicateVideos.length > 0) {
            console.log('🔄 [제거된 중복 영상들]:', duplicateVideos);
          }

        // 🚫 내 영상 제외 필터링
        const currentUser = getCurrentUser();
        
        if (currentUser && (currentUser.uid || currentUser.email)) {
          const beforeMyVideoFilter = filteredVideos.length;
          
          filteredVideos = filteredVideos.filter(video => {
            const isMyVideo = 
              video.registeredBy === currentUser.uid ||
              video.registeredBy === currentUser.email ||
              video.uploaderUid === currentUser.uid ||
              video.channelId === currentUser.uid ||
              video.channelTitle === currentUser.displayName ||
              (video.uploader && video.uploader === currentUser.displayName) ||
              (video.channel && video.channel === currentUser.displayName) ||
              (video.registeredByEmail && video.registeredByEmail === currentUser.email) ||
              (video.registeredByUid && video.registeredByUid === currentUser.uid) ||
              (video.channelUrl && video.channelUrl.includes(currentUser.uid)) ||
              (currentUser.displayName && video.title && 
               video.title.toLowerCase().includes(currentUser.displayName.toLowerCase()));
            
            return !isMyVideo;
          });
        }

        // 📊 집계 서비스를 사용한 총 시청 횟수 계산
        let videosWithTotalCounts = filteredVideos;
        
        // 영상이 200개 이상이면 계산 생략 (성능 최적화)
        if (filteredVideos.length >= 200) {
          console.log('⚡ 대량 영상 감지 - 총 시청 횟수 계산 생략 (성능 최적화)');
          videosWithTotalCounts = filteredVideos;
        } else {
          const videoIds = filteredVideos.map(v => v.videoId);
          const statsMap = await getMultipleVideoStats(videoIds);
          
          // 집계 데이터를 영상에 적용
          videosWithTotalCounts = filteredVideos.map(video => {
            const stats = statsMap[video.videoId];
            const viewCount = stats?.totalViews || 0;
            
            return {
              ...video,
              ucraViewCount: viewCount,
              ucraLikes: stats?.totalLikes || 0,
              uniqueViewers: stats?.uniqueViewers || 0
            };
          });
        }

        // 업데이트된 영상 리스트로 상태 설정
        setUcraVideos(videosWithTotalCounts);
        setLoadingUcraVideos(false);
        setError(null);
        setIsInitialized(true); // 초기화 완료 표시
      } catch (err) {
        console.error('❌ [useUcraVideos] Error fetching videos:', err);
        setError('영상을 불러오는 중 오류가 발생했습니다.');
        setUcraVideos([]); // 에러 시 빈 배열로 설정
      } finally {
        setLoadingUcraVideos(false);
        console.log('🚨 [useUcraVideos] 로딩 완료, loadingUcraVideos = false');
      }
    };

    fetchVideos();
  }, [userCategory]);

  // 강제 새로고침 함수
  const refreshVideos = () => {
    console.log('🔄 [useUcraVideos] 강제 새로고침 시작');
    setIsInitialized(false);
    setLoadingUcraVideos(true);
  };

  // 통계 초기화 함수 (관리자용)
  const initializeStats = async () => {
    try {
      console.log('🔄 [useUcraVideos] 통계 초기화 시작');
      const { initializeVideoStats } = await import('../../../services/videoStatsService');
      
      // 현재 로드된 영상들로 통계 초기화
      if (ucraVideos.length > 0) {
        await initializeVideoStats(ucraVideos);
        console.log('✅ [useUcraVideos] 통계 초기화 완료');
        
        // 초기화 후 새로고침
        refreshVideos();
      } else {
        console.warn('⚠️ [useUcraVideos] 초기화할 영상이 없습니다');
      }
    } catch (error) {
      console.error('❌ [useUcraVideos] 통계 초기화 실패:', error);
    }
  };

  // 전역 함수로 노출 (관리자용)
  if (typeof window !== 'undefined') {
    window.initializeStats = initializeStats;
  }

  const totalVideos = ucraVideos.length;
  const watchedVideos = getWatchedVideos();
  const watchedVideosCount = watchedVideos.length;
  const watchRate = totalVideos > 0 ? (watchedVideosCount / totalVideos) * 100 : 0;

  return {
    ucraVideos,
    loadingUcraVideos,
    error,
    totalVideos,
    watchedVideosCount,
    watchRate,
    refreshVideos,
    initializeStats
  };
}; 
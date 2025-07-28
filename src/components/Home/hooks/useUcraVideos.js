import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc, where, onSnapshot } from 'firebase/firestore';
import { CATEGORY_KEYWORDS } from '../utils/constants';
import { useWatchedVideos } from '../../../contexts/WatchedVideosContext';
// import { useVideoDurations, useSetVideoDuration } from '../../../contexts/VideoDurationContext';
import { computeUniqueVideos } from '../utils/dataProcessing';
import { filterVideosByRecommendedCategories } from '../utils/dataProcessing';

// YouTube API에서 영상 정보 가져오기
const fetchYoutubeVideoInfo = async (videoId) => {
  try {
    const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
    console.log(`🔑 API_KEY: ${videoId} - ${API_KEY ? '있음' : '없음'}`);
    
    if (!API_KEY) {
      console.warn(`❌ API_KEY 없음: ${videoId}`);
      return null;
    }
    
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${API_KEY}`;
    console.log(`🌐 API 호출: ${videoId}`);
    
    const response = await fetch(url);
    console.log(`📡 응답: ${videoId} - ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ HTTP 에러: ${videoId} - ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`❌ YouTube API 에러: ${videoId} -`, data.error.message);
      return null;
    }
    
    if (data.items && data.items.length > 0) {
      console.log(`✅ 성공: ${videoId} - duration: ${data.items[0].contentDetails?.duration}`);
      return data.items[0];
    }
    
    console.warn(`⚠️ 영상 없음: ${videoId}`);
    return null;
  } catch (error) {
    console.error(`❌ 예외: ${videoId} -`, error.message);
    return null;
  }
};

// 간단한 대체 함수들
const extractCategoryFromTitle = (title, description = '') => {
  return '일반'; // 기본값 반환
};

const extractKeywordsFromTitle = (title, description = '') => {
  return []; // 빈 배열 반환
};

const formatDuration = (duration) => {
  console.log('🔍 [formatDuration] 입력값:', duration, '타입:', typeof duration);
  
  if (!duration) {
    console.log('❌ [formatDuration] duration이 없음');
    return '0:00';
  }
  
  // YouTube API ISO 8601 형식 처리 (예: "PT6M8S", "PT2M56S")
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    console.log('📹 [formatDuration] YouTube API 형식 감지:', duration);
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      const result = hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
      console.log('✅ [formatDuration] 변환 결과:', result);
      return result;
    }
  }
  
  // 숫자로 변환 (초 단위)
  const seconds = parseInt(duration);
  console.log('🔢 [formatDuration] 숫자 변환:', seconds);
  if (!seconds || isNaN(seconds) || seconds <= 0) {
    console.log('❌ [formatDuration] 유효하지 않은 숫자');
    return '0:00';
  }
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const result = h > 0 
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
  
  console.log('✅ [formatDuration] 최종 결과:', result);
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
    const fetchVideos = async () => {
      try {
        setLoadingUcraVideos(true);
        setError(null);

        console.log('🔍 [useUcraVideos] 유크라 업로드 영상 로딩 시작');
        
        // 🚨 임시: 모든 필터링 비활성화하고 원본 데이터만 확인
        console.log('🚨 [DEBUG MODE] 모든 필터링 비활성화 - 원본 데이터 확인');

        // 모든 채팅방의 영상을 통합해서 가져오기
        const roomsQuery = query(collection(db, "chatRooms"));
        const roomsSnapshot = await getDocs(roomsQuery);
        
        console.log('🔍 [Firebase 디버깅] 채팅방 정보:', {
          채팅방개수: roomsSnapshot.size,
          채팅방목록: roomsSnapshot.docs.map(doc => ({
            id: doc.id,
            데이터: doc.data()
          }))
        });
        
        let allVideos = [];
        
        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = roomDoc.data();
          console.log(`🔍 [Firebase] ${roomDoc.id} 채팅방 처리 중...`);
          
          // orderBy 없이 먼저 시도 (인덱스 문제 방지)
          try {
            const videosQuery = query(
              collection(db, "chatRooms", roomDoc.id, "videos"),
              orderBy("registeredAt", "desc")
            );
            const videosSnapshot = await getDocs(videosQuery);
            console.log(`✅ [Firebase] ${roomDoc.id} orderBy 성공:`, videosSnapshot.size);
          } catch (orderByError) {
            console.warn(`⚠️ [Firebase] ${roomDoc.id} orderBy 실패, 기본 쿼리로 재시도:`, orderByError);
            const videosQuery = collection(db, "chatRooms", roomDoc.id, "videos");
            const videosSnapshot = await getDocs(videosQuery);
            console.log(`🔄 [Firebase] ${roomDoc.id} 기본 쿼리 결과:`, videosSnapshot.size);
          }
          
          // 실제 사용할 쿼리
          const videosQuery = collection(db, "chatRooms", roomDoc.id, "videos");
          const videosSnapshot = await getDocs(videosQuery);
          
          console.log(`🔍 [Firebase] ${roomDoc.id} 채팅방 영상:`, {
            영상개수: videosSnapshot.size,
            영상목록: videosSnapshot.docs.map(doc => ({
              id: doc.id,
              데이터: doc.data()
            }))
          });
          
          for (const videoDoc of videosSnapshot.docs) {
            const videoData = videoDoc.data();
            if (videoData.videoId) {
              // 카테고리 정보가 없으면 제목에서 추출
              let category = videoData.category;
              let keywords = videoData.keywords || [];
              
              if (!category) {
                category = extractCategoryFromTitle(videoData.title || '', videoData.description || '');
                keywords = extractKeywordsFromTitle(videoData.title || '', videoData.description || '');
              }
              
              // duration이 없으면 YouTube API에서 가져오기
              let duration = videoData.duration;
              let durationSeconds = 0;
              
              console.log(`🔍 영상 확인: ${videoData.videoId} - duration: ${videoData.duration}`);
              
              // 항상 YouTube API에서 최신 duration 가져오기
              if (true) {
                try {
                  const youtubeInfo = await fetchYoutubeVideoInfo(videoData.videoId);
                  
                  if (youtubeInfo && youtubeInfo.contentDetails) {
                    duration = youtubeInfo.contentDetails.duration; // PT1M30S 형식
                    
                    // duration을 초 단위로 변환
                    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                    if (match) {
                      const hours = parseInt(match[1] || 0);
                      const minutes = parseInt(match[2] || 0);
                      const seconds = parseInt(match[3] || 0);
                      durationSeconds = hours * 3600 + minutes * 60 + seconds;
                      console.log(`✅ 변환 성공: ${videoData.videoId} - ${durationSeconds}초`);
                    } else {
                      console.warn(`⚠️ 파싱 실패: ${videoData.videoId} - ${duration}`);
                    }
                  }
                } catch (error) {
                  console.error(`❌ API 실패: ${videoData.videoId} - ${error.message}`);
                }
              }
              
              // YouTube API 실패 시 기존 duration 사용 (Fallback)
              if (!durationSeconds || durationSeconds === 0) {
                console.log(`🔄 Fallback: ${videoData.videoId}`);
                if (videoData.duration) {
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
                    // "1:30" 형식 처리
                    const parts = videoData.duration.split(':').map(Number);
                    if (parts.length === 2) {
                      durationSeconds = parts[0] * 60 + parts[1];
                    } else if (parts.length === 3) {
                      durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    }
                  }
                }
              }
              
              // Context에서 duration 확인 (임시 비활성화)
              // const contextDuration = durations[videoData.videoId];
              const finalDuration = duration;
              const finalDurationSeconds = durationSeconds;
              
              const videoObject = {
                id: videoDoc.id,
                videoId: videoData.videoId,
                title: videoData.title || '제목 없음',
                thumbnail: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
                channel: videoData.channelTitle || videoData.channel || '채널명 없음',
                channelId: videoData.channelId,
                channelTitle: videoData.channelTitle || videoData.channel || '채널명 없음',
                duration: finalDuration, // Context 우선 사용
                durationSeconds: finalDurationSeconds, // Context 우선 사용
                durationDisplay: formatDuration(durationSeconds),
                views: videoData.views || 0,
                viewCount: videoData.viewCount || videoData.views || 0,
                likeCount: videoData.likeCount || 0,
                ucraViewCount: videoData.ucraViewCount || 0, // 유크라 조회수
                registeredAt: videoData.registeredAt,
                uploadedAt: formatUploadDate(videoData.registeredAt),
                publishedAt: videoData.publishedAt || videoData.registeredAt?.toDate?.()?.toISOString?.(),
                registeredBy: videoData.registeredBy,
                roomId: roomDoc.id,
                roomName: roomData.name || '채팅방',
                type: getDurationType(finalDuration || finalDurationSeconds),
                thumbnailUrl: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
                category: category, // 카테고리 추가
                keywords: keywords, // 키워드 추가
                description: videoData.description || '', // 설명 추가
              };
              
              // Context에 duration 저장 (임시 비활성화)
              // if (finalDuration && !contextDuration) {
              //   setDuration(videoData.videoId, {
              //     formatted: videoObject.durationDisplay,
              //     seconds: finalDurationSeconds,
              //     raw: finalDuration
              //   });
              // }
              
              console.log(`📊 최종 결과: ${videoData.videoId} - ${videoObject.durationDisplay} (${durationSeconds}초)`);
              
              allVideos.push(videoObject);
            }
          }
        }

        // ✅ 루트 videos 컬렉션 영상도 추가
        try {
          const rootVideosQuery = query(collection(db, "videos"), orderBy("registeredAt", "desc"));
          const rootVideosSnap = await getDocs(rootVideosQuery);
          console.log('🔍 [useUcraVideos] 루트 videos 컬렉션 수:', rootVideosSnap.size);

          for (const docSnap of rootVideosSnap.docs) {
            const videoData = docSnap.data();
            if (!videoData.videoId) continue;

            let category = videoData.category;
            let keywords = videoData.keywords || [];
            if (!category) {
              category = extractCategoryFromTitle(videoData.title || '', videoData.description || '');
              keywords = extractKeywordsFromTitle(videoData.title || '', videoData.description || '');
            }
            
            // duration이 없으면 YouTube API에서 가져오기
            let duration = videoData.duration;
            let durationSeconds = 0;
            
            console.log(`🔍 루트 영상: ${videoData.videoId} - duration: ${videoData.duration}`);
            
            // 항상 YouTube API에서 최신 duration 가져오기
            if (true) {
              try {
                const youtubeInfo = await fetchYoutubeVideoInfo(videoData.videoId);
                
                if (youtubeInfo && youtubeInfo.contentDetails) {
                  duration = youtubeInfo.contentDetails.duration; // PT1M30S 형식
                  
                  // duration을 초 단위로 변환
                  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                  if (match) {
                    const hours = parseInt(match[1] || 0);
                    const minutes = parseInt(match[2] || 0);
                    const seconds = parseInt(match[3] || 0);
                    durationSeconds = hours * 3600 + minutes * 60 + seconds;
                    console.log(`✅ 루트 변환 성공: ${videoData.videoId} - ${durationSeconds}초`);
                  } else {
                    console.warn(`⚠️ 루트 파싱 실패: ${videoData.videoId} - ${duration}`);
                  }
                }
              } catch (error) {
                console.error(`❌ 루트 API 실패: ${videoData.videoId} - ${error.message}`);
              }
            }
            
            // YouTube API 실패 시 기존 duration 사용 (Fallback)
            if (!durationSeconds || durationSeconds === 0) {
              console.log(`🔄 루트 Fallback: ${videoData.videoId}`);
              if (videoData.duration) {
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
                  // "1:30" 형식 처리
                  const parts = videoData.duration.split(':').map(Number);
                  if (parts.length === 2) {
                    durationSeconds = parts[0] * 60 + parts[1];
                  } else if (parts.length === 3) {
                    durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                  }
                }
              }
            }

            allVideos.push({
              id: docSnap.id,
              videoId: videoData.videoId,
              title: videoData.title || '제목 없음',
              thumbnail: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
              channel: videoData.channelTitle || videoData.channel || '채널명 없음',
              channelId: videoData.channelId,
              channelTitle: videoData.channelTitle || videoData.channel || '채널명 없음',
              duration: duration,
              durationSeconds: durationSeconds,
              durationDisplay: formatDuration(durationSeconds),
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
              type: getDurationType(duration || durationSeconds),
              thumbnailUrl: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
              category,
              keywords,
              description: videoData.description || '',
            });
          }
        } catch (errRoot) {
          console.error('⚠️ [useUcraVideos] 루트 videos 로드 실패:', errRoot);
        }

        // 🆕 모든 사용자 프로필의 myVideos 추가
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          console.log('🔍 [useUcraVideos] 사용자 프로필 수:', usersSnap.size);

          usersSnap.forEach(userDoc => {
            const userData = userDoc.data();
            const userUid = userDoc.id;
            if (Array.isArray(userData.myVideos)) {
              userData.myVideos.forEach(v => {
                // durationSeconds 계산
                let durationSeconds = v.durationSeconds;
                console.log(`🔍 [myVideos] ${v.videoId || v.id} - 초기 durationSeconds:`, durationSeconds, 'duration:', v.duration);
                
                if (!durationSeconds && v.duration) {
                  if (typeof v.duration === 'number') {
                    durationSeconds = v.duration;
                    console.log(`✅ [myVideos] 숫자 변환: ${v.videoId || v.id} - ${durationSeconds}초`);
                  } else if (typeof v.duration === 'string') {
                    // ISO 8601 형식 처리 (예: "PT6M8S", "PT2M56S")
                    if (v.duration.startsWith('PT')) {
                      const match = v.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                      if (match) {
                        const hours = parseInt(match[1] || 0);
                        const minutes = parseInt(match[2] || 0);
                        const seconds = parseInt(match[3] || 0);
                        durationSeconds = hours * 3600 + minutes * 60 + seconds;
                        console.log(`✅ [myVideos] ISO 변환: ${v.videoId || v.id} - ${durationSeconds}초 (${hours}h ${minutes}m ${seconds}s)`);
                      } else {
                        console.warn(`⚠️ [myVideos] ISO 파싱 실패: ${v.videoId || v.id} - ${v.duration}`);
                      }
                    } else if (v.duration.includes(':')) {
                      // "1:30" 형식 처리
                      const parts = v.duration.split(':').map(Number);
                      if (parts.length === 2) {
                        durationSeconds = parts[0] * 60 + parts[1];
                        console.log(`✅ [myVideos] MM:SS 변환: ${v.videoId || v.id} - ${durationSeconds}초`);
                      } else if (parts.length === 3) {
                        durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                        console.log(`✅ [myVideos] HH:MM:SS 변환: ${v.videoId || v.id} - ${durationSeconds}초`);
                      } else {
                        console.warn(`⚠️ [myVideos] 시간 형식 파싱 실패: ${v.videoId || v.id} - ${v.duration}`);
                      }
                    } else {
                      console.warn(`⚠️ [myVideos] 알 수 없는 duration 형식: ${v.videoId || v.id} - ${v.duration}`);
                    }
                  }
                }
                
                console.log(`📊 [myVideos] 최종 결과: ${v.videoId || v.id} - durationSeconds: ${durationSeconds}`);

                allVideos.push({
                  id: v.id || v.videoId,
                  videoId: v.videoId || v.id,
                  title: v.title || '제목 없음',
                  thumbnail: v.thumbnail || v.thumbnailUrl || `https://img.youtube.com/vi/${v.videoId || v.id}/mqdefault.jpg`,
                  channel: v.channelTitle || v.channel || '채널명 없음',
                  channelId: v.channelId || userUid,
                  channelTitle: v.channelTitle || v.channel || '채널명 없음',
                  duration: v.duration,
                  durationSeconds: durationSeconds || 0,
                  durationDisplay: formatDuration(durationSeconds || 0),
                  views: v.views || 0,
                  viewCount: v.viewCount || v.views || 0,
                  likeCount: v.likeCount || 0,
                  ucraViewCount: v.ucraViewCount || 0,
                  registeredAt: v.registeredAt || v.publishedAt || new Date(),
                  uploadedAt: v.publishedAt || '',
                  publishedAt: v.publishedAt || '',
                  registeredBy: userUid,
                  roomId: null,
                  roomName: '프로필',
                  type: v.type || getDurationType(durationSeconds),
                  thumbnailUrl: v.thumbnail || v.thumbnailUrl || `https://img.youtube.com/vi/${v.videoId || v.id}/mqdefault.jpg`,
                  category: v.category || null,
                  keywords: v.keywords || [],
                  description: v.description || '',
                });
              });
            }
          });
        } catch (userErr) {
          console.error('⚠️ [useUcraVideos] 사용자 프로필 myVideos 로드 실패:', userErr);
        }

        console.log('🔍 [useUcraVideos] 총 영상 수 (chatRooms + root + profiles):', allVideos.length);
        
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

        console.log('📊 [useUcraVideos] 서버 등록 영상 총계:', {
          채팅방수: roomsSnapshot.size,
          전체등록영상: allVideos.length,
          유효영상: validVideos.length,
          최종노출영상: videos.length
        });

        // 🚨 카테고리 필터링 완전 제거 - 모든 영상 표시
        console.log('🚨 [useUcraVideos] 카테고리 필터링 제거 - 모든 영상 표시');
        let filteredVideos = videos;
        // useUcraVideos에서는 기본 정렬만 (컴포넌트에서 재정렬)
        console.log('🔄 [기본정렬] 등록일 기준 최신순 정렬');
        filteredVideos.sort((a, b) => {
          const aTime = a.registeredAt?.seconds || a.registeredAt?.getTime?.() || 0;
          const bTime = b.registeredAt?.seconds || b.registeredAt?.getTime?.() || 0;
          return bTime - aTime;
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
        console.log('🚨 [useUcraVideos] 내 영상 제거 체크:', {
          currentUser: currentUser,
          hasUid: !!currentUser?.uid,
          hasEmail: !!currentUser?.email,
          willExecuteMyVideoFilter: !!(currentUser && (currentUser.uid || currentUser.email))
        });
        
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
            
            if (isMyVideo) {
              console.log('🚫 [내 영상 제외]:', video.title);
            }
            return !isMyVideo;
          });
          
          console.log(`🚫 [useUcraVideos] 내 영상 필터링: ${beforeMyVideoFilter}개 → ${filteredVideos.length}개 (${beforeMyVideoFilter - filteredVideos.length}개 제외)`);
        }

        
        console.log('🚨 [useUcraVideos] setUcraVideos 호출:', {
          filteredVideosLength: filteredVideos.length,
          sampleTitles: filteredVideos.slice(0, 3).map(v => v.title)
        });
        
        // 🎬 디버깅용: 최종 영상 리스트 로그 (5개만)
        console.log('🏁 [useUcraVideos] 최종 영상 리스트 (처음 5개):');
        filteredVideos.slice(0, 5).forEach((video, index) => {
          console.log(`🎥 ${index + 1}.`, {
            title: video.title?.substring(0, 30) + '...',
            videoId: video.videoId,
            channel: video.channelTitle || video.channel,
            duration: video.durationDisplay || video.duration,
            type: video.type,
            ucraViewCount: video.ucraViewCount,
            roomName: video.roomName
          });
        });

        // 📊 실시간으로 총 시청 횟수 계산 적용
        console.log('📊 [useUcraVideos] 실시간 총 시청 횟수 계산 시작...');
        const videosWithTotalCounts = await calculateTotalViewCounts(filteredVideos);
        console.log('✅ [useUcraVideos] 총 시청 횟수 계산 완료');

        // 업데이트된 영상 리스트로 상태 설정
        setUcraVideos(videosWithTotalCounts);
        setLoadingUcraVideos(false);
        setError(null);
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
    watchRate
  };
}; 
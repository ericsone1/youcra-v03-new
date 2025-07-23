import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { CATEGORY_KEYWORDS } from '../utils/constants';
import { useWatchedVideos } from '../../../contexts/WatchedVideosContext';

// YouTube API에서 영상 정보 가져오기
const fetchYoutubeVideoInfo = async (videoId) => {
  try {
    const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
    if (!API_KEY) {
      console.warn('YouTube API 키가 없습니다.');
      return null;
    }
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${API_KEY}`
    );
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0];
    }
    return null;
  } catch (error) {
    console.error('YouTube API 오류:', error);
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
  if (!duration) return '0:00';
  return '0:00'; // 기본값 반환
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

export const useUcraVideos = (userCategory = null) => {
  const [ucraVideos, setUcraVideos] = useState([]);
  const [loadingUcraVideos, setLoadingUcraVideos] = useState(true);
  const [error, setError] = useState(null);
  const { getWatchedVideos } = useWatchedVideos();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoadingUcraVideos(true);
        setError(null);

        console.log('🔍 [useUcraVideos] 유크라 업로드 영상 로딩 시작');

        // 모든 채팅방의 영상을 통합해서 가져오기
        const roomsQuery = query(collection(db, "chatRooms"));
        const roomsSnapshot = await getDocs(roomsQuery);
        
        let allVideos = [];
        
        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = roomDoc.data();
          const videosQuery = query(
            collection(db, "chatRooms", roomDoc.id, "videos"),
            orderBy("registeredAt", "desc")
          );
          const videosSnapshot = await getDocs(videosQuery);
          
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
              
              console.log(`🔍 [useUcraVideos] 영상 duration 확인:`, {
                videoId: videoData.videoId,
                title: videoData.title,
                originalDuration: videoData.duration
              });
              
              if (!duration || duration === 0) {
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
                    }
                  }
                } catch (error) {
                  console.error('YouTube API 호출 실패:', error);
                }
              } else {
                // 기존 duration 처리
                durationSeconds = typeof duration === 'number' ? duration : 
                  (typeof duration === 'string' && duration.startsWith('PT') ? 
                    (() => {
                      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                      if (match) {
                        const hours = parseInt(match[1] || 0);
                        const minutes = parseInt(match[2] || 0);
                        const seconds = parseInt(match[3] || 0);
                        return hours * 3600 + minutes * 60 + seconds;
                      }
                      return 0;
                    })() : 0);
              }
              
              allVideos.push({
                id: videoDoc.id,
                videoId: videoData.videoId,
                title: videoData.title || '제목 없음',
                thumbnail: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
                channel: videoData.channelTitle || videoData.channel || '채널명 없음',
                channelId: videoData.channelId,
                channelTitle: videoData.channelTitle || videoData.channel || '채널명 없음',
                duration: duration, // 업데이트된 duration 사용
                durationSeconds: durationSeconds, // 업데이트된 durationSeconds 사용
                durationDisplay: formatDuration(videoData.duration),
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
              type: getDurationType(duration || durationSeconds),
              thumbnailUrl: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
              category: category, // 카테고리 추가
              keywords: keywords, // 키워드 추가
              description: videoData.description || '', // 설명 추가
              });
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
            
            if (!duration || duration === 0) {
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
                  }
                }
              } catch (error) {
                console.error('YouTube API 호출 실패:', error);
              }
            } else {
              // 기존 duration 처리
              durationSeconds = typeof duration === 'number' ? duration : 
                (typeof duration === 'string' && duration.startsWith('PT') ? 
                  (() => {
                    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                    if (match) {
                      const hours = parseInt(match[1] || 0);
                      const minutes = parseInt(match[2] || 0);
                      const seconds = parseInt(match[3] || 0);
                      return hours * 3600 + minutes * 60 + seconds;
                    }
                    return 0;
                  })() : 0);
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
              durationDisplay: formatDuration(videoData.duration),
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

        console.log('🔍 [useUcraVideos] 총 영상 수 (chatRooms + root):', allVideos.length);
        
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

        // 유효한 썸네일이 있는 영상만 필터링
        const validVideos = allVideos.filter(video => {
          // 기본 필드 검증
          if (!video.videoId || !video.title) return false;
          // YouTube 영상 ID 유효성 검증 (11자리 영문숫자 조합)
          const isValidVideoId = /^[a-zA-Z0-9_-]{11}$/.test(video.videoId);
          if (!isValidVideoId) return false;
          // 썸네일 검증 - img.youtube.com이 포함된 썸네일은 무조건 허용
          const isYouTubeThumb = video.thumbnail && video.thumbnail.includes('img.youtube.com');
          const hasValidThumbnail = isYouTubeThumb || (
            video.thumbnail &&
            video.thumbnail !== 'https://via.placeholder.com/320x180/cccccc/ffffff?text=영상' &&
            !video.thumbnail.includes('placeholder') &&
            (video.thumbnail.includes('youtube') || video.thumbnail.includes('http'))
          );
          // 제목이 너무 짧거나 의미없는 경우 제외 (3글자 제한 제거, '제목 없음'만 제외)
          const hasValidTitle = video.title && video.title !== '제목 없음' && video.title !== 'Untitled';
          // 재생 불가능한 영상 패턴 제외
          const playableVideo = video.title &&
            !video.title.includes('동영상을 재생할 수 없음') &&
            !video.title.includes('Video unavailable') &&
            !video.title.includes('Private video') &&
            !video.title.includes('Deleted video') &&
            !video.title.includes('[삭제된 동영상]') &&
            !video.title.includes('[비공개 동영상]') &&
            !video.title.toLowerCase().includes('this video is unavailable') &&
            !video.title.toLowerCase().includes('this video is private');
          // 썸네일이 기본 YouTube 오류 이미지인지 확인
          const notErrorThumbnail = video.thumbnail &&
            !video.thumbnail.includes('hqdefault_live.jpg') &&
            !video.thumbnail.includes('no_thumbnail') &&
            // YouTube의 기본 오류 썸네일 패턴 제외, 단 img.youtube.com이면 허용
            (!video.thumbnail.endsWith('/hqdefault.jpg') || isYouTubeThumb) &&
            !video.thumbnail.includes('default_120.jpg');
          return hasValidThumbnail && hasValidTitle && playableVideo && notErrorThumbnail;
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

        // 최대 50개로 제한
        const videos = validVideos.slice(0, 50);

        // 카테고리 필터링
        let filteredVideos = videos;
        if (userCategory && userCategory.id !== 'other') {
          const categoryKeywords = CATEGORY_KEYWORDS[userCategory.id] || [];
          filteredVideos = videos.filter(video => {
            const title = video.title?.toLowerCase() || '';
            const description = video.description?.toLowerCase() || '';
            const channelTitle = video.channel?.toLowerCase() || '';
            return categoryKeywords.some(keyword => 
              title.includes(keyword.toLowerCase()) ||
              description.includes(keyword.toLowerCase()) ||
              channelTitle.includes(keyword.toLowerCase())
            );
          });
        }
        // 조회수 기준 정렬 (문자열일 경우 숫자 변환 시도)
        filteredVideos.sort((a, b) => {
          const va = typeof a.views === 'string' ? parseInt(a.views.replace(/[^\d]/g, '')) : (a.views || 0);
          const vb = typeof b.views === 'string' ? parseInt(b.views.replace(/[^\d]/g, '')) : (b.views || 0);
          return vb - va;
        });
        setUcraVideos(filteredVideos);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('영상을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingUcraVideos(false);
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
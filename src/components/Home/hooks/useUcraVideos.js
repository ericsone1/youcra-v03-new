import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CATEGORY_KEYWORDS } from '../utils/constants';

// 재생 시간 포맷팅 함수
const formatDuration = (duration) => {
  if (typeof duration === 'string' && duration.includes(':')) {
    return duration;
  }
  
  const seconds = parseInt(duration);
  if (!seconds || isNaN(seconds) || seconds <= 0) return '시간 미확인';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// 업로드 날짜 포맷팅 함수
const formatUploadDate = (registeredAt) => {
  if (!registeredAt) return '등록일 없음';
  
  const date = registeredAt.toDate ? registeredAt.toDate() : new Date(registeredAt);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '오늘';
  else if (diffDays === 1) return '1일 전';
  else if (diffDays < 7) return `${diffDays}일 전`;
  else if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  else if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  else return `${Math.floor(diffDays / 365)}년 전`;
};

// 영상 타입 결정 함수
const getDurationType = (duration) => {
  const seconds = typeof duration === 'number' ? duration : parseInt(duration) || 0;
  return seconds <= 180 ? 'short' : 'long'; // 3분 기준
};

export const useUcraVideos = (userCategory = null) => {
  const [ucraVideos, setUcraVideos] = useState([]);
  const [loadingUcraVideos, setLoadingUcraVideos] = useState(true);
  const [error, setError] = useState(null);

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
          
          videosSnapshot.forEach(videoDoc => {
            const videoData = videoDoc.data();
            if (videoData.videoId) {
              allVideos.push({
                id: videoDoc.id,
                videoId: videoData.videoId,
                title: videoData.title || '제목 없음',
                thumbnail: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
                channel: videoData.channelTitle || videoData.channel || '채널명 없음',
                channelId: videoData.channelId,
                channelTitle: videoData.channelTitle || videoData.channel || '채널명 없음',
                duration: videoData.duration, // 문자열 또는 숫자
                durationSeconds: typeof videoData.duration === 'number' ? videoData.duration : 0,
                durationDisplay: formatDuration(videoData.duration),
                views: videoData.views || 0,
                viewCount: videoData.viewCount || videoData.views || 0,
                likeCount: videoData.likeCount || 0,
                registeredAt: videoData.registeredAt,
                uploadedAt: formatUploadDate(videoData.registeredAt),
                publishedAt: videoData.publishedAt || videoData.registeredAt?.toDate?.()?.toISOString?.(),
                registeredBy: videoData.registeredBy,
                roomId: roomDoc.id,
                roomName: roomData.name || '채팅방',
                type: getDurationType(videoData.duration),
                thumbnailUrl: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
              });
            }
          });
        }

        console.log('🔍 [useUcraVideos] 전체 채팅방 수:', roomsSnapshot.size);
        console.log('🔍 [useUcraVideos] 총 발견된 영상 수:', allVideos.length);

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

  return {
    ucraVideos,
    loadingUcraVideos,
    error
  };
}; 
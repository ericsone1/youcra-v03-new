import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CATEGORY_KEYWORDS } from '../utils/constants';

// 제목과 설명에서 카테고리 추출
function extractCategoryFromTitle(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  
  // 카테고리 매핑
  const categoryMap = {
    '게임': ['게임', '롤', 'lol', '리그오브레전드', '배그', 'pubg', '오버워치', 'fps', 'rpg', 'mmorpg'],
    '음악': ['음악', '노래', '뮤직', 'kpop', '힙합', '랩', '커버', '작곡', '연주'],
    '요리': ['요리', '레시피', '먹방', '맛집', '쿠킹', '베이킹', '음식', '식사'],
    '여행': ['여행', '브이로그', '여행기', '관광', '해외', '국내', '캠핑'],
    '뷰티': ['뷰티', '메이크업', '화장', '스킨케어', '패션', '헤어', '네일'],
    '일상': ['일상', '브이로그', '라이프', '생활', '집', '가족', '친구'],
    '교육': ['교육', '강의', '공부', '학습', '튜토리얼', '설명', '강좌'],
    '스포츠': ['스포츠', '축구', '농구', '야구', '운동', '헬스', '다이어트'],
    '리뷰': ['리뷰', '언박싱', '제품', '평가', '후기', '추천'],
    '엔터테인먼트': ['드라마', '영화', '애니', '예능', '코미디', '웃긴', '개그']
  };
  
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return '기타';
}

// 제목과 설명에서 키워드 추출
function extractKeywordsFromTitle(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  const allKeywords = [
    '게임', '롤', '음악', '노래', '요리', '레시피', '여행', '브이로그', '뷰티', '메이크업',
    '일상', '교육', '강의', '스포츠', '축구', '리뷰', '언박싱', '드라마', '영화', '애니'
  ];
  
  return allKeywords.filter(keyword => text.includes(keyword));
}

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
              // 카테고리 정보가 없으면 제목에서 추출
              let category = videoData.category;
              let keywords = videoData.keywords || [];
              
              if (!category) {
                category = extractCategoryFromTitle(videoData.title || '', videoData.description || '');
                keywords = extractKeywordsFromTitle(videoData.title || '', videoData.description || '');
              }
              
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
                category: category, // 카테고리 추가
                keywords: keywords, // 키워드 추가
                description: videoData.description || '', // 설명 추가
              });
            }
          });
        }

        // ✅ 루트 videos 컬렉션 영상도 추가
        try {
          const rootVideosQuery = query(collection(db, "videos"), orderBy("registeredAt", "desc"));
          const rootVideosSnap = await getDocs(rootVideosQuery);
          console.log('🔍 [useUcraVideos] 루트 videos 컬렉션 수:', rootVideosSnap.size);

          rootVideosSnap.forEach(docSnap => {
            const videoData = docSnap.data();
            if (!videoData.videoId) return;

            let category = videoData.category;
            let keywords = videoData.keywords || [];
            if (!category) {
              category = extractCategoryFromTitle(videoData.title || '', videoData.description || '');
              keywords = extractKeywordsFromTitle(videoData.title || '', videoData.description || '');
            }

            allVideos.push({
              id: docSnap.id,
              videoId: videoData.videoId,
              title: videoData.title || '제목 없음',
              thumbnail: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
              channel: videoData.channelTitle || videoData.channel || '채널명 없음',
              channelId: videoData.channelId,
              channelTitle: videoData.channelTitle || videoData.channel || '채널명 없음',
              duration: videoData.duration,
              durationSeconds: typeof videoData.duration === 'number' ? videoData.duration : 0,
              durationDisplay: formatDuration(videoData.duration),
              views: videoData.views || 0,
              viewCount: videoData.viewCount || videoData.views || 0,
              likeCount: videoData.likeCount || 0,
              registeredAt: videoData.registeredAt,
              uploadedAt: formatUploadDate(videoData.registeredAt),
              publishedAt: videoData.publishedAt || videoData.registeredAt?.toDate?.()?.toISOString?.(),
              registeredBy: videoData.registeredBy,
              roomId: null,
              roomName: '루트',
              type: getDurationType(videoData.duration),
              thumbnailUrl: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`,
              category,
              keywords,
              description: videoData.description || '',
            });
          });
        } catch (errRoot) {
          console.error('⚠️ [useUcraVideos] 루트 videos 로드 실패:', errRoot);
        }

        console.log('🔍 [useUcraVideos] 총 영상 수 (chatRooms + root):', allVideos.length);

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
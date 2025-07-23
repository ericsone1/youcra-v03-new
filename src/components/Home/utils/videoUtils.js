// 🎬 비디오 관련 유틸리티 함수
// 원본: Home_ORIGINAL_BACKUP.js에서 추출

export const computeUniqueVideos = (videosArr) => {
  const seen = new Set();
  return videosArr.filter(v => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });
};

// YouTube 영상 데이터를 홈 화면용 형식으로 변환
export const convertVideoData = (videoData, roomData, roomId) => {
  return {
    id: videoData.videoId || videoData.id,
    videoId: videoData.videoId || videoData.id,
    snippet: {
      title: videoData.title || '제목 없음',
      channelTitle: videoData.channelTitle || '알 수 없는 채널',
      channelId: videoData.channelId,
      thumbnails: {
        medium: {
          url: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId || videoData.id}/mqdefault.jpg`
        }
      }
    },
    statistics: {
      likeCount: videoData.likeCount || 0,
      viewCount: videoData.viewCount || 0
    },
    contentDetails: {
      duration: videoData.duration || 'PT0S'
    },
    roomName: roomData?.name || roomData?.title || '채팅방',
    roomId: roomId,
    registeredAt: videoData.registeredAt,
    registeredBy: videoData.registeredBy,
    certificationCount: videoData.certificationCount || 0,
    watchCount: videoData.watchCount || 0
  };
};

// 비디오 점수 계산 (인기도 기준)
export const calculateVideoScore = (video) => {
  const likes = Number(video.statistics?.likeCount || 0);
  const views = Number(video.statistics?.viewCount || 0);
  const certifications = Number(video.certificationCount || 0);
  const watchers = Number(video.watchCount || 0);
  
  // 가중치 적용한 점수 계산
  return (likes * 10) + (views * 0.001) + (certifications * 50) + (watchers * 5);
};

// 비디오 배열을 점수순으로 정렬
export const sortVideosByScore = (videos) => {
  return videos.sort((a, b) => calculateVideoScore(b) - calculateVideoScore(a));
};

// YouTube duration 파싱 (PT1M30S -> 90초)
export const parseDuration = (duration) => {
  if (!duration) return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  return hours * 3600 + minutes * 60 + seconds;
};

// 더미 해시태그 생성 (채팅방용)
export const generateDummyHashtags = () => {
  const allTags = ['일반', '소통', '게임', '음악', '영화', '드라마', '요리', '여행', '스포츠', '뉴스'];
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...allTags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// 제목에서 카테고리 추출
export const extractCategoryFromTitle = (title, description = '') => {
  const text = (title + ' ' + description).toLowerCase();
  
  const categoryKeywords = {
    '게임': ['게임', 'game', '플레이', 'play', '스팀', 'steam', '롤', 'lol', '오버워치', 'overwatch'],
    '음악': ['음악', 'music', '노래', 'song', '뮤직', '가수', 'singer', '앨범', 'album'],
    '영화': ['영화', 'movie', 'film', '시네마', 'cinema', '감독', 'director'],
    '드라마': ['드라마', 'drama', 'tv', '텔레비전', 'television', '시리즈', 'series'],
    '요리': ['요리', 'cooking', '레시피', 'recipe', '음식', 'food', '맛집', 'restaurant'],
    '여행': ['여행', 'travel', '관광', 'tourism', '여행지', 'destination'],
    '스포츠': ['스포츠', 'sport', '축구', 'soccer', '야구', 'baseball', '농구', 'basketball'],
    '뉴스': ['뉴스', 'news', '정치', 'politics', '경제', 'economy', '사회', 'society'],
    '교육': ['교육', 'education', '학습', 'learning', '강의', 'lecture', '튜토리얼', 'tutorial'],
    '기술': ['기술', 'tech', '프로그래밍', 'programming', '코딩', 'coding', '개발', 'development']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return '일반';
};

// 제목에서 키워드 추출
export const extractKeywordsFromTitle = (title, description = '') => {
  const text = (title + ' ' + description).toLowerCase();
  const keywords = [];
  
  const allKeywords = [
    '게임', '음악', '영화', '드라마', '요리', '여행', '스포츠', '뉴스', '교육', '기술',
    'funny', 'fun', 'cute', 'amazing', 'awesome', 'best', 'top', 'new', 'latest'
  ];
  
  allKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      keywords.push(keyword);
    }
  });
  
  return keywords.slice(0, 5); // 최대 5개 키워드
};

// duration을 포맷팅 (PT1M30S -> 1:30)
export const formatDuration = (duration) => {
  if (!duration) return '0:00';
  
  // 이미 숫자인 경우 (초 단위)
  if (typeof duration === 'number') {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // YouTube duration 형식인 경우
  const seconds = parseDuration(duration);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 업로드 날짜 포맷팅
export const formatUploadDate = (timestamp) => {
  if (!timestamp) return '날짜 없음';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
    
    return `${Math.floor(diffInSeconds / 31536000)}년 전`;
  } catch (error) {
    return '날짜 오류';
  }
};

// duration 타입 분류
export const getDurationType = (duration) => {
  if (!duration) return 'short';
  
  const seconds = typeof duration === 'number' ? duration : parseDuration(duration);
  
  if (seconds < 60) return 'very-short';
  if (seconds < 300) return 'short'; // 5분 미만
  if (seconds < 900) return 'medium'; // 15분 미만
  if (seconds < 1800) return 'long'; // 30분 미만
  
  return 'very-long'; // 30분 이상
}; 
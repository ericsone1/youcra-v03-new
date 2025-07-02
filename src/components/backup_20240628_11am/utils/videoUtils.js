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
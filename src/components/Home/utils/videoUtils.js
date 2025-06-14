/**
 * ISO 8601 duration을 초 단위로 변환
 * @param {string} iso - ISO 8601 duration (예: "PT3M30S")
 * @returns {number} - 초 단위 duration
 */
export function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match.map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

/**
 * Firebase 영상 데이터를 YouTube API 형식으로 변환
 * @param {Object} videoData - Firebase 영상 데이터
 * @param {Object} roomData - 채팅방 데이터
 * @param {string} roomId - 채팅방 ID
 * @returns {Object} - YouTube API 형식의 영상 데이터
 */
export function convertVideoData(videoData, roomData, roomId) {
  return {
    id: videoData.videoId,
    snippet: {
      title: videoData.title || "제목 없음",
      channelTitle: videoData.channel || "채널 없음",
      thumbnails: {
        medium: {
          url: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`
        }
      }
    },
    statistics: {
      viewCount: Math.floor(Math.random() * 50000) + 1000, // 더미 조회수
      likeCount: Math.floor(Math.random() * 2000) + 50      // 더미 좋아요
    },
    contentDetails: {
      duration: `PT${Math.floor(videoData.duration / 60)}M${videoData.duration % 60}S` || "PT3M30S"
    },
    // 추가 정보
    roomId: roomId,
    roomName: roomData.name || "채팅방",
    registeredAt: videoData.registeredAt,
    watchCount: Math.floor(Math.random() * 100) + 10, // 더미 시청 횟수
    certificationCount: Math.floor(Math.random() * 30) + 1 // 더미 인증 횟수
  };
}

/**
 * 영상 점수 계산 (시청 횟수 + 인증 횟수 * 2)
 * @param {Object} video - 영상 데이터
 * @returns {number} - 계산된 점수
 */
export function calculateVideoScore(video) {
  return (video.watchCount || 0) + (video.certificationCount || 0) * 2;
}

/**
 * 영상 배열을 점수순으로 정렬
 * @param {Array} videos - 영상 배열
 * @returns {Array} - 정렬된 영상 배열
 */
export function sortVideosByScore(videos) {
  return videos.sort((a, b) => {
    const scoreA = calculateVideoScore(a);
    const scoreB = calculateVideoScore(b);
    return scoreB - scoreA;
  });
}

/**
 * 더미 해시태그 생성
 * @returns {Array} - 랜덤 해시태그 배열
 */
export function generateDummyHashtags() {
  const dummyHashtags = [
    ["게임", "롤", "팀원모집"], 
    ["음악", "힙합", "수다"], 
    ["먹방", "맛집", "일상"],
    ["영화", "드라마", "토론"], 
    ["스포츠", "축구", "응원"], 
    ["공부", "취업", "정보공유"],
    ["여행", "맛집", "추천"], 
    ["애니", "웹툰", "덕후"], 
    ["연애", "고민", "상담"]
  ];
  return dummyHashtags[Math.floor(Math.random() * dummyHashtags.length)];
} 
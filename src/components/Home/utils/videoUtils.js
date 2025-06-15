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
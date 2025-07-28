// YouTube API 키
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

// Duration 포맷팅 함수
export const formatDuration = (duration) => {
  if (!duration) return '0:00';
  
  // YouTube API ISO 8601 형식 처리 (예: "PT6M8S", "PT2M56S")
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  // 숫자로 변환 (초 단위)
  const seconds = parseInt(duration);
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// YouTube API에서 duration 가져오기
export const fetchVideoDurationFromAPI = async (videoId) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const duration = data.items[0].contentDetails.duration;
      const formattedDuration = formatDuration(duration);
      const seconds = parseDurationToSeconds(duration);
      
      return {
        formatted: formattedDuration,
        seconds: seconds,
        raw: duration
      };
    }
    
    return null;
  } catch (error) {
    console.error('[VideoDurationService] YouTube API Error:', error);
    return null;
  }
};

// ISO 8601 duration을 초로 변환
const parseDurationToSeconds = (duration) => {
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
  }
  
  // 이미 숫자인 경우
  const seconds = parseInt(duration);
  return isNaN(seconds) ? 0 : seconds;
};

// Player에서 duration 가져오기
export const getDurationFromPlayer = (player) => {
  try {
    if (player && typeof player.getDuration === 'function') {
      const duration = player.getDuration();
      if (duration && duration > 0) {
        return {
          formatted: formatDuration(duration),
          seconds: duration,
          raw: duration
        };
      }
    }
    return null;
  } catch (error) {
    console.error('[VideoDurationService] Player Error:', error);
    return null;
  }
};

// 통합된 duration 가져오기 함수
export const getVideoDuration = async (videoId, player = null) => {
  // 1. 먼저 Player에서 시도 (실시간, 정확함)
  if (player) {
    const playerDuration = getDurationFromPlayer(player);
    if (playerDuration) {
      return playerDuration;
    }
  }
  
  // 2. YouTube API에서 가져오기
  const apiDuration = await fetchVideoDurationFromAPI(videoId);
  if (apiDuration) {
    return apiDuration;
  }
  
  // 3. 기본값 반환
  return {
    formatted: '0:00',
    seconds: 0,
    raw: 'PT0S'
  };
}; 
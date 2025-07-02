export function getYoutubeId(url) {
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export async function fetchYoutubeMeta(videoId) {
  const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${API_KEY}`
  );
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    const snippet = data.items[0].snippet;
    const duration = data.items[0].contentDetails.duration;
    let seconds = 0;
    const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const min = parseInt(match[1] || "0", 10);
      const sec = parseInt(match[2] || "0", 10);
      seconds = min * 60 + sec;
    }
    const statistics = data.items[0].statistics;
    return {
      title: snippet.title,
      thumbnail: snippet.thumbnails.medium.url,
      channel: snippet.channelTitle,
      videoId,
      duration: seconds,
      statistics,
    };
  }
  return null;
} 
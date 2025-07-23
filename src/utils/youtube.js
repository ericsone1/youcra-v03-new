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
    
    // 카테고리 정보 추출
    const category = extractCategoryFromTitle(snippet.title, snippet.description || '');
    
    return {
      title: snippet.title,
      thumbnail: snippet.thumbnails.medium.url,
      channel: snippet.channelTitle,
      channelId: snippet.channelId,
      videoId,
      duration: seconds,
      statistics,
      category: category, // 카테고리 추가
      keywords: extractKeywordsFromTitle(snippet.title, snippet.description || ''), // 키워드 추가
    };
  }
  return null;
}

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
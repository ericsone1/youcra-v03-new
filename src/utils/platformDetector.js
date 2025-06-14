/**
 * 플랫폼 감지 및 분석 유틸리티
 */

// 지원하는 플랫폼 타입
export const PLATFORM_TYPES = {
  YOUTUBE: 'youtube',
  INSTAGRAM: 'instagram', 
  TIKTOK: 'tiktok',
  NAVER_BLOG: 'naver_blog',
  TWITCH: 'twitch',
  TWITTER: 'twitter',
  OTHER: 'other'
};

// 플랫폼별 메타데이터
export const PLATFORM_META = {
  [PLATFORM_TYPES.YOUTUBE]: {
    name: 'YouTube',
    icon: '🎬',
    color: 'red',
    bgColor: 'red-50',
    borderColor: 'red-200'
  },
  [PLATFORM_TYPES.INSTAGRAM]: {
    name: 'Instagram', 
    icon: '📸',
    color: 'pink',
    bgColor: 'pink-50',
    borderColor: 'pink-200'
  },
  [PLATFORM_TYPES.TIKTOK]: {
    name: 'TikTok',
    icon: '🎵', 
    color: 'gray',
    bgColor: 'gray-50',
    borderColor: 'gray-200'
  },
  [PLATFORM_TYPES.NAVER_BLOG]: {
    name: '네이버 블로그',
    icon: '📝',
    color: 'green',
    bgColor: 'green-50', 
    borderColor: 'green-200'
  },
  [PLATFORM_TYPES.TWITCH]: {
    name: 'Twitch',
    icon: '🎮',
    color: 'purple',
    bgColor: 'purple-50',
    borderColor: 'purple-200'
  },
  [PLATFORM_TYPES.TWITTER]: {
    name: 'Twitter/X',
    icon: '🐦',
    color: 'blue',
    bgColor: 'blue-50',
    borderColor: 'blue-200'
  },
  [PLATFORM_TYPES.OTHER]: {
    name: '기타 링크',
    icon: '🔗',
    color: 'gray',
    bgColor: 'gray-50',
    borderColor: 'gray-200'
  }
};

/**
 * URL에서 플랫폼 타입을 감지
 * @param {string} url - 분석할 URL
 * @returns {string} 플랫폼 타입
 */
export const detectPlatform = (url) => {
  if (!url || typeof url !== 'string') {
    return PLATFORM_TYPES.OTHER;
  }

  const normalizedUrl = url.toLowerCase().trim();

  // YouTube 감지
  if (normalizedUrl.includes('youtube.com') || 
      normalizedUrl.includes('youtu.be') ||
      normalizedUrl.includes('m.youtube.com')) {
    return PLATFORM_TYPES.YOUTUBE;
  }

  // Instagram 감지
  if (normalizedUrl.includes('instagram.com') || 
      normalizedUrl.includes('instagr.am')) {
    return PLATFORM_TYPES.INSTAGRAM;
  }

  // TikTok 감지
  if (normalizedUrl.includes('tiktok.com') ||
      normalizedUrl.includes('vm.tiktok.com')) {
    return PLATFORM_TYPES.TIKTOK;
  }

  // 네이버 블로그 감지
  if (normalizedUrl.includes('blog.naver.com') ||
      normalizedUrl.includes('m.blog.naver.com')) {
    return PLATFORM_TYPES.NAVER_BLOG;
  }

  // Twitch 감지
  if (normalizedUrl.includes('twitch.tv') ||
      normalizedUrl.includes('m.twitch.tv')) {
    return PLATFORM_TYPES.TWITCH;
  }

  // Twitter/X 감지
  if (normalizedUrl.includes('twitter.com') ||
      normalizedUrl.includes('x.com') ||
      normalizedUrl.includes('mobile.twitter.com')) {
    return PLATFORM_TYPES.TWITTER;
  }

  return PLATFORM_TYPES.OTHER;
};

/**
 * 플랫폼별 메타데이터 가져오기
 * @param {string} platformType - 플랫폼 타입
 * @returns {object} 플랫폼 메타데이터
 */
export const getPlatformMeta = (platformType) => {
  return PLATFORM_META[platformType] || PLATFORM_META[PLATFORM_TYPES.OTHER];
};

/**
 * URL 유효성 검사
 * @param {string} url - 검사할 URL
 * @returns {boolean} 유효성 여부
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();
  // 간단한 정규식: 프로토콜(optional) + 도메인/경로 (언더바·한글 등 허용)
  const pattern = /^(https?:\/\/)?[\w\-._~%가-힣]+(\.[\w\-._~%가-힣]+)+(\/[^\s]*)?$/i;
  if (pattern.test(trimmed)) return true;

  // fallback: 브라우저 URL 파서 시도 (특수문자 인코딩 처리)
  try {
    const urlToTest = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    new URL(encodeURI(urlToTest));
    return true;
  } catch {
    return false;
  }
};

/**
 * URL 정규화 (http/https 추가)
 * @param {string} url - 정규화할 URL  
 * @returns {string} 정규화된 URL
 */
export const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  return `https://${trimmedUrl}`;
}; 
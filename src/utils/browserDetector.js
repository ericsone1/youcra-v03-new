// 인앱 브라우저 감지 및 외부 브라우저 강제 실행 유틸리티

/**
 * 인앱 브라우저인지 감지
 * @returns {boolean} 인앱 브라우저 여부
 */
export const isInAppBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // 카카오톡 인앱 브라우저
  if (userAgent.includes('kakaotalk')) return true;
  
  // 페이스북 인앱 브라우저
  if (userAgent.includes('fban') || userAgent.includes('fb_iab')) return true;
  
  // 인스타그램 인앱 브라우저
  if (userAgent.includes('instagram')) return true;
  
  // 네이버 인앱 브라우저
  if (userAgent.includes('naver')) return true;
  
  // 라인 인앱 브라우저
  if (userAgent.includes('line')) return true;
  
  // 틱톡 인앱 브라우저
  if (userAgent.includes('tiktok')) return true;
  
  // 웨이보 인앱 브라우저
  if (userAgent.includes('weibo')) return true;
  
  // 기타 WebView 기반 앱들
  if (userAgent.includes('wv') || userAgent.includes('webview')) return true;
  
  return false;
};

/**
 * Android 기기인지 감지
 * @returns {boolean} Android 기기 여부
 */
export const isAndroid = () => {
  return /android/i.test(navigator.userAgent);
};

/**
 * iOS 기기인지 감지
 * @returns {boolean} iOS 기기 여부
 */
export const isIOS = () => {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

/**
 * Android에서 외부 브라우저로 강제 실행 (Intent URL 사용)
 * @param {string} url - 열고자 하는 URL
 */
export const openInExternalBrowserAndroid = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodedUrl};end`;
  
  try {
    window.location.href = intentUrl;
  } catch (error) {
    console.error('Intent URL 실행 실패:', error);
    // 폴백: 일반 URL로 이동
    window.open(url, '_blank');
  }
};

/**
 * iOS에서 외부 브라우저로 강제 실행
 * @param {string} url - 열고자 하는 URL
 */
export const openInExternalBrowserIOS = (url) => {
  // iOS에서는 window.open이 더 효과적
  try {
    window.open(url, '_blank');
  } catch (error) {
    console.error('iOS 외부 브라우저 실행 실패:', error);
    // 폴백: location.href 사용
    window.location.href = url;
  }
};

/**
 * 플랫폼에 따라 외부 브라우저로 강제 실행
 * @param {string} url - 열고자 하는 URL
 */
export const openInExternalBrowser = (url) => {
  if (isAndroid()) {
    openInExternalBrowserAndroid(url);
  } else if (isIOS()) {
    openInExternalBrowserIOS(url);
  } else {
    // 데스크톱에서는 일반적인 새 창 열기
    window.open(url, '_blank');
  }
};

/**
 * 인앱 브라우저에서 외부 브라우저로 이동하는 경고 메시지 표시
 * @param {string} url - 이동할 URL
 * @returns {Promise<boolean>} 사용자가 확인했는지 여부
 */
export const showInAppBrowserWarning = (url) => {
  return new Promise((resolve) => {
    const message = `카카오톡 내 브라우저에서는 구글 로그인이 지원되지 않습니다.\n\n외부 브라우저로 이동하시겠습니까?`;
    
    if (confirm(message)) {
      openInExternalBrowser(url);
      resolve(true);
    } else {
      resolve(false);
    }
  });
};

/**
 * 인앱 브라우저 감지 및 자동 외부 브라우저 실행
 * @param {string} url - 이동할 URL
 * @param {boolean} autoRedirect - 자동 리다이렉트 여부 (기본값: true)
 */
export const handleInAppBrowserRedirect = (url, autoRedirect = true) => {
  if (!isInAppBrowser()) {
    // 인앱 브라우저가 아니면 바로 URL로 이동
    window.location.href = url;
    return;
  }
  
  if (autoRedirect) {
    // 자동으로 외부 브라우저 실행
    openInExternalBrowser(url);
  } else {
    // 사용자 확인 후 실행
    showInAppBrowserWarning(url);
  }
}; 
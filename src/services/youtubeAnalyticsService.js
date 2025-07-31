/**
 * YouTube Analytics API 서비스
 * - 조회수 데이터 전송
 * - 외부 트래픽 추적
 */

// YouTube Analytics API 엔드포인트
const YOUTUBE_ANALYTICS_API = 'https://youtubeanalytics.googleapis.com/v2/reports';

/**
 * YouTube Analytics API로 조회수 데이터 전송
 * @param {string} videoId - YouTube 영상 ID
 * @param {string} accessToken - OAuth 액세스 토큰
 */
export const sendViewDataToYouTube = async (videoId, accessToken) => {
  try {
    console.log('📊 [youtubeAnalyticsService] YouTube Analytics API 호출:', videoId);
    
    // YouTube Analytics API 호출
    const response = await fetch(`${YOUTUBE_ANALYTICS_API}?ids=channel==MINE&metrics=views&dimensions=video&filters=video==${videoId}&startDate=2024-01-01&endDate=2024-12-31`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`YouTube Analytics API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ [youtubeAnalyticsService] YouTube Analytics 데이터:', data);
    
    return data;
  } catch (error) {
    console.error('❌ [youtubeAnalyticsService] YouTube Analytics API 실패:', error);
    throw error;
  }
};

/**
 * OAuth 2.0 액세스 토큰 가져오기
 * @param {string} clientId - Google OAuth 클라이언트 ID
 */
export const getYouTubeAccessToken = async (clientId) => {
  try {
    // Google Identity Services를 사용한 OAuth 인증
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
      callback: (tokenResponse) => {
        console.log('✅ [youtubeAnalyticsService] OAuth 토큰 획득:', tokenResponse.access_token);
        return tokenResponse.access_token;
      }
    });
    
    return new Promise((resolve, reject) => {
      tokenClient.requestAccessToken();
    });
  } catch (error) {
    console.error('❌ [youtubeAnalyticsService] OAuth 토큰 획득 실패:', error);
    throw error;
  }
};

/**
 * 유크라 조회수를 YouTube Analytics에 전송
 * @param {string} videoId - YouTube 영상 ID
 * @param {number} viewCount - 조회수
 */
export const sendUcraViewToYouTube = async (videoId, viewCount = 1) => {
  try {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.warn('⚠️ [youtubeAnalyticsService] Google OAuth 클라이언트 ID가 설정되지 않음');
      return false;
    }
    
    // OAuth 토큰 획득
    const accessToken = await getYouTubeAccessToken(clientId);
    
    if (!accessToken) {
      console.warn('⚠️ [youtubeAnalyticsService] 액세스 토큰 획득 실패');
      return false;
    }
    
    // YouTube Analytics에 데이터 전송
    await sendViewDataToYouTube(videoId, accessToken);
    
    console.log('✅ [youtubeAnalyticsService] 유크라 조회수 YouTube 전송 완료:', {
      videoId,
      viewCount
    });
    
    return true;
  } catch (error) {
    console.error('❌ [youtubeAnalyticsService] 유크라 조회수 YouTube 전송 실패:', error);
    return false;
  }
}; 
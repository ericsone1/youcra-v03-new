/**
 * YouTube API 오류 처리 유틸리티
 */

export const handleYouTubeAPIError = (error, response) => {
  console.error('🚨 YouTube API 오류:', error);
  
  if (response) {
    console.log('📊 응답 상태:', response.status);
    console.log('📋 응답 상태 텍스트:', response.statusText);
  }

  // 응답 상태 코드별 오류 메시지
  if (response?.status === 400) {
    return {
      type: 'BAD_REQUEST',
      message: 'YouTube API 요청이 잘못되었습니다. API 키를 확인해주세요.',
      details: 'API 키가 없거나 잘못되었거나, 요청 형식이 올바르지 않습니다.',
      action: '1. .env 파일의 REACT_APP_YOUTUBE_API_KEY 확인\n2. API 키가 유효한지 확인\n3. YouTube Data API v3가 활성화되어 있는지 확인'
    };
  }
  
  if (response?.status === 403) {
    return {
      type: 'FORBIDDEN',
      message: 'YouTube API 접근이 거부되었습니다.',
      details: 'API 키 권한이 부족하거나 할당량을 초과했습니다.',
      action: '1. Google Cloud Console에서 할당량 확인\n2. API 키 권한 설정 확인\n3. 결제 계정 설정 확인'
    };
  }
  
  if (response?.status === 429) {
    return {
      type: 'RATE_LIMIT',
      message: 'YouTube API 요청 한도를 초과했습니다.',
      details: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
      action: '잠시 후 다시 시도하거나, 요청 빈도를 줄여주세요.'
    };
  }
  
  if (response?.status === 404) {
    return {
      type: 'NOT_FOUND',
      message: '요청한 리소스를 찾을 수 없습니다.',
      details: '비디오 ID나 채널 ID가 잘못되었을 수 있습니다.',
      action: '입력한 ID가 올바른지 확인해주세요.'
    };
  }

  if (response?.status >= 500) {
    return {
      type: 'SERVER_ERROR',
      message: 'YouTube 서버에 문제가 발생했습니다.',
      details: 'YouTube API 서버에 일시적인 문제가 있습니다.',
      action: '잠시 후 다시 시도해주세요.'
    };
  }

  // 네트워크 오류 등 기타 오류
  return {
    type: 'UNKNOWN',
    message: '알 수 없는 오류가 발생했습니다.',
    details: error.message || '네트워크 연결을 확인해주세요.',
    action: '1. 인터넷 연결 확인\n2. 잠시 후 다시 시도\n3. 브라우저 콘솔에서 자세한 오류 확인'
  };
};

export const logAPICall = (url, params = {}) => {
  console.log('🔗 YouTube API 호출:', url);
  if (Object.keys(params).length > 0) {
    console.log('📋 파라미터:', params);
  }
};

export const validateAPIKey = (apiKey) => {
  if (!apiKey) {
    console.error('❌ YouTube API 키가 설정되지 않았습니다.');
    console.log('💡 해결방법:');
    console.log('1. .env 파일에 REACT_APP_YOUTUBE_API_KEY 추가');
    console.log('2. Google Cloud Console에서 YouTube Data API v3 활성화');
    console.log('3. API 키 발급 및 설정');
    return false;
  }
  
  if (apiKey === 'your_youtube_api_key_here') {
    console.error('❌ YouTube API 키가 기본값으로 설정되어 있습니다.');
    console.log('💡 .env 파일에서 실제 API 키로 변경해주세요.');
    return false;
  }
  
  return true;
};
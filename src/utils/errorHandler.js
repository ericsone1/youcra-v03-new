// Firebase 에러 메시지를 사용자 친화적인 메시지로 변환
export function getFirebaseErrorMessage(error) {
  switch (error.code) {
    case 'auth/user-not-found':
      return '존재하지 않는 계정입니다.';
    case 'auth/wrong-password':
      return '비밀번호가 올바르지 않습니다.';
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 합니다.';
    case 'auth/invalid-email':
      return '유효하지 않은 이메일 형식입니다.';
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인해주세요.';
    default:
      return error.message || '알 수 없는 오류가 발생했습니다.';
  }
}

// API 에러 처리
export function handleApiError(error, defaultMessage = '오류가 발생했습니다.') {
  if (error.response) {
    // 서버가 응답을 반환한 경우
    switch (error.response.status) {
      case 400:
        return '잘못된 요청입니다.';
      case 401:
        return '로그인이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 429:
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      case 500:
        return '서버 오류가 발생했습니다.';
      default:
        return defaultMessage;
    }
  } else if (error.request) {
    // 요청은 보냈지만 응답을 받지 못한 경우
    return '서버와 통신할 수 없습니다.';
  } else {
    // 요청 설정 중 오류가 발생한 경우
    return defaultMessage;
  }
}

// 유효성 검사 에러 메시지
export const validationErrors = {
  required: (field) => `${field}은(는) 필수 입력 항목입니다.`,
  minLength: (field, length) => `${field}은(는) ${length}자 이상이어야 합니다.`,
  maxLength: (field, length) => `${field}은(는) ${length}자를 초과할 수 없습니다.`,
  email: '유효한 이메일 주소를 입력해주세요.',
  url: '유효한 URL을 입력해주세요.',
  match: '입력한 값이 일치하지 않습니다.',
}; 
/**
 * 사용자 프로필 관련 유틸리티 함수들
 */

/**
 * uid 유효성 검사
 * @param {string} uid - 검사할 uid
 * @returns {boolean} 유효한 uid인지 여부
 */
export function isValidUid(uid) {
  return uid && 
         uid !== 'undefined' && 
         uid !== 'null' && 
         uid !== 'anonymous' && 
         typeof uid === 'string' && 
         uid.trim().length > 0;
}

/**
 * 안전한 프로필 네비게이션
 * @param {function} navigate - React Router navigate 함수
 * @param {string} roomId - 채팅방 ID
 * @param {string} uid - 사용자 ID
 * @param {string} [errorMessage] - 사용자 정의 오류 메시지
 */
export function safeNavigateToProfile(navigate, roomId, uid, errorMessage) {
  if (!isValidUid(uid)) {
    alert(errorMessage || '이 사용자의 프로필 정보를 찾을 수 없습니다.');
    console.warn('🚨 [프로필] 유효하지 않은 uid로 프로필 접근 시도:', {
      uid,
      roomId,
      timestamp: new Date().toISOString()
    });
    return false;
  }
  
  if (!roomId) {
    alert('채팅방 정보를 찾을 수 없습니다.');
    console.warn('🚨 [프로필] roomId 없이 프로필 접근 시도:', { uid });
    return false;
  }
  
  try {
    navigate(`/profile/${roomId}/${uid}`);
    console.log('✅ [프로필] 프로필 페이지로 이동:', { roomId, uid });
    return true;
  } catch (error) {
    console.error('❌ [프로필] 네비게이션 오류:', error);
    alert('페이지 이동 중 오류가 발생했습니다.');
    return false;
  }
}

/**
 * 사용자 닉네임 안전 생성
 * @param {object} userData - 사용자 데이터
 * @param {string} fallbackUid - 대체용 uid
 * @returns {string} 안전한 닉네임
 */
export function getSafeUserNickname(userData, fallbackUid) {
  if (!userData) {
    return fallbackUid ? `사용자_${fallbackUid.slice(0, 6)}` : '익명';
  }
  
  return userData.displayName || 
         userData.nick || 
         userData.nickname ||
         userData.name || 
         userData.email?.split('@')[0] || 
         (fallbackUid ? `사용자_${fallbackUid.slice(0, 6)}` : '익명');
}

/**
 * 메시지 uid 검증 및 정리
 * @param {object} message - 메시지 객체
 * @returns {object} 정리된 메시지 객체
 */
export function sanitizeMessageUid(message) {
  if (!message) return null;
  
  // uid가 유효하지 않은 경우 처리
  if (!isValidUid(message.uid)) {
    console.warn('🚨 [메시지] 유효하지 않은 uid 발견:', {
      messageId: message.id,
      uid: message.uid,
      text: message.text?.slice(0, 50) + '...',
      timestamp: message.createdAt
    });
    
    // uid 복구 시도
    if (message.senderId && isValidUid(message.senderId)) {
      message.uid = message.senderId;
    } else if (message.authorId && isValidUid(message.authorId)) {
      message.uid = message.authorId;
    } else {
      // uid를 복구할 수 없는 경우 anonymous로 설정
      message.uid = 'anonymous';
    }
  }
  
  return message;
}

/**
 * 채팅방 참여자 목록 정리
 * @param {array} participants - 참여자 배열
 * @returns {array} 정리된 참여자 배열
 */
export function sanitizeParticipants(participants) {
  if (!Array.isArray(participants)) return [];
  
  return participants.filter(participant => {
    if (!isValidUid(participant.id)) {
      console.warn('🚨 [참여자] 유효하지 않은 참여자 필터링:', participant);
      return false;
    }
    return true;
  });
}

/**
 * 디버깅용 사용자 정보 로깅
 * @param {string} context - 로그 컨텍스트
 * @param {object} userData - 사용자 데이터
 * @param {string} uid - uid
 */
export function debugLogUserData(context, userData, uid) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 [${context}] 사용자 정보 디버깅`);
    console.log('📋 전달받은 uid:', uid);
    console.log('✅ uid 유효성:', isValidUid(uid));
    console.log('📄 사용자 데이터:', userData);
    console.log('🏷️ 생성된 닉네임:', getSafeUserNickname(userData, uid));
    console.groupEnd();
  }
} 
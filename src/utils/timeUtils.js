// 시간 관련 유틸리티 함수들

/**
 * 초 단위를 시:분:초 또는 분:초 형태로 변환
 * @param {number} seconds - 초 단위 시간
 * @param {boolean} showHours - 시간 표시 여부 (기본값: 자동)
 * @returns {string} 형식화된 시간 문자열
 */
export const formatTime = (seconds, showHours = null) => {
  if (!seconds || seconds < 0) return "0:00";
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  // showHours가 null이면 1시간 이상인 경우 자동으로 시간 표시
  const shouldShowHours = showHours !== null ? showHours : hrs > 0;
  
  if (shouldShowHours) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};

/**
 * 시청인증 조건 메시지 생성
 * @param {number} videoDuration - 영상 전체 길이 (초)
 * @param {number} watchSeconds - 현재 시청 시간 (초)
 * @param {boolean} videoEnded - 영상 종료 여부
 * @returns {object} { message, progress, isCompleted }
 */
export const getWatchCertificationStatus = (videoDuration, watchSeconds, videoEnded) => {
  if (videoDuration > 1800) {
    // 30분 초과 영상: 30분 시청
    const required = 1800;
    const isCompleted = watchSeconds >= required;
    return {
      message: `30분 시청 필요 (${formatTime(watchSeconds)}/${formatTime(required)})`,
      progress: Math.min((watchSeconds / required) * 100, 100),
      isCompleted,
      requiredTime: required
    };
  } else {
    // 30분 이하 영상: 끝까지 시청
    const isCompleted = videoEnded;
    return {
      message: `영상 끝까지 시청 필요 (${formatTime(watchSeconds)}/${formatTime(videoDuration)})`,
      progress: videoDuration > 0 ? Math.min((watchSeconds / videoDuration) * 100, 100) : 0,
      isCompleted,
      requiredTime: videoDuration
    };
  }
};

/**
 * 영상 카테고리 분류
 * @param {number} duration - 영상 길이 (초)
 * @returns {object} 카테고리 정보
 */
export const getVideoCategory = (duration) => {
  if (duration > 1800) {
    return {
      type: 'long',
      name: '긴 영상',
      description: '30분 초과',
      color: 'purple',
      emoji: '🕒'
    };
  } else {
    return {
      type: 'short',
      name: '짧은 영상',
      description: '30분 이하',
      color: 'green',
      emoji: '⚡'
    };
  }
};

/**
 * 시청인증 완료까지 남은 시간 계산
 * @param {number} videoDuration - 영상 전체 길이 (초)
 * @param {number} watchSeconds - 현재 시청 시간 (초)
 * @param {boolean} videoEnded - 영상 종료 여부
 * @returns {number} 남은 시간 (초), 완료된 경우 0
 */
export const getRemainingTimeForCertification = (videoDuration, watchSeconds, videoEnded) => {
  if (videoDuration > 1800) {
    // 30분 초과 영상: 30분까지만
    return Math.max(0, 1800 - watchSeconds);
  } else {
    // 30분 이하 영상: 끝까지
    return videoEnded ? 0 : Math.max(0, videoDuration - watchSeconds);
  }
}; 
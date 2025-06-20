import React from 'react';
import { useNavigationHistory } from '../../hooks/useNavigationHistory';

/**
 * 스마트 뒤로가기 버튼 컴포넌트
 * - 히스토리 기반 뒤로가기
 * - 스크롤 위치 보존
 * - 폴백 경로 지원
 * - 커스터마이징 가능한 UI
 */
const SmartBackButton = ({
  fallbackPath = '/',
  className = '',
  children,
  onBeforeBack,
  preserveScroll = true,
  stateToRestore = null,
  ...props
}) => {
  const { handleSmartBack, getHistoryInfo } = useNavigationHistory(fallbackPath);

  const handleClick = async (e) => {
    e.preventDefault();
    
    // 뒤로가기 전 콜백 실행
    if (onBeforeBack) {
      const shouldProceed = await onBeforeBack();
      if (shouldProceed === false) return;
    }

    handleSmartBack({
      fallback: fallbackPath,
      preserveScroll,
      stateToRestore
    });
  };

  const { canGoBack } = getHistoryInfo();

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center justify-center transition-all duration-200
        ${canGoBack 
          ? 'text-gray-600 hover:text-blue-600 hover:scale-105' 
          : 'text-gray-400 cursor-not-allowed'
        }
        ${className}
      `}
      disabled={!canGoBack}
      aria-label="뒤로가기"
      {...props}
    >
      {children || (
        <span className="text-2xl">←</span>
      )}
    </button>
  );
};

/**
 * 채팅방 전용 뒤로가기 버튼
 */
export const ChatBackButton = ({
  roomData = {},
  className = '',
  children,
  onBeforeBack,
  ...props
}) => {
  return (
    <SmartBackButton
      fallbackPath="/chat"
      className={className}
      onBeforeBack={onBeforeBack}
      stateToRestore={{
        from: 'chatroom',
        roomId: roomData.id,
        unreadCount: roomData.unreadCount,
        lastReadMessageId: roomData.lastReadMessageId,
        timestamp: Date.now()
      }}
      {...props}
    >
      {children}
    </SmartBackButton>
  );
};

/**
 * 헤더용 뒤로가기 버튼
 */
export const HeaderBackButton = ({ 
  title, 
  fallbackPath = '/',
  className = '',
  ...props 
}) => {
  return (
    <div className="flex items-center gap-3">
      <SmartBackButton
        fallbackPath={fallbackPath}
        className={`text-2xl hover:bg-blue-700 p-1 rounded ${className}`}
        {...props}
      />
      {title && (
        <h1 className="font-bold text-lg">{title}</h1>
      )}
    </div>
  );
};

/**
 * 플로팅 뒤로가기 버튼 (모바일 최적화)
 */
export const FloatingBackButton = ({
  position = 'top-left',
  fallbackPath = '/',
  className = '',
  ...props
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <SmartBackButton
      fallbackPath={fallbackPath}
      className={`
        fixed z-50 w-12 h-12 rounded-full shadow-lg
        bg-white/90 backdrop-blur-sm border border-gray-200
        hover:bg-white hover:shadow-xl
        flex items-center justify-center
        ${positionClasses[position]}
        ${className}
      `}
      {...props}
    >
      <span className="text-xl">←</span>
    </SmartBackButton>
  );
};

export default SmartBackButton; 
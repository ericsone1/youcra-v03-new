import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Message } from './Message';

/**
 * TanStack Virtual을 활용한 가상화된 메시지 목록
 * 대량의 채팅 메시지를 효율적으로 렌더링
 */
const VirtualizedMessageList = ({ 
  messages = [], 
  currentUser,
  onVideoClick,
  estimatedSize = 80,
  overscan = 10,
  className = '',
  autoScrollToBottom = true
}) => {
  const parentRef = useRef(null);

  // TanStack Virtual 설정
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedSize, // 각 메시지의 예상 높이
    overscan: overscan, // 화면 밖에서 미리 렌더링할 메시지 수
    // 동적 크기 측정 활성화
    measureElement: (element) => {
      return element?.getBoundingClientRect().height ?? estimatedSize;
    },
  });

  // 새 메시지가 추가될 때 자동 스크롤
  useEffect(() => {
    if (autoScrollToBottom && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        virtualizer.scrollToIndex(messages.length - 1, {
          align: 'end',
          behavior: 'smooth'
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, autoScrollToBottom, virtualizer]);

  return (
    <div
      ref={parentRef}
      className={`flex-1 overflow-auto scroll-optimized ${className}`}
      style={{
        height: '100%',
      }}
    >
      {/* 전체 가상 높이를 유지하는 컨테이너 */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {/* 실제로 렌더링되는 메시지들 */}
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="px-4 py-2">
                <Message
                  message={message}
                  currentUser={currentUser}
                  onVideoClick={onVideoClick}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 메시지가 없을 때 표시 */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-6xl mb-4">👋</div>
          <div className="text-gray-500 text-center">
            <div className="font-medium mb-1">첫 메시지를 보내보세요!</div>
            <div className="text-sm">대화를 시작해보세요</div>
          </div>
        </div>
      )}

      {/* 성능 정보 (개발 모드에서만) */}
      {process.env.NODE_ENV === 'development' && messages.length > 0 && (
        <div className="fixed bottom-20 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>총 메시지: {messages.length}</div>
          <div>렌더링된 메시지: {virtualizer.getVirtualItems().length}</div>
          <div>메모리 절약: {Math.round((1 - virtualizer.getVirtualItems().length / messages.length) * 100)}%</div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedMessageList; 
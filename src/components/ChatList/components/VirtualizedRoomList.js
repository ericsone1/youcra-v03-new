import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import LazyRoomCard from './LazyRoomCard';

/**
 * TanStack Virtual을 활용한 가상화된 채팅방 목록
 * 대량의 채팅방을 효율적으로 렌더링
 */
const VirtualizedRoomList = ({ 
  rooms = [], 
  onEnter, 
  variant = 'default',
  estimatedSize = 120,
  overscan = 5,
  className = ''
}) => {
  const parentRef = useRef(null);

  // TanStack Virtual 설정
  const virtualizer = useVirtualizer({
    count: rooms.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedSize, // 각 채팅방 카드의 예상 높이
    overscan: overscan, // 화면 밖에서 미리 렌더링할 아이템 수
    // 동적 크기 측정 활성화
    measureElement: (element) => {
      return element?.getBoundingClientRect().height ?? estimatedSize;
    },
  });

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
        {/* 실제로 렌더링되는 아이템들 */}
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const room = rooms[virtualItem.index];
          
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
              <div className="px-3 pb-3">
                <LazyRoomCard
                  room={room}
                  onEnter={onEnter}
                  variant={variant}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 채팅방이 없을 때 표시 */}
      {rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-6xl mb-4">💬</div>
          <div className="text-gray-500 text-center">
            <div className="font-medium mb-1">채팅방이 없어요</div>
            <div className="text-sm">새로운 채팅방을 만들어보세요!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedRoomList; 
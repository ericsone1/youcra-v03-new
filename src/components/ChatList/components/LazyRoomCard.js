import React from 'react';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import RoomCard from './RoomCard';

/**
 * 지연 로딩이 가능한 RoomCard 컴포넌트
 */
const LazyRoomCard = ({ room, onEnter, variant, showHostBadge, className }) => {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px', // 100px 전에 미리 로드
    threshold: 0.1,
    triggerOnce: true // 한 번만 로드
  });

  return (
    <div ref={targetRef} className={`min-h-[120px] ${className || ''}`}>
      {isIntersecting ? (
        <RoomCard 
          room={room}
          onEnter={onEnter}
          variant={variant}
          showHostBadge={showHostBadge}
        />
      ) : (
        // 스켈레톤 로딩 UI
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              {/* 제목 스켈레톤 */}
              <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
              {/* 설명 스켈레톤 */}
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            {/* 참여자 수 스켈레톤 */}
            <div className="h-6 w-12 bg-gray-200 rounded-full ml-3"></div>
          </div>
          
          <div className="flex justify-between items-center">
            {/* 해시태그 스켈레톤 */}
            <div className="flex gap-1">
              <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
              <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
            </div>
            {/* 시간 스켈레톤 */}
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyRoomCard; 
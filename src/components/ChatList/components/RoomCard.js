import React from 'react';
import { IoLockClosedOutline, IoEyeOutline, IoPeopleOutline } from 'react-icons/io5';

// 시간 포맷팅 함수들
const formatLastMessageTime = (lastMsgTime) => {
  if (!lastMsgTime) return '';
  
  const now = new Date();
  const msgTime = new Date(lastMsgTime);
  const diffInMinutes = Math.floor((now - msgTime) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return '방금 전';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays === 1) {
    return '어제';
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else {
    return msgTime.toLocaleDateString('ko-KR', { 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

function RoomCard({ room, onEnter, variant = 'my' }) {
  return (
    <div className="flex items-center bg-white rounded-xl shadow p-4 gap-4 hover:bg-blue-50 transition cursor-pointer relative" onClick={() => onEnter(room.id)}>
      {/* 비밀방 락 아이콘 */}
      {room.isPrivate && (
        <div className="absolute top-2 right-2 text-red-500" title="비밀방">
          <IoLockClosedOutline />
        </div>
      )}
      
      {/* 방장 프로필 이미지 */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shadow-lg border-2 border-white relative group flex-shrink-0">
        <img 
          src={`https://picsum.photos/seed/${room.hostId || room.id || 'room'}/100/100`}
          alt="방장 프로필"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<div class=\"w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white\">${(room.hostNick || room.title || 'CH').slice(0, 2).toUpperCase()}</div>`;
          }}
        />
      </div>
      
      {/* 정보 */}
      <div className="flex-1 min-w-0">
        {/* 첫 번째 줄: 방 제목 (모드 별) */}
        <div className="font-bold text-lg truncate mb-1 flex items-center gap-2">
          {room.title}
          {/* 전체 채팅방 모드일 때 참여 인원 크게 표시 */}
          {variant === 'all' && (
            <span className="text-blue-600 font-semibold text-base flex items-center gap-1">
              <IoPeopleOutline className="inline" />
              {room.participantCount || 0}
            </span>
          )}
        </div>

        {variant === 'my' ? (
          // 내 채팅방 목록: 최근 메시지 + 시간
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600 truncate">
              {room.lastMsgText || "아직 메시지가 없습니다."}
            </div>
            {/* 시간 표시 */}
            <div className="text-xs text-gray-400 ml-3 flex-shrink-0">
              {formatLastMessageTime(room.lastMsgTime)}
            </div>
          </div>
        ) : (
          // 전체 채팅방 목록: 방 설명 텍스트 노출
          <div className="text-sm text-gray-600 truncate mb-2">
            {room.desc}
          </div>
        )}
        
        {/* 통계 배지 */}
        <div className="flex gap-3 text-xs text-gray-500 mb-2 items-center">
          <span className="flex items-center gap-1">
            <IoEyeOutline />
            {room.viewCount || 0}
          </span>
          {/* my 모드에서만 참여 인원(작게) 표시, all 모드에서는 이미 크게 표시됨 */}
          {variant === 'my' && (
            <span className="flex items-center gap-1">
              <IoPeopleOutline />
              {room.members}
            </span>
          )}
        </div>
        
        {/* 해시태그 표시 */}
        {variant === 'all' && room.hashtags && room.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.hashtags.slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
            {room.hashtags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{room.hashtags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* 우측 영역: 안읽음 메시지 개수 */}
      {variant === 'my' && room.unreadCount > 0 && (
        <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center ml-2 shadow-md">
          {room.unreadCount > 99 ? '99+' : room.unreadCount}
        </div>
      )}
    </div>
  );
}

export default RoomCard; 
import React from 'react';

function MessageComponent({ message, isMyMessage, isFirstInGroup, isLastInGroup }) {
  const timestamp = message.createdAt?.seconds
    ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : '';

  // 이메일의 첫 두 글자를 대문자로 변환
  const initials = message.email?.slice(0, 2).toUpperCase() || 'UN';
  
  // 더 다양한 그라디언트 색상
  const avatarColors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600', 
    'from-pink-400 to-pink-600',
    'from-green-400 to-green-600',
    'from-yellow-400 to-orange-500',
    'from-indigo-400 to-indigo-600',
    'from-red-400 to-red-600',
    'from-teal-400 to-teal-600'
  ];
  
  // 이메일을 기반으로 일관된 색상 선택
  const colorIndex = message.email ? message.email.charCodeAt(0) % avatarColors.length : 0;
  const avatarColor = avatarColors[colorIndex];

  return (
    <article
      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} ${
        isLastInGroup ? 'mb-6' : 'mb-1'
      } message-bubble`}
      aria-label={`${isMyMessage ? '내가 보낸' : message.email + '님의'} 메시지`}
    >
      <div className={`flex items-end space-x-3 max-w-[85%] ${isMyMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* 프로필 이미지 - 그룹의 마지막 메시지에만 표시 */}
        {!isMyMessage && (
          <div className={`flex-shrink-0 transition-opacity duration-200 ${isLastInGroup ? 'opacity-100' : 'opacity-0'}`}>
            <div 
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-white hover:scale-105 transition-transform duration-200`}
              aria-label="프로필 이미지"
            >
              {initials}
            </div>
          </div>
        )}

        {/* 메시지 내용 */}
        <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
          {/* 발신자 이름 - 그룹의 첫 번째 메시지에만 표시 */}
          {!isMyMessage && isFirstInGroup && (
            <div className="text-[0.675rem] font-medium text-gray-600 mb-2 px-2 fade-in" aria-label="보낸 사람">
              {message.email?.split('@')[0] || '익명'}
            </div>
          )}

          <div className="flex items-end space-x-2">
            {/* 시간 표시 - 내 메시지일 때는 왼쪽에 */}
            {isMyMessage && (
              <div className="text-xs text-gray-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {timestamp}
              </div>
            )}

            {/* 메시지 버블 */}
            <div
              className={`group relative px-4 py-3 max-w-full break-normal shadow-lg transition-all duration-200 hover:shadow-xl ${
                isMyMessage
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-100'
              } ${
                // 그룹화된 메시지의 모서리 조정
                isMyMessage
                  ? isFirstInGroup && isLastInGroup
                    ? 'rounded-2xl'
                    : isFirstInGroup
                    ? 'rounded-2xl rounded-br-lg'
                    : isLastInGroup
                    ? 'rounded-2xl rounded-tr-lg'
                    : 'rounded-l-2xl rounded-r-lg'
                  : isFirstInGroup && isLastInGroup
                  ? 'rounded-2xl'
                  : isFirstInGroup
                  ? 'rounded-2xl rounded-bl-lg'
                  : isLastInGroup
                  ? 'rounded-2xl rounded-tl-lg'
                  : 'rounded-r-2xl rounded-l-lg'
              }`}
              role="article"
            >
              {/* 메시지 내용 */}
              <div aria-label="메시지 내용" className="whitespace-pre-wrap leading-relaxed break-keep">
                {message.text}
              </div>
              
              {/* 메시지 꼬리 (말풍선 효과) */}
              {isLastInGroup && (
                <div
                  className={`absolute w-3 h-3 ${
                    isMyMessage
                      ? 'bottom-0 right-0 transform translate-x-1 translate-y-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-bl-full'
                      : 'bottom-0 left-0 transform -translate-x-1 translate-y-1 bg-white border-l border-b border-gray-100 rounded-br-full'
                  }`}
                />
              )}
              
              {/* 호버 시 시간 표시 툴팁 */}
              <div className={`
                absolute ${isMyMessage ? 'left-0' : 'right-0'} top-0 transform 
                ${isMyMessage ? '-translate-x-full -translate-y-1' : 'translate-x-full -translate-y-1'}
                opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
              `}>
                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {timestamp}
                </div>
              </div>
            </div>

            {/* 시간 표시 - 상대방 메시지일 때는 오른쪽에 */}
            {!isMyMessage && (
              <div className="text-xs text-gray-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {timestamp}
              </div>
            )}
          </div>
        </div>

        {/* 내 메시지의 상태 표시 */}
        {isMyMessage && isLastInGroup && (
          <div className="flex-shrink-0 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// props가 변경되지 않으면 리렌더링하지 않도록 메모이제이션
export const Message = React.memo(MessageComponent, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.isMyMessage === nextProps.isMyMessage &&
    prevProps.isFirstInGroup === nextProps.isFirstInGroup &&
    prevProps.isLastInGroup === nextProps.isLastInGroup
  );
}); 
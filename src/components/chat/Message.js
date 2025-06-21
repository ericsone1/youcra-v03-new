import React from 'react';

// 파일 크기 포맷 함수
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 파일 메시지 렌더링 함수
const renderFileMessage = (message) => {
  if (!message.fileType) return message.text;

  switch (message.fileType) {
    case 'image':
      return (
        <div className="max-w-xs">
          <img 
            src={message.fileUrl} 
            alt="첨부 이미지"
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.open(message.fileUrl, '_blank')}
            title="클릭하여 크게 보기"
            onError={(e) => {
              console.error('이미지 로딩 오류:', e);
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="text-red-500 text-sm p-2">이미지를 불러올 수 없습니다.</div>';
            }}
          />
        </div>
      );
    case 'video':
      return (
        <div className="max-w-xs">
          <video 
            src={message.fileUrl} 
            controls 
            className="rounded-lg max-w-full h-auto"
            style={{ maxHeight: '200px' }}
            onError={(e) => {
              console.error('비디오 로딩 오류:', e);
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="text-red-500 text-sm p-2">비디오를 재생할 수 없습니다.</div>';
            }}
          />
        </div>
      );
    case 'file':
    default:
      return (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg max-w-xs">
          <div className="text-2xl">📎</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{message.fileName || '첨부파일'}</div>
            <div className="text-xs text-gray-500">{formatFileSize(message.fileSize || 0)}</div>
          </div>
          <a 
            href={message.fileUrl} 
            download={message.fileName}
            className="text-blue-500 text-sm hover:underline"
          >
            다운로드
          </a>
        </div>
      );
  }
};

// URL 미리보기 렌더링 함수
const renderMessageWithPreview = (text) => {
  if (!text) return '';
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const lines = text.split("\n");
  const elements = [];
  
  lines.forEach((line, idx) => {
    const parts = line.split(urlRegex);
    parts.forEach((part, i) => {
      if (urlRegex.test(part)) {
        const ytMatch = part.match(youtubeRegex);
        if (ytMatch) {
          const videoId = ytMatch[1];
          elements.push(
            <a
              key={`link-${idx}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {part}
            </a>
          );
          elements.push(
            <div key={`yt-${idx}-${i}`} className="my-2">
              <iframe
                width="320"
                height="180"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded"
              ></iframe>
            </div>
          );
        } else {
          elements.push(
            <a
              key={`link-${idx}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {part}
            </a>
          );
        }
      } else {
        elements.push(
          <React.Fragment key={`txt-${idx}-${i}`}>{part}</React.Fragment>
        );
      }
    });
    if (idx !== lines.length - 1) elements.push(<br key={`br-${idx}`} />);
  });
  
  return elements;
};

function MessageComponent({ message, isMyMessage, isFirstInGroup, isLastInGroup }) {
  // 🔍 시스템 메시지 감지 (다중 조건 체크)
  const isSystemMessage = message.type === 'system' || 
                         message.isSystemMessage === true ||
                         message.systemType ||
                         (message.text && (
                           message.text.includes('님이 입장했습니다') ||
                           message.text.includes('님이 퇴장했습니다')
                         ));

  // 🎯 시스템 메시지 렌더링 (개선된 UI)
  if (isSystemMessage) {
    console.log('🔔 시스템 메시지 렌더링:', message);
    return (
      <div className="flex justify-center my-3">
        <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 text-xs rounded-full shadow-sm border border-gray-200">
          <svg className="w-3 h-3 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message.text}
        </div>
      </div>
    );
  }
  
  // 🚨 타입이 명확하지 않은 메시지 디버깅
  if (!message.type && !message.isSystemMessage) {
    console.log('⚠️ 타입이 명확하지 않은 메시지:', message);
  }

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
    <div className={`flex w-full ${isMyMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      {/* 상대방 메시지인 경우만 프로필+닉네임 표시 */}
      {!isMyMessage && (
        <div className="flex items-start mr-2 gap-2">
          {/* 프로필 이미지 */}
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shadow border-2 border-white group flex-shrink-0">
            <div className={`w-full h-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-sm font-bold text-white`}>
              {initials}
            </div>
          </div>
          {/* 닉네임과 말풍선을 세로로 */}
          <div className="flex flex-col">
            {/* 닉네임 */}
            <div className="text-xl text-gray-600 font-medium max-w-20 truncate mb-1 flex items-center gap-1">
              {message.email?.split('@')[0] || '익명'}
            </div>
            {/* 말풍선+시간 */}
            <div className={`flex items-end gap-2 max-w-[85%]`}>
              <div className={`relative px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-bl-sm border border-gray-200 shadow-md word-break-keep-all`}
                   style={{ 
                     wordBreak: 'keep-all',
                     overflowWrap: 'break-word',
                     hyphens: 'auto',
                     minWidth: '200px',
                     maxWidth: '100%'
                   }}>
                <div className="absolute -left-2 bottom-3 w-0 h-0 border-r-8 border-r-white border-t-4 border-t-transparent border-b-4 border-b-transparent drop-shadow-sm"></div>
                <div className="text-lg leading-relaxed text-left whitespace-pre-wrap font-normal"
                     style={{ 
                       wordBreak: 'keep-all',
                       overflowWrap: 'break-word',
                       lineHeight: '1.5'
                     }}>
                  {message.fileType ? renderFileMessage(message) : renderMessageWithPreview(message.text)}
                </div>
              </div>
              
              {/* 시간 */}
              <div className="flex flex-col items-start gap-1 pb-1">
                <div className="text-base text-gray-500 opacity-80 select-none whitespace-nowrap">{timestamp}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 내 메시지는 기존과 동일 */}
      {isMyMessage && (
        <div className={`flex items-end gap-2 max-w-[85%] flex-row-reverse`}>
          <div className={`relative px-4 py-3 rounded-2xl bg-yellow-300 text-gray-800 rounded-br-sm shadow-md word-break-keep-all`}
               style={{ 
                 wordBreak: 'keep-all',
                 overflowWrap: 'break-word',
                 hyphens: 'auto',
                 minWidth: '200px',
                 maxWidth: '100%'
               }}>
            <div className="absolute -right-2 bottom-3 w-0 h-0 border-l-8 border-l-yellow-300 border-t-4 border-t-transparent border-b-4 border-b-transparent drop-shadow-sm"></div>
            <div className="text-lg leading-relaxed text-left whitespace-pre-wrap font-normal"
                 style={{ 
                   wordBreak: 'keep-all',
                   overflowWrap: 'break-word',
                   lineHeight: '1.5'
                 }}>
              {message.fileType ? renderFileMessage(message) : renderMessageWithPreview(message.text)}
            </div>
          </div>
          
          {/* 시간 */}
          <div className="flex flex-col items-end gap-1 pb-1">
            <div className="text-base text-gray-500 opacity-80 select-none whitespace-nowrap">{timestamp}</div>
          </div>
        </div>
      )}
    </div>
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
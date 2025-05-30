import React, { useRef, useEffect } from 'react';
import { auth } from '../../firebase';

function Message({ message, isMyMessage }) {
  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] break-words rounded-lg px-4 py-2 ${
          isMyMessage ? 'bg-blue-500 text-white' : 'bg-gray-100'
        }`}
      >
        {!isMyMessage && (
          <div className="text-xs text-gray-500 mb-1">{message.email}</div>
        )}
        <div>{message.text}</div>
        <div className="text-xs text-right mt-1 opacity-70">
          {message.createdAt?.seconds
            ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString()
            : ''}
        </div>
      </div>
    </div>
  );
}

export function MessageList({ messages, myJoinedAt }) {
  const scrollRef = useRef();
  const currentUser = auth.currentUser;

  // 새 메시지가 올 때마다 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 내가 입장한 시간 이후의 메시지만 표시
  const filteredMessages = messages.filter(msg => {
    if (!myJoinedAt) return true;
    return msg.createdAt?.seconds >= myJoinedAt.seconds;
  });

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-2"
      style={{ scrollbarWidth: 'none' }}
    >
      {filteredMessages.map((message) => (
        <Message
          key={message.id}
          message={message}
          isMyMessage={message.uid === currentUser?.uid}
        />
      ))}
    </div>
  );
} 
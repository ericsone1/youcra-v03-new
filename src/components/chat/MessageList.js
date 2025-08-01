import React, { useRef, useEffect, useMemo } from 'react';
import { auth } from '../../firebase';
import { Message } from './Message';

export function MessageList({ messages, myJoinedAt, messagesLoading, userNickMap = {} }) {
  const scrollRef = useRef();
  const bottomRef = useRef();
  const currentUser = auth.currentUser;



  // 새 메시지가 올 때마다 부드럽게 스크롤
  useEffect(() => {
    if (bottomRef.current && !messagesLoading) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, messagesLoading]);

  // 메시지 필터링 로직을 메모이제이션
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      if (!myJoinedAt) return true;
      return msg.createdAt?.seconds >= myJoinedAt.seconds;
    });
  }, [messages, myJoinedAt]);

  // 날짜별로 메시지 그룹화
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = '';
    
    filteredMessages.forEach((message, index) => {
      // 원본 메시지로부터 날짜 추출
      const messageDate = message.createdAt?.seconds 
        ? new Date(message.createdAt.seconds * 1000).toDateString()
        : new Date().toDateString();
      
      // 날짜 구분선 추가
      if (messageDate !== currentDate) {
        groups.push({
          type: 'date',
          date: messageDate,
          id: `date-${messageDate}`
        });
        currentDate = messageDate;
      }

      // 🔍 메시지 타입 감지 (다중 조건 체크)
      const isSystemMessage = message.type === 'system' || 
                             message.isSystemMessage === true ||
                             message.systemType ||
                             (message.text && (
                               message.text.includes('님이 입장했습니다') ||
                               message.text.includes('님이 퇴장했습니다')
                             ));

      if (isSystemMessage) {
        // 🎯 시스템 메시지는 원본 보존하되 타입 명시
        groups.push({
          ...message,
          type: 'system',
          isSystemMessage: true,
          id: message.id || `system-${index}`
        });
      } else {
        // 📝 일반 메시지 그룹화
        groups.push({
          ...message,
          type: 'message',
          isFirstInGroup: index === 0 || 
                         filteredMessages[index - 1]?.uid !== message.uid || 
                         (filteredMessages[index - 1]?.type === 'system' || filteredMessages[index - 1]?.isSystemMessage),
          isLastInGroup: index === filteredMessages.length - 1 || 
                        filteredMessages[index + 1]?.uid !== message.uid || 
                        (filteredMessages[index + 1]?.type === 'system' || filteredMessages[index + 1]?.isSystemMessage)
        });
      }
    });
    
    return groups;
  }, [filteredMessages]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
  };

  return (
    <main
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-2 chat-scroll"
      style={{ 
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        paddingTop: '100px', // 헤더가 가리지 않도록 상단 패딩 증가
        paddingBottom: '120px' // 입력창이 가리지 않도록 하단 패딩 증가
      }}
      role="log"
      aria-label="메시지 목록"
      aria-live="polite"
    >
      {/* 메시지 로딩 중 표시 */}
      {messagesLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center fade-in">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-500 text-sm font-medium">메시지를 찾는중...</div>
        </div>
      )}

      {!messagesLoading && groupedMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center fade-in">
          <div className="w-20 h-20 mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.456l-3.5 2-1.5-1.5 2-3.5A8.959 8.959 0 013 12c0-4.418 3.582 8-8s8 3.582 8 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3 gradient-text">대화를 시작해보세요</h3>
          <p className="text-gray-500 max-w-xs leading-relaxed">
            첫 번째 메시지를 보내서 멋진 대화를 시작해보세요! ✨
          </p>
          <div className="mt-6 flex space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      ) : !messagesLoading && (
        <div className="space-y-2">
          {groupedMessages.map((item, index) => {
            if (item.type === 'date') {
              return (
                <div key={item.id} className="flex justify-center my-8">
                  <div className="glass text-gray-600 text-sm rounded-full px-6 py-3 shadow-md border border-white/30 font-medium fade-in">
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(item.date)}</span>
                    </span>
                  </div>
                </div>
              );
            } else if (item.type === 'system') {
              // 시스템 메시지 처리
              return (
                <div key={item.id || `system-${index}`}>
                  <Message message={item} userNickMap={userNickMap} />
                </div>
              );
            } else {
              // 일반 메시지 처리
              return (
                <div
                  key={item.id || `msg-${index}`}
                  className="slide-up"
                  style={{ animationDelay: `${Math.min(index * 0.05, 1)}s` }}
                >
                  <Message
                    message={item}
                    isMyMessage={item.uid === currentUser?.uid}
                    isFirstInGroup={item.isFirstInGroup}
                    isLastInGroup={item.isLastInGroup}
                    userNickMap={userNickMap}
                  />
                </div>
              );
            }
          })}
        </div>
      )}
      {/* spacer to ensure last message is above input area */}
      <div ref={bottomRef} className="h-16" />
    </main>
  );
} 
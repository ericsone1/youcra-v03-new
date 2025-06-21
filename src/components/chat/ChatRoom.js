import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useChat } from '../../hooks/useChat';
import { MessageList } from './MessageList';
import VirtualizedMessageList from './VirtualizedMessageList';
import { MessageInput } from './MessageInput';

export function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [useVirtualization, setUseVirtualization] = useState(false);
  const {
    loading,
    messagesLoading,
    error,
    roomInfo,
    messages,
    participants,
    myJoinedAt,
    sendMessage,
    joinRoom,
    leaveRoom,
  } = useChat(roomId);

  // 가상화 모드 자동 전환 (500개 이상 메시지일 때)
  useEffect(() => {
    setUseVirtualization(messages.length > 500);
  }, [messages.length]);

  // 비로그인 접근 제한
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        alert("로그인 후 이용 가능합니다.");
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 채팅방 입장
  useEffect(() => {
    if (!loading && auth.currentUser) {
      joinRoom().catch(error => {
        console.error("채팅방 입장 실패:", error);
      });
    }
  }, [loading, joinRoom]);

  // 채팅방 퇴장
  useEffect(() => {
    return () => {
      if (auth.currentUser) {
        leaveRoom().catch(error => {
          console.error("채팅방 퇴장 실패:", error);
        });
      }
    };
  }, [leaveRoom]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">채팅방에 연결 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">연결 오류</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 개선된 상단 바 */}
      <div className="flex items-center justify-between px-4 py-4 bg-white shadow-lg border-b border-gray-200">
        <div className="flex items-center space-x-3 flex-1">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200 flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg text-gray-800">
              {roomInfo?.name || "채팅방"}
            </h1>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500">
                {participants.length}명이 대화 중 · {messages.length}개 메시지
              </p>
              {messages.length > 200 && (
                <button
                  onClick={() => setUseVirtualization(!useVirtualization)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                  title={useVirtualization ? '가상화 모드 ON - 성능 최적화 활성화' : '가상화 모드 OFF'}
                >
                  {useVirtualization ? '🚀' : '⚡'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* 온라인 상태 표시 */}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">온라인</span>
        </div>
      </div>

      {/* 메시지 목록 */}
      {useVirtualization ? (
        <VirtualizedMessageList
          messages={messages.filter(msg => {
            if (!myJoinedAt) return true;
            return msg.createdAt?.seconds >= myJoinedAt.seconds;
          })}
          currentUser={auth.currentUser}
          estimatedSize={80}
          overscan={15}
          autoScrollToBottom={true}
        />
      ) : (
        <MessageList 
          messages={messages} 
          myJoinedAt={myJoinedAt} 
          messagesLoading={messagesLoading}
        />
      )}

      {/* 메시지 입력 */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <MessageInput
          onSend={sendMessage}
          disabled={loading || !auth.currentUser}
        />
      </div>
    </div>
  );
} 
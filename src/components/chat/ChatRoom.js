import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useChat } from '../../hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const {
    loading,
    error,
    roomInfo,
    messages,
    participants,
    myJoinedAt,
    sendMessage,
    joinRoom,
    leaveRoom,
  } = useChat(roomId);

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
    return <div className="flex items-center justify-center h-screen">로딩중...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow">
        <button onClick={() => navigate(-1)} className="text-blue-500 font-bold">
          ← 뒤로
        </button>
        <div className="font-bold text-lg">{roomInfo?.name || "채팅방"}</div>
        <div className="text-sm text-gray-500">
          {participants.length}명 참여중
        </div>
      </div>

      {/* 메시지 목록 */}
      <MessageList messages={messages} myJoinedAt={myJoinedAt} />

      {/* 메시지 입력 */}
      <MessageInput
        onSend={sendMessage}
        disabled={loading || !auth.currentUser}
      />
    </div>
  );
} 
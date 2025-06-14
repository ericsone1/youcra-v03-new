import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function ChatRoomParticipants() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  // TODO: 실제 참여자 데이터 연동은 이후 단계에서 추가
  const participants = [
    { id: 1, name: '유저1', email: 'user1@email.com' },
    { id: 2, name: '유저2', email: 'user2@email.com' },
    { id: 3, name: '유저3', email: 'user3@email.com' },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center font-bold text-lg">참여자</div>
        <div className="w-8" />
      </header>
      <main className="flex-1 pt-20 pb-8 px-4 overflow-y-auto">
        <div className="space-y-3">
          {participants.map(user => (
            <div key={user.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 shadow">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-lg font-bold">
                {user.name.slice(0,2)}
              </div>
              <div>
                <div className="font-bold text-base">{user.name}</div>
                <div className="text-gray-500 text-xs">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ChatRoomParticipants; 
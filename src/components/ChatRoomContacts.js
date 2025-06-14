import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function ChatRoomContacts() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  // TODO: 실제 참여자 데이터 연동, 방장 여부 등은 이후 단계에서 추가
  const participants = [
    { id: 1, name: '경기도민', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', isOwner: false },
    { id: 2, name: '최락훈 팀장님', avatar: 'https://randomuser.me/api/portraits/men/33.jpg', isOwner: true },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center font-bold text-lg">대화상대</div>
        <div className="w-8" />
      </header>
      <main className="flex-1 pt-20 pb-8 px-4 overflow-y-auto">
        <div className="mb-4">
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-base shadow">
            + 초대하기
          </button>
        </div>
        <div className="space-y-3">
          {participants.map(user => (
            <div key={user.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 shadow">
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base flex items-center gap-1">
                  {user.name}
                  {user.isOwner && <span className="ml-1 text-yellow-500 text-lg">👑</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ChatRoomContacts; 
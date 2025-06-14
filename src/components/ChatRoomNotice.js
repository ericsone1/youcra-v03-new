import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function ChatRoomNotice() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  // TODO: 실제 공지 데이터 연동, 방장 여부 등은 이후 단계에서 추가
  const isOwner = false; // 임시
  const notices = [
    { id: 1, title: '채팅방 이용 안내', content: '서로 예의를 지켜주세요.' },
    { id: 2, title: '유튜브 영상 공유 방법', content: '상단 메뉴에서 시청하기를 눌러주세요.' },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center font-bold text-lg">공지사항</div>
        <div className="w-8" />
      </header>
      <main className="flex-1 pt-20 pb-8 px-4 overflow-y-auto">
        <div className="space-y-4">
          {notices.map(notice => (
            <div key={notice.id} className="bg-blue-50 rounded-xl p-4 shadow">
              <div className="font-bold text-base mb-1">{notice.title}</div>
              <div className="text-gray-700 text-sm whitespace-pre-line">{notice.content}</div>
            </div>
          ))}
        </div>
        {isOwner && (
          <button className="mt-8 w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition">+ 공지 추가</button>
        )}
      </main>
    </div>
  );
}

export default ChatRoomNotice; 
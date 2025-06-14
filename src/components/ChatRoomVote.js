import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function ChatRoomVote() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  // TODO: 실제 투표 데이터 연동, 방장 여부 등은 이후 단계에서 추가
  const isOwner = false; // 임시
  const votes = [
    { id: 1, question: '오늘 볼 유튜브 주제는?', options: ['게임', '음악', '브이로그'], voted: false },
    { id: 2, question: '다음 방장 추천?', options: ['유저1', '유저2'], voted: true },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center font-bold text-lg">투표</div>
        <div className="w-8" />
      </header>
      <main className="flex-1 pt-20 pb-8 px-4 overflow-y-auto">
        <div className="space-y-4">
          {votes.map(vote => (
            <div key={vote.id} className="bg-green-50 rounded-xl p-4 shadow">
              <div className="font-bold text-base mb-2">{vote.question}</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {vote.options.map((opt, idx) => (
                  <span key={idx} className="bg-white border border-green-200 rounded-full px-3 py-1 text-sm text-green-700 font-medium">{opt}</span>
                ))}
              </div>
              <div className="text-xs text-gray-500">{vote.voted ? '투표 완료' : '미참여'}</div>
            </div>
          ))}
        </div>
        {isOwner && (
          <button className="mt-8 w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition">+ 투표 생성</button>
        )}
      </main>
    </div>
  );
}

export default ChatRoomVote; 
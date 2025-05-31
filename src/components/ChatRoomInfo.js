import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ChatRoomInfo() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // 실제 데이터는 필요에 따라 props/context/Firestore 등에서 불러오세요
  // 아래는 예시 UI만 구현

  return (
    <div className="fixed inset-0 z-60 flex justify-center items-center bg-blue-100 min-h-screen">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden animate-slideInUp h-screen overflow-y-auto">
        {/* 상단 */}
        <div className="flex items-center justify-between px-4 py-4 border-b sticky top-0 bg-white z-10">
          <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
          <div className="flex-1 text-center font-bold text-lg">채팅방 정보</div>
          <div style={{ width: 32 }} />
        </div>
        {/* 프로필/방이름/참여자 */}
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-lg border-4 border-white mb-2">
            RO
          </div>
          <div className="font-bold text-lg mb-1 flex items-center gap-1">
            방 이름(더미)
            <span title="방장" className="ml-1 text-yellow-500 text-xl">👑</span>
          </div>
          <div className="text-gray-500 text-sm">참여자 1명</div>
        </div>
        {/* 메뉴 리스트 */}
        <div className="divide-y flex items-center justify-between px-6 py-4">
          <button className="bg-blue-500 text-white font-bold py-2 px-3 rounded hover:bg-blue-600 text-sm" onClick={() => navigate(`/chat/${roomId}/videos`)}>시청리스트</button>
          <button className="bg-blue-500 text-white font-bold py-2 px-3 rounded hover:bg-blue-600 text-sm ml-auto" style={{ minWidth: 0 }} onClick={() => navigate(`/chat/${roomId}/manage`)}>방 관리</button>
        </div>
        <div className="divide-y">
          <MenuItem icon="📢" label="공지" />
          <MenuItem icon="🗳️" label="투표" />
          <MenuItem icon="🤖" label="챗봇" />
          <MenuItem icon="🖼️" label="사진/동영상" />
          <MenuItem icon="🎬" label="시청하기" onClick={() => navigate(`/chat/${roomId}/videos`)} />
          <MenuItem icon="📁" label="파일" />
          <MenuItem icon="🔗" label="링크" />
          <MenuItem icon="📅" label="일정" />
          <MenuItem icon="👥" label="대화상대" />
        </div>
        <div className="p-4 flex flex-col gap-2">
          <button onClick={() => navigate(-1)} className="w-full text-blue-600 font-bold py-2 rounded hover:bg-blue-50">💬 채팅방으로 돌아가기</button>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 hover:bg-blue-50 cursor-pointer" onClick={onClick}>
      <span className="text-xl w-7 text-center">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';

function getInitial(name) {
  if (!name) return '방';
  return name.length > 2 ? name.slice(0,2) : name;
}

function ChatRoomMenu() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [participants, setParticipants] = useState([]);
  // TODO: 실제 데이터 연동(방 이름, 참여자 수, 프로필 등)은 이후 단계에서 추가
  const roomName = '최팀들오삼'; // 임시
  const participantsCount = 12; // 임시

  useEffect(() => {
    if (!roomId) return;
    const q = collection(db, 'chatRooms', roomId, 'participants');
    const unsub = onSnapshot(q, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const uid = d.id;
          // 사용자 정보 시도적으로 가져오기
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const u = userDoc.data();
              return {
                id: uid,
                name: u.displayName || u.nick || u.email?.split('@')[0] || '익명',
                avatar: u.photoURL || null,
                isOwner: u.role === 'owner' || false,
              };
            }
          } catch {}
          return { id: uid, name: uid.slice(0, 6), avatar: null, isOwner: false };
        })
      );
      setParticipants(list);
    });
    return () => unsub();
  }, [roomId]);

  const menuList = [
    { icon: '📢', label: '공지', to: `/chat/${roomId}/notice` },
    { icon: '🗳️', label: '투표', to: `/chat/${roomId}/vote` },
    { icon: '🤖', label: '챗봇', to: `/chat/${roomId}/bot` },
    { icon: '🖼️', label: '사진/동영상', to: `/chat/${roomId}/media` },
    { icon: '🎬', label: '시청하기', to: `/chat/${roomId}/videos` },
    { icon: '📁', label: '파일', to: `/chat/${roomId}/files` },
    { icon: '🔗', label: '링크', to: `/chat/${roomId}/links` },
    { icon: '📅', label: '일정', to: `/chat/${roomId}/schedule` },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">
          ←
        </button>
        <div className="flex-1 text-center font-bold text-lg">채팅방 정보</div>
        <div className="w-8" />
      </header>

      {/* 상단 방 정보 */}
      <div className="pt-20 pb-2 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow">
          {getInitial(roomName)}
        </div>
        <div className="font-bold text-lg mb-1">{roomName}</div>
        <div className="text-gray-500 text-sm">참여자 {participantsCount}명</div>
      </div>

      {/* 메뉴 리스트 */}
      <main className="flex-1 px-4 pb-8">
        <div className="bg-white rounded-xl shadow divide-y">
          {menuList.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-blue-50 text-gray-800 text-base font-medium transition"
              onClick={() => navigate(item.to)}
            >
              <span className="text-2xl mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* 대화상대 리스트 */}
        <div className="mt-6 bg-white rounded-xl shadow divide-y">
          <div className="px-5 py-3 font-bold text-gray-700 flex items-center gap-2">
            👥 대화상대
          </div>
          {participants.length === 0 ? (
            <div className="px-5 py-4 text-gray-500 text-sm">아직 참여자가 없습니다.</div>
          ) : (
            participants.map((user) => (
              <button
                key={user.id}
                className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-blue-50 transition"
                onClick={() => navigate(`/profile/${roomId}/${user.id}`)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                    {user.name.slice(0,2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-sm font-medium text-gray-800 flex items-center gap-1">
                  {user.name}
                  {user.isOwner && <span className="text-yellow-500">👑</span>}
                </div>
              </button>
            ))
          )}
        </div>

        {/* 채팅방 나가기 버튼 */}
        <button
          onClick={() => {
            if (window.confirm('채팅방에서 나가시겠습니까?')) {
              navigate('/chat');
            }
          }}
          className="mt-6 w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl shadow"
        >
          채팅방 나가기
        </button>
      </main>
    </div>
  );
}

export default ChatRoomMenu;
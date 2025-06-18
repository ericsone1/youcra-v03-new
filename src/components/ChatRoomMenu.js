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
  const [roomData, setRoomData] = useState(null);

  // 방 정보 가져오기
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'chatRooms', roomId);
    const unsub = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoomData(doc.data());
      }
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      console.log('🔍 [방메뉴] roomId 없음');
      return;
    }
    
    console.log('🔍 [방메뉴] 참여자 목록 로딩 시작:', roomId);
    
    const q = collection(db, 'chatRooms', roomId, 'participants');
    const unsub = onSnapshot(q, async (snap) => {
      console.log('🔍 [방메뉴] participants 컬렉션 문서 수:', snap.size);
      
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const uid = d.id;
          console.log('🔍 [방메뉴] 참여자 ID:', uid);
          
          // 사용자 정보 시도적으로 가져오기
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const u = userDoc.data();
              console.log('🔍 [방메뉴] 사용자 정보:', u);
              return {
                id: uid,
                name: u.displayName || u.nick || u.email?.split('@')[0] || '익명',
                avatar: u.photoURL || null,
                isOwner: u.role === 'owner' || false,
              };
            } else {
              console.log('🔍 [방메뉴] 사용자 문서 없음:', uid);
            }
          } catch (error) {
            console.log('🔍 [방메뉴] 사용자 정보 가져오기 실패:', error);
          }
          return { id: uid, name: uid.slice(0, 6), avatar: null, isOwner: false };
        })
      );
      
      console.log('🔍 [방메뉴] 최종 참여자 목록:', list);
      console.log('🔍 [방메뉴] 참여자 수:', list.length);
      
      // 실제 참여자만 설정
      setParticipants(list);
    });
    return () => unsub();
  }, [roomId]);

  const menuList = [
    { icon: '📢', label: '공지', to: `/chat/${roomId}/notice` },
    { icon: '🗳️', label: '투표', to: `/chat/${roomId}/vote` },
    { icon: '🤖', label: '챗봇', to: `/chat/${roomId}/bot` },
    { icon: '🖼️', label: '사진/동영상', to: `/chat/${roomId}/media` },
    { icon: '📁', label: '파일', to: `/chat/${roomId}/files` },
    { icon: '🔗', label: '링크', to: `/chat/${roomId}/links` },
    { icon: '📅', label: '일정', to: `/chat/${roomId}/schedule` },
  ];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
      {/* 상단 헤더 - 고정 */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">
          ←
        </button>
        <div className="flex-1 text-center font-bold text-lg">채팅방 정보</div>
        <div className="w-8" />
      </header>

      {/* 방 정보 - 고정 */}
      <div className="px-4 py-4 flex flex-col items-center bg-white border-b">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow">
          {getInitial(roomData?.name)}
        </div>
        <div className="font-bold text-lg mb-1">{roomData?.name || '채팅방'}</div>
        <div className="text-gray-500 text-sm">참여자 {participants.length}명</div>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4">
      {/* 메뉴 리스트 */}
          <div className="bg-white rounded-xl shadow border">
            {menuList.map((item, index) => (
            <button
              key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 text-gray-800 text-sm font-medium transition ${
                  index !== menuList.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              onClick={() => navigate(item.to)}
            >
                <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* 대화상대 리스트 */}
          <div className="bg-white rounded-xl shadow border">
            <div className="px-4 py-3 font-bold text-gray-700 flex items-center gap-2 bg-gray-50 border-b">
              👥 대화상대 ({participants.length}명)
          </div>
            
          {participants.length === 0 ? (
              <div className="px-4 py-8 text-gray-500 text-sm text-center">
                아직 참여자가 없습니다.
              </div>
          ) : (
              <div className="divide-y divide-gray-100">
                {participants.map((user) => (
              <button
                key={user.id}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-blue-50 transition"
                onClick={() => navigate(`/profile/${roomId}/${user.id}`)}
              >
                {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
                    {user.name.slice(0,2).toUpperCase()}
                  </div>
                )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                        <span className="truncate">{user.name}</span>
                        {user.isOwner && <span className="text-yellow-500 flex-shrink-0">👑</span>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      ›
                </div>
              </button>
                ))}
              </div>
          )}
        </div>

        {/* 채팅방 나가기 버튼 */}
        <button
          onClick={() => {
            if (window.confirm('채팅방에서 나가시겠습니까?')) {
              navigate('/chat');
            }
          }}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition-colors"
        >
          채팅방 나가기
        </button>
        </div>
      </div>
    </div>
  );
}

export default ChatRoomMenu;
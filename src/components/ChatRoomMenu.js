import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { roomIdFromParam, roomPath } from '../utils/route';

function getInitial(name) {
  if (!name) return '방';
  return name.length > 2 ? name.slice(0,2) : name;
}

function ChatRoomMenu() {
  const navigate = useNavigate();
  const { roomId: rawRoomId } = useParams();
  const roomId = roomIdFromParam(rawRoomId);
  const [participants, setParticipants] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 실제 방 이름과 참여자 수
  const roomName = roomData?.name || '채팅방';
  const participantsCount = participants.length;

  // 채팅방 데이터 가져오기
  useEffect(() => {
    if (!roomId) return;
    
    const fetchRoomData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'chatRooms', roomId));
        if (roomDoc.exists()) {
          const data = roomDoc.data();
          setRoomData(data);
        }
        setLoading(false);
      } catch (error) {
        console.error('❌ 방 데이터 가져오기 실패:', error);
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  // 참여자 데이터 실시간 구독
  useEffect(() => {
    if (!roomId) return;
    const q = collection(db, 'chatRooms', roomId, 'participants');
    const unsub = onSnapshot(q, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const uid = d.id;
          const participantData = d.data();
          
          // 사용자 정보 가져오기 - 더 포괄적인 닉네임 처리
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // 닉네임 우선순위: nickname > displayName > email 앞부분 > 익명
              const displayName = userData.nickname || 
                                userData.displayName || 
                                userData.nick || 
                                userData.email?.split('@')[0] || 
                                '익명';
              
              return {
                id: uid,
                name: displayName,
                avatar: userData.photoURL || userData.profileImage || null,
                isOwner: participantData.role === 'owner' || 
                         userData.role === 'owner' || 
                         roomData?.createdBy === uid || 
                         false,
                email: userData.email || null,
                joinedAt: participantData.joinedAt || null,
              };
            }
          } catch (error) {
            console.error('사용자 정보 가져오기 실패:', uid, error);
          }
          
          // 사용자 정보를 가져올 수 없는 경우 기본값
          return { 
            id: uid, 
            name: uid.slice(0, 6) + '...', 
            avatar: null, 
            isOwner: false,
            email: null,
            joinedAt: participantData.joinedAt || null,
          };
        })
      );
      setParticipants(list);
    });
    return () => unsub();
  }, [roomId, roomData]);

  // 방장 확인
  const myUid = auth.currentUser?.uid;
  const isOwner = roomData && myUid && (
    roomData.createdBy === myUid ||
    participants.some(p => p.id === myUid && p.isOwner)
  );

  const menuList = [
    { icon: '��', label: '공지', to: roomPath(roomId, 'notice') },
    { icon: '🗳️', label: '투표', to: roomPath(roomId, 'vote') },
    { icon: '🤖', label: '챗봇', to: roomPath(roomId, 'bot') },
    { icon: '🖼️', label: '사진/동영상', to: roomPath(roomId, 'media') },
    { icon: '🎬', label: '시청하기', to: roomPath(roomId, 'videos') },
    { icon: '📁', label: '파일', to: roomPath(roomId, 'files') },
    { icon: '🔗', label: '링크', to: roomPath(roomId, 'links') },
    { icon: '📅', label: '일정', to: roomPath(roomId, 'schedule') },
  ];

  // 방장 전용 메뉴
  const ownerMenuList = [
    { icon: '⭐', label: '시청인증 설정', to: roomPath(roomId, 'certification-settings') },
    { icon: '⚙️', label: '방 관리', to: roomPath(roomId, 'manage') },
  ];

  if (loading) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
          <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">
            ←
          </button>
          <div className="flex-1 text-center font-bold text-lg">채팅방 정보</div>
          <div className="w-8" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

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
        {/* 방장 전용 메뉴 - 최상단에 배치 */}
        {isOwner && (
          <div className="mb-6 bg-white rounded-xl shadow divide-y">
            <div className="px-5 py-3 font-bold text-gray-700 flex items-center gap-2">
              👑 방장 전용
            </div>
            {ownerMenuList.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-yellow-50 text-gray-800 text-base font-medium transition"
                onClick={() => navigate(item.to)}
              >
                <span className="text-2xl mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* 일반 메뉴 */}
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
            👥 대화상대 ({participants.length}명)
          </div>
          {participants.length === 0 ? (
            <div className="px-5 py-4 text-gray-500 text-sm">아직 참여자가 없습니다.</div>
          ) : (
            participants.map((user) => (
              <button
                key={user.id}
                className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-blue-50 transition"
                onClick={() => navigate(`/profile/${encodeURIComponent(roomId)}/${user.id}`)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold border-2 border-gray-200">
                    {user.name.slice(0,2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{user.name}</span>
                    {user.isOwner && <span className="text-yellow-500 text-lg">👑</span>}
                  </div>
                  {user.email && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {user.email}
                    </div>
                  )}
                </div>
                <div className="text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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
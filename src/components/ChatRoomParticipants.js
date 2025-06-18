import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function ChatRoomParticipants() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { currentUser } = useAuth();
  
  const [participants, setParticipants] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 방 정보 및 참여자 목록 실시간 구독
  useEffect(() => {
    if (!roomId || !currentUser) return;

    // 방 정보 가져오기
    const fetchRoomData = async () => {
      try {
        const roomRef = doc(db, 'chatRooms', roomId);
        const roomSnapshot = await getDoc(roomRef);
        if (roomSnapshot.exists()) {
          setRoomData(roomSnapshot.data());
        }
      } catch (error) {
        console.error('방 정보 로딩 실패:', error);
      }
    };

    // 참여자 목록 실시간 구독
    const participantsRef = collection(db, 'chatRooms', roomId, 'participants');
    const unsubscribe = onSnapshot(participantsRef, async (snapshot) => {
      try {
        const participantsList = await Promise.all(
          snapshot.docs.map(async (participantDoc) => {
            const uid = participantDoc.id;
            const participantData = participantDoc.data();
            
            // 사용자 정보 가져오기
            try {
              const userRef = doc(db, 'users', uid);
              const userSnapshot = await getDoc(userRef);
              
              if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                return {
                  id: uid,
                  name: userData.displayName || userData.nick || userData.name || userData.email?.split('@')[0] || '익명',
                  email: userData.email || '이메일 없음',
                  avatar: userData.photoURL || userData.profileImage || null,
                  joinedAt: participantData.joinedAt,
                  role: participantData.role || 'member',
                  isOwner: participantData.role === 'owner' || uid === roomData?.createdBy,
                  isOnline: participantData.isOnline || false
                };
              }
            } catch (userError) {
              console.error('사용자 정보 로딩 실패:', userError);
            }
            
            // 사용자 정보를 찾을 수 없는 경우 기본값 반환
            return {
              id: uid,
              name: uid.slice(0, 8) + '...',
              email: '정보 없음',
              avatar: null,
              joinedAt: participantData.joinedAt,
              role: participantData.role || 'member',
              isOwner: participantData.role === 'owner',
              isOnline: participantData.isOnline || false
            };
          })
        );
        
        // 방장을 맨 위로, 나머지는 이름순으로 정렬
        participantsList.sort((a, b) => {
          if (a.isOwner && !b.isOwner) return -1;
          if (!a.isOwner && b.isOwner) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setParticipants(participantsList);
      } catch (error) {
        console.error('참여자 목록 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    });

    fetchRoomData();

    return () => unsubscribe();
  }, [roomId, currentUser, roomData?.createdBy]);

  // 시간 포맷팅
  const formatJoinTime = (timestamp) => {
    if (!timestamp) return '참여 시간 없음';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return '참여 시간 없음';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
          <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
          <div className="flex-1 text-center font-bold text-lg">참여자</div>
          <div className="w-8" />
        </header>
        <main className="flex-1 pt-20 pb-8 px-4 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4 mx-auto"></div>
            <div className="text-gray-500">참여자 목록을 불러오는 중...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center font-bold text-lg">참여자 ({participants.length}명)</div>
        <div className="w-8" />
      </header>

      <main className="flex-1 pt-20 pb-8 px-4 overflow-y-auto">
        {participants.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-6xl mb-4">👥</div>
            <div className="text-gray-500">
              <div className="font-medium mb-1">참여자가 없습니다</div>
              <div className="text-sm">아직 이 채팅방에 참여한 사람이 없어요</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((user) => (
              <div key={user.id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
                <button
                  className="w-full p-4 text-left hover:bg-gray-50 rounded-xl transition-colors"
                  onClick={() => navigate(`/profile/${roomId}/${user.id}`)}
                >
                  <div className="flex items-center gap-3">
                    {/* 프로필 이미지 */}
                    <div className="relative">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold ${user.avatar ? 'hidden' : 'flex'}`}
                      >
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      
                      {/* 온라인 상태 표시 */}
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* 사용자 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800 truncate">{user.name}</span>
                        {user.isOwner && (
                          <span className="text-yellow-500 text-lg" title="방장">👑</span>
                        )}
                        {user.role === 'admin' && (
                          <span className="text-blue-500 text-sm" title="관리자">🛡️</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      {user.joinedAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          {formatJoinTime(user.joinedAt)} 참여
                        </div>
                      )}
                    </div>

                    {/* 화살표 */}
                    <div className="text-gray-400 flex-shrink-0">
                      ›
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ChatRoomParticipants; 
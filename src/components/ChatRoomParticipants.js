import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function ChatRoomParticipants() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { currentUser } = useAuth();
  
  const [participants, setParticipants] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [videoList, setVideoList] = useState([]);
  const [participantWatchRates, setParticipantWatchRates] = useState({});
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
    const unsubscribeParticipants = onSnapshot(participantsRef, async (snapshot) => {
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
                  isOnline: participantData.isOnline || false,
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
              isOnline: participantData.isOnline || false,
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

    // 영상 목록 실시간 구독
    const unsubscribeVideos = onSnapshot(
      collection(db, 'chatRooms', roomId, 'videos'),
      (snapshot) => {
        const videosList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVideoList(videosList);
      }
    );

    fetchRoomData();

    return () => {
      unsubscribeParticipants();
      unsubscribeVideos();
    };
  }, [roomId, currentUser, roomData?.createdBy]);

  // 참여자와 영상 목록이 모두 로드된 후 시청률 계산
  useEffect(() => {
    if (participants.length > 0 && videoList.length > 0) {
      calculateWatchRates(videoList, participants).then(watchRates => {
        setParticipantWatchRates(watchRates);
      });
    }
  }, [participants, videoList, roomId]);

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

  // 시청률 계산 함수
  const calculateWatchRates = async (videosList, participantsList) => {
    if (!videosList.length || !participantsList.length) {
      return {};
    }

    const watchRates = {};
    
    for (const participant of participantsList) {
      let certifiedCount = 0;
      
      // 각 영상에 대해 이 참여자가 인증했는지 확인
      for (const video of videosList) {
        try {
          const certificationsRef = collection(db, 'chatRooms', roomId, 'videos', video.id, 'certifications');
          const certificationsSnapshot = await getDocs(certificationsRef);
          
          const hasCertified = certificationsSnapshot.docs.some(doc => {
            const certData = doc.data();
            return certData.uid === participant.id;
          });
          
          if (hasCertified) {
            certifiedCount++;
          }
        } catch (error) {
          console.error('시청률 계산 오류:', error);
        }
      }
      
      // 시청률 계산 (인증한 영상 수 / 전체 영상 수 * 100)
      const watchRate = videosList.length > 0 ? Math.round((certifiedCount / videosList.length) * 100) : 0;
      watchRates[participant.id] = watchRate;
    }
    
    return watchRates;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
        <header className="flex items-center justify-between px-4 py-3 border-b border-blue-200 z-30 bg-gradient-to-r from-blue-100 to-indigo-100">
          <button 
            onClick={() => navigate(-1)}
            className="text-2xl text-blue-600 hover:text-blue-800"
          >
            ←
          </button>
          <h1 className="font-bold text-lg text-blue-800">참여자 목록</h1>
          <div className="w-8"></div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-blue-200 z-30 bg-gradient-to-r from-blue-100 to-indigo-100">
        <button 
          onClick={() => navigate(-1)}
          className="text-2xl text-blue-600 hover:text-blue-800"
        >
          ←
        </button>
        <h1 className="font-bold text-lg text-blue-800">참여자 목록 ({participants.length}명)</h1>
        <div className="w-8"></div>
      </header>

      {/* 참여자 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {participants.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-blue-600">
              <p className="text-lg mb-2">👥</p>
              <p>아직 참여자가 없습니다</p>
            </div>
          </div>
        ) : (
          participants.map((user) => (
            <div key={user.id} className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg hover:border-blue-200 transition-colors">
              <button
                className="w-full p-4 text-left hover:bg-blue-50/50 rounded-xl transition-colors"
                onClick={() => {
                  if (!user.id || user.id === 'undefined' || user.id === 'null') {
                    alert('이 사용자의 프로필 정보를 찾을 수 없습니다.');
                    return;
                  }
                  navigate(`/profile/${roomId}/${user.id}`);
                }}
              >
                <div className="flex items-center gap-3">
                  {/* 프로필 이미지 */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-200">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              ${user.name?.slice(0, 2).toUpperCase() || '?'}
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {user.name?.slice(0, 2).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* 사용자 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-blue-800 truncate">{user.name}</span>
                      {user.isOwner && (
                        <span className="text-yellow-500 flex-shrink-0 text-lg" title="방장">👑</span>
                      )}
                      {user.role === 'admin' && (
                        <span className="text-blue-500 flex-shrink-0" title="관리자">🛡️</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <span>시청률 {participantWatchRates[user.id] ?? 0}%</span>
                      {user.isOnline && (
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          온라인
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 화살표 */}
                  <div className="text-blue-400 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          ))
        )}
      </div>

      {/* 하단 여백 */}
      <div className="h-4"></div>
    </div>
  );
}

export default ChatRoomParticipants; 
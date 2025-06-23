import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
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

    // 현재 사용자를 participants 컬렉션에 등록
    const addCurrentUser = async () => {
      try {
        const participantRef = doc(db, "chatRooms", roomId, "participants", currentUser.uid);
        await setDoc(participantRef, {
          email: currentUser.email,
          uid: currentUser.uid,
          joinedAt: serverTimestamp(),
        }, { merge: true }); // merge: true로 기존 데이터 유지
      } catch (error) {
        console.error('현재 사용자 등록 실패:', error);
      }
    };

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
                  name: userData.nickname || userData.displayName || userData.nick || userData.name || userData.email?.split('@')[0] || '익명',
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
        
        // 자신이 목록에 없으면 추가
        const hasCurrentUser = participantsList.some(p => p.id === currentUser.uid);
        if (!hasCurrentUser) {
          // 현재 사용자의 Firestore 정보 가져오기
          try {
            const currentUserRef = doc(db, 'users', currentUser.uid);
            const currentUserSnapshot = await getDoc(currentUserRef);
            let currentUserName = currentUser.displayName || currentUser.email?.split('@')[0] || '나';
            let currentUserAvatar = currentUser.photoURL || null;
            
            if (currentUserSnapshot.exists()) {
              const currentUserData = currentUserSnapshot.data();
              currentUserName = currentUserData.nickname || currentUserData.displayName || currentUserData.nick || currentUser.displayName || currentUser.email?.split('@')[0] || '나';
              currentUserAvatar = currentUserData.photoURL || currentUserData.profileImage || currentUser.photoURL || null;
            }
            
            participantsList.push({
              id: currentUser.uid,
              name: currentUserName,
              email: currentUser.email || '내 이메일',
              avatar: currentUserAvatar,
              joinedAt: { toDate: () => new Date() }, // 현재 시간
              role: 'member',
              isOwner: roomData?.createdBy === currentUser.uid,
              isOnline: true,
              isMe: true, // 자신임을 표시
            });
          } catch (error) {
            console.error('현재 사용자 정보 로딩 실패:', error);
            // 기본값으로 추가
            participantsList.push({
              id: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || '나',
              email: currentUser.email || '내 이메일',
              avatar: currentUser.photoURL || null,
              joinedAt: { toDate: () => new Date() },
              role: 'member',
              isOwner: roomData?.createdBy === currentUser.uid,
              isOnline: true,
              isMe: true,
            });
          }
        } else {
          // 자신을 찾아서 isMe 플래그 추가
          participantsList.forEach(p => {
            if (p.id === currentUser.uid) {
              p.isMe = true;
            }
          });
        }
        
        // 방장을 맨 위로, 나를 그 다음으로, 나머지는 이름순으로 정렬
        participantsList.sort((a, b) => {
          if (a.isOwner && !b.isOwner) return -1;
          if (!a.isOwner && b.isOwner) return 1;
          if (a.isMe && !b.isMe) return -1;
          if (!a.isMe && b.isMe) return 1;
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
    addCurrentUser();

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

  // 시청률 계산 함수 (최적화된 버전)
  const calculateWatchRates = async (videosList, participantsList) => {
    if (!videosList.length || !participantsList.length) {
      return {};
    }

    console.log('🔄 [참여자] 시청률 계산 시작:', { 
      참여자수: participantsList.length, 
      영상수: videosList.length 
    });

    try {
      // 1. 모든 영상의 인증 데이터를 병렬로 한 번에 가져오기
      const allCertificationsPromises = videosList.map(async (video) => {
        try {
          const certificationsRef = collection(db, 'chatRooms', roomId, 'videos', video.id, 'certifications');
          const certificationsSnapshot = await getDocs(certificationsRef);
          
          // 해당 영상에 인증한 사용자 UID 목록 반환
          const certifiedUids = certificationsSnapshot.docs.map(doc => doc.data().uid);
          
          return {
            videoId: video.id,
            certifiedUids: certifiedUids
          };
        } catch (error) {
          console.error(`영상 ${video.id} 인증 데이터 로딩 실패:`, error);
          return {
            videoId: video.id,
            certifiedUids: []
          };
        }
      });

      // 모든 인증 데이터 대기
      const allCertifications = await Promise.all(allCertificationsPromises);
      
      // 2. 인증 데이터를 Map으로 변환 (빠른 조회를 위해)
      const certificationMap = new Map();
      allCertifications.forEach(({ videoId, certifiedUids }) => {
        certificationMap.set(videoId, new Set(certifiedUids));
      });

      // 3. 각 참여자의 시청률 계산 (메모리에서 빠르게 처리)
      const watchRates = {};
      
      participantsList.forEach(participant => {
        let certifiedCount = 0;
        
        // 각 영상에 대해 이 참여자가 인증했는지 확인
        videosList.forEach(video => {
          const certifiedUids = certificationMap.get(video.id);
          if (certifiedUids && certifiedUids.has(participant.id)) {
            certifiedCount++;
          }
        });
        
        // 시청률 계산 (인증한 영상 수 / 전체 영상 수 * 100)
        const watchRate = videosList.length > 0 ? Math.round((certifiedCount / videosList.length) * 100) : 0;
        watchRates[participant.id] = watchRate;
      });

      console.log('✅ [참여자] 시청률 계산 완료:', watchRates);
      return watchRates;

    } catch (error) {
      console.error('❌ [참여자] 시청률 계산 전체 오류:', error);
      
      // 오류 발생 시 기본값 반환 (모든 참여자 0%)
      const fallbackRates = {};
      participantsList.forEach(participant => {
        fallbackRates[participant.id] = 0;
      });
      return fallbackRates;
    }
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
            <div key={user.id} className={`backdrop-blur-sm border rounded-xl shadow-lg hover:border-blue-200 transition-colors ${
              user.isMe 
                ? 'bg-green-50/90 border-green-200' 
                : 'bg-white/80 border-blue-100'
            }`}>
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
                      <span className="font-medium text-blue-800 truncate">
                        {user.name}
                        {user.isMe && <span className="text-green-600 font-bold"> (나)</span>}
                      </span>
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
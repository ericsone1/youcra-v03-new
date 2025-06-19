import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, onSnapshot, deleteDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  IoChatbubbleEllipsesOutline, 
  IoSettingsOutline, 
  IoHeartOutline,
  IoShareSocialOutline,
  IoSendOutline,
  IoEyeOutline,
  IoPeopleOutline,
  IoLockClosedOutline
} from "react-icons/io5";

export default function ChatRoomInfo() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [participantWatchRates, setParticipantWatchRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isOwner = roomData?.createdBy === currentUser?.uid;

  // 방장 확인 로직
  const myEmail = currentUser?.email;
  const myUid = currentUser?.uid;
  const isOwnerCheck = !loading && roomData && myUid && (
    roomData.createdBy === myUid ||
    roomData.ownerEmail === myEmail ||
    roomData.creatorEmail === myEmail ||
    roomData.owner === myUid ||
    roomData.hostUid === myUid
  );

  // 방 타입 정보
  const getRoomTypeInfo = (roomType) => {
    const roomTypes = {
      "collaboration": { name: "🤝 협업방", color: "bg-blue-500" },
      "subscribe": { name: "📺 맞구독방", color: "bg-red-500" },
      "youtube": { name: "🎬 YouTube 시청방", color: "bg-red-600" },
      "gaming": { name: "🎮 게임방", color: "bg-purple-500" },
      "study": { name: "📚 스터디방", color: "bg-green-500" },
      "chat": { name: "💬 자유채팅방", color: "bg-indigo-500" },
      "fan": { name: "⭐ 팬클럽방", color: "bg-yellow-500" },
      "event": { name: "🎉 이벤트방", color: "bg-pink-500" }
    };
    return roomTypes[roomType] || { name: "💬 채팅방", color: "bg-gray-500" };
  };

  // 비밀번호 확인 및 입장
  const handleJoinRoom = () => {
    if (roomData?.isPrivate && !isOwner) {
      setShowPasswordModal(true);
    } else {
      navigate(`/chat/${roomId}`);
    }
  };

  // 비밀번호 검증
  const handlePasswordSubmit = () => {
    if (!passwordInput.trim()) {
      setPasswordError("비밀번호를 입력해주세요.");
      return;
    }
    
    if (passwordInput === roomData.password) {
      setShowPasswordModal(false);
      setPasswordInput("");
      setPasswordError("");
      navigate(`/chat/${roomId}`);
    } else {
      setPasswordError("비밀번호가 틀렸습니다.");
      setPasswordInput("");
    }
  };

  // 채팅방 나가기 함수 추가
  const handleLeaveRoom = async () => {
    if (!currentUser) return;
    
    try {
      setLeaving(true);
      
      // 참여자 목록에서 제거
      await deleteDoc(doc(db, 'chatRooms', roomId, 'participants', currentUser.uid));
      
      // 시스템 메시지 추가
      const nick = currentUser.displayName || currentUser.email?.split('@')[0] || '익명';
      await addDoc(collection(db, 'chatRooms', roomId, 'messages'), {
        text: `${nick}님이 퇴장하셨습니다.`,
        system: true,
        action: 'exit',
        uid: 'system',
        createdAt: serverTimestamp()
      });
      
      // 세션 스토리지 정리
      sessionStorage.removeItem(`room_${roomId}_entered`);
      
      // 채팅방 목록으로 이동
      navigate('/chat');
    } catch (error) {
      console.error('채팅방 나가기 실패:', error);
      alert('채팅방 나가기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  };

  // 참여자별 시청률 계산 함수
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

  useEffect(() => {
    if (!roomId || !currentUser) return;

    const fetchRoomData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'chatRooms', roomId));
        if (roomDoc.exists()) {
          setRoomData(roomDoc.data());
          }
      } catch (error) {
        console.error('방 정보 로딩 실패:', error);
      }
    };

    // 참여자 실시간 구독
    const unsubscribeParticipants = onSnapshot(
      collection(db, 'chatRooms', roomId, 'participants'),
      async (snapshot) => {
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
                    watchRate: participantData.watchRate || 0
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
                watchRate: participantData.watchRate || 0
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
        }
      }
    );

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
    setLoading(false);

    return () => {
      unsubscribeParticipants();
      unsubscribeVideos();
    };
  }, [roomId, currentUser]);

  // 참여자와 영상 목록이 모두 로드된 후 시청률 계산
  useEffect(() => {
    if (participants.length > 0 && videoList.length > 0) {
      calculateWatchRates(videoList, participants).then(watchRates => {
        setParticipantWatchRates(watchRates);
      });
    }
  }, [participants, videoList, roomId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">🏠 채팅방 정보 페이지</div>
          <div className="text-lg mb-2">Room ID: {roomId}</div>
          <div className="spinner mb-4"></div>
          <div className="text-gray-600">채팅방 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 배경 이미지 (YouTube 썸네일 또는 기본 그라데이션)
  const backgroundImage = roomData?.youtubeVideoId 
    ? `https://img.youtube.com/vi/${roomData.youtubeVideoId}/maxresdefault.jpg`
    : null;

  const roomTypeInfo = getRoomTypeInfo(roomData?.roomType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-safe">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-blue-800">채팅방 정보</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 채팅방 프로필 섹션 */}
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-lg mb-4">
          <div className="text-center p-6">
            {/* 채팅방 이미지 */}
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden shadow-lg border-4 border-blue-200">
              <img 
                src={roomData?.imageUrl || `https://picsum.photos/seed/${roomId}/200/200`}
                alt="채팅방 이미지"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      ${roomData?.name?.slice(0, 2).toUpperCase() || '💬'}
                    </div>
                  `;
                }}
              />
            </div>
            
            <h2 className="text-xl font-bold text-blue-800 mb-2">{roomData?.name}</h2>
            <p className="text-blue-600 text-sm mb-4">참여자 {participants.length}명</p>
            <p className="text-blue-700 text-sm leading-relaxed">
              {roomData?.description || "새로 구독하며 소통하여 환영합니다! 함께 즐거운 시간을 보내요 🎉"}
            </p>
          </div>
        </div>

        {/* 🔝 방장 메뉴 - 상단으로 이동 */}
        {isOwner && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-xl shadow-md mb-4">
            <div className="p-3 border-b border-yellow-200">
              <h3 className="text-base font-bold text-yellow-800 flex items-center gap-2">
                <span className="text-lg">👑</span>
                방장 전용 메뉴
              </h3>
              <p className="text-yellow-700 text-xs mt-1">채팅방 관리 및 설정</p>
            </div>
            
            <div className="p-3">
              <button 
                onClick={() => navigate(`/chat/${roomId}/manage`)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-yellow-50 rounded-lg transition-colors text-left border border-yellow-200 hover:border-yellow-300"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🛠️</span>
                  <div>
                    <span className="text-yellow-800 font-medium text-sm block">채팅방 관리</span>
                    <span className="text-yellow-600 text-xs">참여자·방설정·영상관리</span>
                  </div>
                </div>
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 콘텐츠 시청리스트 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-md mb-4 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  콘텐츠 시청리스트
                </h3>
                <p className="text-purple-100 text-xs">
                  {videoList.length}개 영상
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate(`/chat/${roomId}/videos`)}
            className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
          >
            영상 목록 보기 →
          </button>
        </div>

        {/* 방 참여 인원 */}
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-lg mb-4 p-4">
          <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
            <span className="text-xl">👥</span>
            방 참여 인원
          </h3>
          <p className="text-blue-600 text-sm mb-4">이 채팅방에 참여한 멤버들을 확인할 수 있습니다</p>
        </div>

        {/* 참여자 목록 */}
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-lg">
          {participants.map((participant) => (
            <div 
              key={participant.id} 
              className="px-6 py-4 hover:bg-blue-50/50 transition-colors border-b border-blue-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-200">
                    <img 
                      src={`https://picsum.photos/seed/${participant.uid}/100/100`}
                      alt="프로필"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            ${(participant.name || participant.email?.split('@')[0] || '익명').slice(0, 2).toUpperCase()}
                          </div>
                        `;
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-medium text-blue-800">
                      {participant.name || participant.email?.split('@')[0] || '익명'}
                      <span className={`ml-2 text-sm font-medium ${
                        (participantWatchRates[participant.id] ?? 0) < 50 
                          ? 'text-red-500' 
                          : 'text-blue-500'
                      }`}>
                        시청률 {participantWatchRates[participant.id] ?? 0}%
                      </span>
                    </div>
                    {participant.role === 'host' && (
                      <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full font-medium">
                        👑 방장
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/profile/${roomId}/${participant.id}`)}
                  className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                  title="프로필 보기"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 채팅방 나가기 */}
        <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl shadow-lg">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="w-full p-4 text-red-600 hover:bg-red-50 rounded-2xl transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <span className="text-lg">🚪</span>
            채팅방 나가기
          </button>
        </div>
      </div>

      {/* 나가기 확인 모달 */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 text-center">채팅방 나가기</h3>
            <p className="text-blue-600 text-center mb-6">
              정말로 이 채팅방을 나가시겠습니까?<br/>
              나간 후에는 다시 초대받아야 합니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-3 px-4 border border-blue-300 rounded-xl text-blue-700 font-medium hover:bg-blue-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLeaveRoom}
                disabled={leaving}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-colors"
              >
                {leaving ? '나가는 중...' : '나가기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 공간 */}
      <div className="h-20"></div>
    </div>
  );
}

// 메뉴 아이템 컴포넌트
function MenuItem({ icon, label, subtitle, onClick }) {
  return (
    <div 
      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl w-8 text-center">{icon}</span>
        <div>
          <div className="font-medium text-gray-800">{label}</div>
          {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
        </div>
      </div>
      <span className="text-gray-400">›</span>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
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
  
  console.log('🏠 ChatRoomInfo 컴포넌트 로딩:', { roomId, currentUser: !!currentUser });
  
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  // 디버깅용 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development' && roomData && myUid) {
    console.log('🔍 방장 확인:', {
      myUid,
      myEmail,
      roomData: {
        createdBy: roomData.createdBy,
        ownerEmail: roomData.ownerEmail,
        creatorEmail: roomData.creatorEmail,
        owner: roomData.owner,
        hostUid: roomData.hostUid
      },
      isOwner
    });
  }

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
      (snapshot) => {
        const participantsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setParticipants(participantsList);
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4">
            <button 
            onClick={() => navigate(`/chat/${roomId}`)} 
            className="text-2xl text-gray-600 hover:text-blue-600"
            aria-label="뒤로가기"
            >
              ←
            </button>
          <h1 className="flex-1 text-center font-bold text-lg">채팅방 정보</h1>
          <div style={{ width: 32 }} />
        </div>
          </div>

      <div className="max-w-md mx-auto">
        {/* 방 프로필 섹션 */}
        <div className="bg-white mb-4">
          <div className="flex flex-col items-center py-8">
            <img 
              src={roomData?.profileImage || "https://picsum.photos/seed/chatroom/120/120"} 
              alt="방 프로필" 
              className="w-24 h-24 rounded-full mb-4 border-4 border-blue-200" 
            />
            <div className="font-bold text-xl mb-2 flex items-center gap-2">
              {roomData?.name || `채팅방 ${roomId?.slice(0, 8)}`}
              {isOwner && <span title="방장" className="text-yellow-500 text-2xl">👑</span>}
            </div>
            <div className="text-gray-500 text-sm">참여자 {participants.length}명</div>
            {(roomData?.description || roomData?.desc) && (
              <div className="text-gray-600 text-sm mt-2 text-center px-4">
                {roomData.description || roomData.desc}
              </div>
            )}
          </div>
        </div>

        {/* 콘텐츠 시청리스트 */}
        <div className="bg-white mb-4 p-4">
                  <button 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-3"
            onClick={() => navigate(`/chat/${roomId}/videos`)}
                  >
            <span className="text-xl">🎬</span>
            <span>콘텐츠 시청리스트</span>
            <span className="text-sm opacity-80">({videoList.length})</span>
                  </button>
          </div>

        {/* 방장 전용 메뉴 */}
        {isOwner && (
          <div className="bg-white mb-4 p-4">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
              <div className="text-center mb-3">
                <span className="text-yellow-600 font-bold text-sm">👑 방장 전용 메뉴</span>
              </div>
              <button
                className="w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-purple-600 text-sm transition-all"
                onClick={() => navigate(`/chat/${roomId}/manage`)}
              >
                ⚙️ 방 관리
              </button>
            </div>
          </div>
        )}

        {/* 메뉴 리스트 */}
        <div className="bg-white">
          <MenuItem 
            icon="👥" 
            label="방 참여 인원" 
            subtitle={`${participants.length}명`}
            onClick={() => navigate(`/chat/${roomId}/participants`)}
          />
          <MenuItem 
            icon="📺" 
            label="실시간 시청" 
            subtitle={`${videoList.length}개 영상`}
            onClick={() => navigate(`/chat/${roomId}/videos`)} 
          />
        </div>

        {/* 하단 버튼 */}
        <div className="bg-white mt-4 p-4">
          <button 
            onClick={handleJoinRoom}
            className="w-full text-blue-600 font-bold py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            💬 채팅방으로 돌아가기
          </button>
        </div>
      </div>

      {/* 비밀번호 입력 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-70 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IoLockClosedOutline className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">비밀방 입장</h3>
              <p className="text-gray-600 text-sm">비밀번호를 입력해주세요</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError("");
                }}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-3 border rounded-xl text-center text-lg font-mono tracking-widest"
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
              />
              
              {passwordError && (
                <div className="text-red-500 text-sm text-center">{passwordError}</div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput("");
                    setPasswordError("");
                  }}
                  className="flex-1 py-3 px-4 border rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
                >
                  입장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
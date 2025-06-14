import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
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
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [ownerData, setOwnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 방장 확인 로직
  const myEmail = auth.currentUser?.email;
  const myUid = auth.currentUser?.uid;
  const isOwner = !loading && roomData && myUid && (
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

  // 채팅방 정보 불러오기
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        
        // 채팅방 정보 가져오기
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        
        if (roomDoc.exists()) {
          const data = roomDoc.data();
          setRoomData(data);
          
          // 방장 정보 가져오기
          if (data.createdBy) {
            try {
              const ownerDoc = await getDoc(doc(db, "users", data.createdBy));
              if (ownerDoc.exists()) {
                setOwnerData(ownerDoc.data());
              }
            } catch (error) {
              console.log('방장 정보 로드 실패:', error);
            }
          }
        }

        // 참여자 정보 가져오기
        const messagesQuery = query(collection(db, "chatRooms", roomId, "messages"));
        const messagesSnapshot = await getDocs(messagesQuery);
        const uniqueEmails = new Set();
        
        messagesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email) {
            uniqueEmails.add(data.email);
          }
        });
        
        setParticipants(Array.from(uniqueEmails));
        
      } catch (error) {
        console.error("❌ 채팅방 정보 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-60 flex justify-center items-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-500 mx-auto mb-3"></div>
          <div className="text-gray-700 font-medium">로딩 중...</div>
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
    <div className="fixed inset-0 z-60 bg-gray-100">
      {/* 모바일 반응형: 최대 높이 제한 및 중앙 정렬 */}
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col bg-white">
        
        {/* 배경 이미지 영역 - 높이 제한 */}
        <div className="relative h-72 sm:h-80 overflow-hidden">
          {backgroundImage ? (
            <img 
              src={backgroundImage} 
              alt="채팅방 배경"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600"></div>
          )}
          
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* 상단 컨트롤 */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            >
              ←
            </button>
            {/* 설정 아이콘 - 방장에게만 표시 */}
            {isOwner ? (
              <button 
                onClick={() => navigate(`/chat/${roomId}/manage`)}
                className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all"
                title="방 관리"
              >
                <IoSettingsOutline size={20} />
              </button>
            ) : (
              <div className="w-10 h-10" />
            )}
          </div>

          {/* 방 통계 정보 (상단 우측) */}
          <div className="absolute top-16 right-4 flex flex-col gap-1.5 z-10">
            {/* 방 타입 표시 */}
            <div className={`${roomTypeInfo.color} backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 text-white text-xs font-medium`}>
              {roomTypeInfo.name}
            </div>
            
            {/* 비밀방 표시 */}
            {roomData?.isPrivate && (
              <div className="bg-red-500/80 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 text-white text-xs font-medium">
                <IoLockClosedOutline size={10} />
                비밀방
              </div>
            )}
            
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 text-white text-xs">
              <IoEyeOutline size={12} />
              <span>{roomData?.viewCount || Math.floor(Math.random() * 1000) + 100}</span>
            </div>
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 text-white text-xs">
              <IoPeopleOutline size={12} />
              <span>{participants.length}</span>
            </div>
          </div>

          {/* 방 정보 오버레이 (하단) */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12">
            <div className="text-white">
              <h1 className="text-lg font-bold mb-2 flex items-center gap-2">
                {roomData?.name || `채팅방 ${roomId.slice(0, 8)}`}
                {isOwner && <span className="text-yellow-400">👑</span>}
                {roomData?.isPrivate && <IoLockClosedOutline className="text-red-400" size={16} />}
              </h1>
              
              {/* 방 설명 */}
              <p className="text-white/90 text-xs mb-3 leading-relaxed line-clamp-2">
                {roomData?.description || 
                 roomData?.desc ||
                 roomData?.youtubeVideoTitle || 
                 "함께 영상을 보고 채팅하며 즐거운 시간을 보내요!"}
              </p>
            </div>
          </div>
        </div>

        {/* 컨텐츠 영역 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto bg-white p-4">
          {/* 방장 정보 */}
          {ownerData && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    {ownerData.displayName?.slice(0,2) || ownerData.email?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-gray-800 font-medium text-sm">
                      {ownerData.displayName || '방장'}
                    </div>
                    <div className="text-gray-500 text-xs">방장</div>
                  </div>
                </div>
                {!isOwner && (
                  <button 
                    onClick={() => navigate(`/dm/${roomData.createdBy}`)}
                    className="bg-blue-500 px-3 py-1.5 rounded-full text-white text-xs font-medium hover:bg-blue-600 transition-all flex items-center gap-1"
                  >
                    <IoSendOutline size={10} />
                    1:1 채팅
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 해시태그 */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
              #유크라
            </span>
            {roomData?.category && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
                #{roomData.category}
              </span>
            )}
            {roomData?.youtubeVideoId && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                #YouTube영상방
              </span>
            )}
            {roomData?.hashtags?.map((tag, idx) => (
              <span key={idx} className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>

          {/* 방 상세 정보 */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <h3 className="font-medium text-gray-800 mb-2">방 정보</h3>
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>참여자</span>
                <span className="font-medium">{participants.length}명</span>
              </div>
              <div className="flex justify-between">
                <span>조회수</span>
                <span className="font-medium">{roomData?.viewCount || Math.floor(Math.random() * 1000) + 100}</span>
              </div>
              <div className="flex justify-between">
                <span>방 타입</span>
                <span className="font-medium">{roomTypeInfo.name}</span>
              </div>
              {roomData?.isPrivate && (
                <div className="flex justify-between">
                  <span>접근</span>
                  <span className="font-medium text-red-500 flex items-center gap-1">
                    <IoLockClosedOutline size={12} />
                    비밀방
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼들 - 고정 위치 */}
        <div className="bg-white border-t p-4 pb-6">
          <button 
            onClick={handleJoinRoom}
            className="w-full bg-blue-500 text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg text-lg mb-3"
          >
            {roomData?.isPrivate && !isOwner ? (
              <>
                <IoLockClosedOutline size={20} />
                비밀방 입장하기
              </>
            ) : (
              <>
                <IoChatbubbleEllipsesOutline size={20} />
                채팅방 입장하기
              </>
            )}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {/* 좋아요 기능 */}}
              className="bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
            >
              <IoHeartOutline size={18} />
              좋아요
            </button>
            
            <button 
              onClick={() => navigator.share ? navigator.share({ 
                title: `YouCra - ${roomData?.name}`, 
                url: window.location.href 
              }) : alert("공유 기능을 지원하지 않는 브라우저입니다.")}
              className="bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
            >
              <IoShareSocialOutline size={18} />
              공유
            </button>
          </div>
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
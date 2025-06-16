import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

function ChatRoomProfile() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 방 정보 및 방장 정보 불러오기
  useEffect(() => {
    async function fetchRoomAndOwner() {
      try {
        // 방 정보 가져오기
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        if (roomDoc.exists()) {
          const room = roomDoc.data();
          setRoomData(room);

          // 방장 정보 가져오기
          if (room.createdBy) {
            const ownerDoc = await getDoc(doc(db, "users", room.createdBy));
            if (ownerDoc.exists()) {
              setOwnerData(ownerDoc.data());
            }
          }
        }
      } catch (error) {
        console.error("방 정보 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRoomAndOwner();
  }, [roomId]);

  // 참여자 리스트 불러오기
  useEffect(() => {
    if (!roomId) return;
    const q = collection(db, "chatRooms", roomId, "participants");
    const unsub = onSnapshot(q, (snapshot) => {
      const participantsList = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setParticipants(participantsList);
    });
    return () => unsub();
  }, [roomId]);

  // 영상 리스트 불러오기
  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const videosList = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setVideos(videosList);
    });
    return () => unsub();
  }, [roomId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-gray-600">채팅방 정보를 불러오는 중...</div>
      </div>
    </div>
  );

  if (!roomData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">😅</div>
        <div className="text-gray-600">채팅방 정보를 찾을 수 없습니다.</div>
      </div>
    </div>
  );

  // 방 타입별 정보
  const getRoomTypeInfo = (roomType) => {
    const types = {
      "collaboration": { name: "🤝 협업방", color: "bg-blue-500" },
      "subscribe": { name: "📺 맞구독방", color: "bg-red-500" },
      "youtube": { name: "🎬 YouTube 시청방", color: "bg-red-600" },
      "gaming": { name: "🎮 게임방", color: "bg-purple-500" },
      "study": { name: "📚 스터디방", color: "bg-green-500" },
      "chat": { name: "💬 자유채팅방", color: "bg-indigo-500" },
      "fan": { name: "⭐ 팬클럽방", color: "bg-yellow-500" },
      "event": { name: "🎉 이벤트방", color: "bg-pink-500" }
    };
    return types[roomType] || { name: "💬 채팅방", color: "bg-gray-500" };
  };

  const roomTypeInfo = getRoomTypeInfo(roomData.roomType);
  const isOwner = auth.currentUser?.uid === roomData.createdBy;

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden pb-20">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600">
          ←
        </button>
        <div className="flex-1 text-center font-bold text-lg">채팅방 프로필</div>
        <div className="w-8" />
      </div>

      {/* 커버 이미지 */}
      <div className="relative h-52 bg-gradient-to-r from-blue-400 to-purple-500">
        {roomData.youtubeVideoId && (
          <img 
            src={`https://img.youtube.com/vi/${roomData.youtubeVideoId}/maxresdefault.jpg`} 
            alt="방 커버" 
            className="w-full h-full object-cover" 
          />
        )}
        {/* 방 프로필 이미지 */}
        <div className="absolute left-1/2 -bottom-10 transform -translate-x-1/2">
          <img 
            src={roomData.profileImage || "https://picsum.photos/seed/chatroom/120/120"} 
            alt="방 프로필" 
            className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-200 object-cover" 
          />
        </div>
      </div>

      {/* 방 정보 */}
      <div className="pt-14 pb-4 text-center px-4">
        <div className="font-bold text-lg mb-1">{roomData.name}</div>
        <div className="text-sm text-gray-500 mb-2">
          {roomTypeInfo.name} • 참여자 {participants.length}명
        </div>
        
        {/* 방 설명 */}
        {(roomData.description || roomData.desc) && (
          <div className="text-gray-600 text-sm mt-2 mb-3 px-2">
            {roomData.description || roomData.desc}
          </div>
        )}

        {/* 해시태그 */}
        {roomData.hashtags && roomData.hashtags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mb-3">
            {roomData.hashtags.slice(0, 5).map((tag, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 방장 정보 및 1:1 채팅 버튼 */}
      {ownerData && (
        <div className="px-4 mb-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  👑
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">
                    {ownerData.displayName || ownerData.email?.split('@')[0] || '방장'}
                  </div>
                  <div className="text-yellow-600 text-xs font-medium">방장</div>
                </div>
              </div>
              {!isOwner && (
                <button
                  onClick={() => navigate(`/dm/${roomData.createdBy}`)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-1"
                >
                  💬 1:1 채팅
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 채팅방 입장 버튼 */}
      <div className="px-4 mb-4">
        <button
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-3"
          onClick={() => navigate(`/chat/${roomId}`)}
        >
          🚪 채팅방 입장하기
        </button>
      </div>

      {/* 방 통계 */}
      <div className="px-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-3 text-center">방 통계</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{participants.length}</div>
              <div className="text-xs text-gray-500">참여자</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{videos.length}</div>
              <div className="text-xs text-gray-500">영상</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{roomData.viewCount || 0}</div>
              <div className="text-xs text-gray-500">조회수</div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 메뉴 */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">빠른 메뉴</h3>
          </div>
          
          <button
            className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
            onClick={() => navigate(`/chat/${roomId}/videos`)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎬</span>
              <div>
                <div className="font-medium text-gray-800 text-left">시청 영상 목록</div>
                <div className="text-sm text-gray-500">{videos.length}개 영상</div>
              </div>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          <button
            className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
            onClick={() => navigate(`/chat/${roomId}/menu`)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👥</span>
              <div>
                <div className="font-medium text-gray-800 text-left">참여자 목록</div>
                <div className="text-sm text-gray-500">{participants.length}명 참여중</div>
              </div>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          {isOwner && (
            <button
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => navigate(`/chat/${roomId}/manage`)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <div>
                  <div className="font-medium text-gray-800 text-left">방 관리</div>
                  <div className="text-sm text-gray-500">방장 전용</div>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatRoomProfile;

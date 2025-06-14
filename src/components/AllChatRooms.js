import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import RoomCard from './ChatList/components/RoomCard';

function AllChatRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState("최신순");
  const [loading, setLoading] = useState(true);

  // 채팅방 데이터 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const roomPromises = snapshot.docs.map(async (docSnap) => {
        const room = { id: docSnap.id, ...docSnap.data() };
        try {
          // 메시지 정보 및 참여자 등 추가 데이터 수집
          const msgQ = query(collection(db, "chatRooms", room.id, "messages"), orderBy("createdAt", "desc"));
          const msgSnap = await getDocs(msgQ);
          const participants = new Set();
          let lastMsg = null;
          msgSnap.forEach((msgDoc) => {
            const msg = msgDoc.data();
            if (msg.uid) participants.add(msg.uid);
            if (!lastMsg) lastMsg = msg;
          });
          const partSnap = await getDocs(collection(db, "chatRooms", room.id, "participants"));
          partSnap.forEach((p) => participants.add(p.id));
          room.participantCount = participants.size;
          room.lastMsgText = lastMsg?.text || (lastMsg?.imageUrl ? "[이미지]" : "") || "";
          room.sortTimestamp = lastMsg?.createdAt?.seconds || room.createdAt?.seconds || 0;
          room.title = room.name || room.title || "";
          room.desc = room.desc || "새로운 채팅방입니다. 함께 이야기해요!";
          room.hashtags = room.hashtags || [];
          return room;
        } catch (e) {
          console.error(e);
          return room;
        }
      });
      const processed = await Promise.all(roomPromises);
      setRooms(processed);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 필터 & 검색
  const filteredRooms = rooms
    .filter((room) => {
      if (!searchInput.trim()) return true;
      const s = searchInput.toLowerCase();
      return (
        room.title.toLowerCase().includes(s) ||
        room.desc.toLowerCase().includes(s) ||
        (room.hashtags && room.hashtags.some((tag) => tag.toLowerCase().includes(s.replace('#', ''))))
      );
    })
    .sort((a, b) => {
      if (filter === "좋아요순") return (b.likes || 0) - (a.likes || 0);
      if (filter === "참여인원순") return (b.participantCount || 0) - (a.participantCount || 0);
      // 최신순 default
      return b.sortTimestamp - a.sortTimestamp;
    });

  return (
    <div className="max-w-md mx-auto bg-[#f7faff] rounded-2xl p-3 min-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <h2 className="text-2xl font-bold">전체 채팅방</h2>
        <div className="w-6" />
      </div>

      {/* 검색 */}
      <div className="mb-3 relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="채팅방 이름, 키워드, #해시태그 검색"
          className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchInput && (
          <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      {/* 정렬 */}
      <div className="mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="최신순">최신순</option>
          <option value="좋아요순">좋아요순</option>
          <option value="참여인원순">참여인원순</option>
        </select>
      </div>

      <div className="text-sm text-gray-500 mb-2">방 개수: {filteredRooms.length}</div>

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div><div className="text-gray-500">채팅방을 불러오는 중...</div></div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">검색 결과가 없습니다</div>
        ) : (
          filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEnter={(id) => navigate(`/chat/${id}`)}
              variant="all"
            />
          ))
        )}
      </div>
    </div>
  );
}

export default AllChatRooms; 
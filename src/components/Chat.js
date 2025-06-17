import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

function Chat() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 채팅방 리스트 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList = [];
      snapshot.forEach((doc) => {
        roomList.push({ id: doc.id, ...doc.data() });
      });
      setRooms(roomList);
    });
    return () => unsubscribe();
  }, []);

  // 채팅방 생성
  const handleCreateRoom = async () => {
    if (!newRoom.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "chatRooms"), {
      name: newRoom,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || "anonymous",
    });
    setNewRoom("");
    setLoading(false);
  };

  // 채팅방 입장
  const handleEnterRoom = (roomId) => {
    navigate(`/chat/${roomId}/profile`);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-xl shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">채팅방 리스트</h2>
      {/* 채팅방 생성 */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="새 채팅방 이름"
          className="flex-1 border rounded px-3 py-2"
          maxLength={30}
        />
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          {loading ? "생성 중..." : "방 만들기"}
        </button>
      </div>
      {/* 채팅방 리스트 */}
      <ul className="divide-y">
        {rooms.length === 0 ? (
          <li className="text-gray-400 text-center py-8">아직 채팅방이 없습니다.</li>
        ) : (
          rooms.map((room) => (
            <li
              key={room.id}
              className="flex items-center justify-between py-4 cursor-pointer hover:bg-blue-50 rounded transition"
              onClick={() => handleEnterRoom(room.id)}
            >
              <div>
                <div className="font-semibold text-lg">{room.name}</div>
                <div className="text-xs text-gray-500">
                  생성일: {room.createdAt?.seconds
                    ? new Date(room.createdAt.seconds * 1000).toLocaleString()
                    : "-"}
                </div>
              </div>
              <span className="text-blue-400 font-bold">&gt;</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default Chat;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getCountFromServer,
} from "firebase/firestore";

function ChatList() {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [participantsMap, setParticipantsMap] = useState({});
  const navigate = useNavigate();

  // 로그인 체크
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        alert("로그인 후 이용 가능합니다.");
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 채팅방 리스트 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snapshot) => {
      const roomArr = [];
      const participantsObj = {};
      for (const docSnap of snapshot.docs) {
        const room = { id: docSnap.id, ...docSnap.data() };
        roomArr.push(room);

        // 각 방의 참여자 수 가져오기
        const participantsCol = collection(db, "chatRooms", docSnap.id, "participants");
        const countSnap = await getCountFromServer(participantsCol);
        participantsObj[docSnap.id] = countSnap.data().count;
      }
      setRooms(roomArr);
      setParticipantsMap(participantsObj);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 채팅방 생성
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError("방 이름을 입력하세요!");
      return;
    }
    setError("");
    try {
      const docRef = await addDoc(collection(db, "chatRooms"), {
        name: roomName,
        createdAt: serverTimestamp(),
        creator: auth.currentUser.email,
      });
      setRoomName("");
      navigate(`/chat/${docRef.id}`);
    } catch (err) {
      setError("채팅방 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">채팅방 리스트</h2>
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          className="flex-1 p-2 border rounded"
          type="text"
          placeholder="새 채팅방 이름"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 rounded" type="submit">
          생성
        </button>
      </form>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {loading ? (
        <div className="text-gray-500">로딩 중...</div>
      ) : (
        <ul>
          {rooms.length === 0 && (
            <li className="text-gray-400">채팅방이 없습니다. 새로 만들어보세요!</li>
          )}
          {rooms.map((room) => (
            <li
              key={room.id}
              className="flex items-center justify-between border-b py-2"
            >
              <div>
                <div className="font-semibold">{room.name}</div>
                <div className="text-xs text-gray-500">
                  생성자: {room.creator} | 참여자: {participantsMap[room.id] ?? 0}명
                </div>
              </div>
              <button
                className="bg-blue-400 text-white px-3 py-1 rounded"
                onClick={() => navigate(`/chat/${room.id}`)}
              >
                입장
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ChatList;
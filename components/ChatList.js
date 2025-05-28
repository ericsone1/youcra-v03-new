import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function ChatList() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [roomImage, setRoomImage] = useState(null);
  const [roomImagePreview, setRoomImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [activeTab, setActiveTab] = useState("참여중");
  const navigate = useNavigate();
  const fileInputRef = useRef();

  // 채팅방 리스트 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const roomList = [];
      for (const docSnap of snapshot.docs) {
        const room = { id: docSnap.id, ...docSnap.data() };
        // 참여자 수, 최근 메시지, 활성화 상태 계산
        const msgQ = query(
          collection(db, "chatRooms", room.id, "messages"),
          orderBy("createdAt", "desc")
        );
        const msgSnap = await getDocs(msgQ);
        const participants = new Set();
        let lastMsg = null;
        msgSnap.forEach((msgDoc, idx) => {
          const msg = msgDoc.data();
          if (msg.uid) participants.add(msg.uid);
          if (idx === 0) lastMsg = msg;
        });
        room.participantUids = Array.from(participants);
        room.participantCount = participants.size;
        room.lastMsg = lastMsg;
        room.lastMsgTime = lastMsg?.createdAt?.seconds
          ? new Date(lastMsg.createdAt.seconds * 1000)
          : null;
        room.lastMsgText =
          lastMsg?.text ||
          (lastMsg?.imageUrl ? "[이미지]" : "") ||
          "";
        roomList.push(room);
      }
      setRooms(roomList);
    });
    return () => unsubscribe();
  }, []);

  // 채팅방 생성
  const handleCreateRoom = async () => {
    if (!newRoom.trim()) return;
    setLoading(true);
    let imageUrl = "";
    if (roomImage) {
      const storageRef = ref(storage, `roomImages/${Date.now()}_${roomImage.name}`);
      await uploadBytes(storageRef, roomImage);
      imageUrl = await getDownloadURL(storageRef);
    }
    await addDoc(collection(db, "chatRooms"), {
      name: newRoom,
      profileImage: imageUrl,
      maxParticipants,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || "anonymous",
    });
    setNewRoom("");
    setRoomImage(null);
    setRoomImagePreview("");
    setMaxParticipants(10);
    setLoading(false);
  };

  // 채팅방 입장
  const handleEnterRoom = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  // 이미지 미리보기
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRoomImage(file);
    setRoomImagePreview(URL.createObjectURL(file));
  };

  // 탭 필터링
  const filteredRooms = rooms.filter((room) => {
    if (activeTab === "참여중") {
      return (
        room.participantUids?.includes(auth.currentUser?.uid) ||
        room.createdBy === auth.currentUser?.uid
      );
    }
    if (activeTab === "내가 만든 방") return room.createdBy === auth.currentUser?.uid;
    return true;
  });

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-xl shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">채팅방 리스트</h2>
      {/* 상단 탭바 */}
      <div className="flex border-b mb-4">
        {["참여중", "내가 만든 방"].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 font-bold ${activeTab === tab ? "border-b-2 border-yellow-400 text-yellow-500" : "text-gray-500"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* 내가 만든 방에서만 방 만들기 폼 노출 */}
      {activeTab === "내가 만든 방" && (
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              placeholder="새 채팅방 이름"
              className="flex-1 border rounded px-3 py-2"
              maxLength={30}
            />
            <input
              type="number"
              min={1}
              max={1000}
              value={maxParticipants}
              onChange={(e) => {
                let v = Number(e.target.value);
                if (v < 1) v = 1;
                if (v > 1000) v = 1000;
                setMaxParticipants(v);
              }}
              className="w-24 border rounded px-2 py-2"
              placeholder="최대인원"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
            >
              {roomImagePreview ? "이미지 변경" : "이미지 선택"}
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>
          {roomImagePreview && (
            <img
              src={roomImagePreview}
              alt="방 이미지 미리보기"
              className="w-16 h-16 object-cover rounded-full mx-auto border mb-2"
            />
          )}
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            {loading ? "생성 중..." : "방 만들기"}
          </button>
        </div>
      )}
      {/* 채팅방 리스트 */}
      <div className="flex flex-col gap-3">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center bg-white rounded-xl shadow p-3 cursor-pointer hover:bg-yellow-50"
            onClick={() => handleEnterRoom(room.id)}
          >
            <img src={room.profileImage || "/default-profile.png"} className="w-14 h-14 rounded-lg mr-3" alt="썸네일" />
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{room.name}</div>
              <div className="text-xs text-gray-400 truncate">{room.lastMsgText || "메시지가 없습니다."}</div>
              <div className="text-xs text-gray-500 mt-1">{room.participantCount}명 참여중</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatList;
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";

function Chat() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");

  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsubscribe();
  }, []);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (newRoom.trim() === "") return;
    await addDoc(collection(db, "chatRooms"), {
      name: newRoom,
      createdAt: new Date(),
    });
    setNewRoom("");
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">💬 채팅방 리스트</h2>
      <form onSubmit={handleAddRoom} className="flex gap-2 mb-4">
        <input
          className="flex-1 p-2 border rounded"
          type="text"
          placeholder="새 채팅방 이름"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 rounded" type="submit">
          추가
        </button>
      </form>
      <ul>
        {rooms.map((room) => (
          <li key={room.id} className="p-2 border-b">
            <Link to={`/chat/${room.id}`} className="text-blue-600 hover:underline">
              {room.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-gray-500 text-sm">
        ※ Firestore와 연동된 실시간 채팅방 리스트입니다.<br />
        (채팅방을 클릭하면 메시지 화면으로 이동합니다.)
      </div>
    </div>
  );
}

export default Chat;
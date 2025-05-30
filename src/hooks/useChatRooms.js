import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  subscribeToChatRooms,
  createChatRoom,
} from '../services/chatService';

export function useChatRooms() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);

  // 채팅방 목록 구독
  useEffect(() => {
    const unsubscribe = subscribeToChatRooms((snapshot) => {
      try {
        const roomList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isMine: doc.data().createdBy === auth.currentUser?.uid,
        }));
        setRooms(roomList);
        setLoading(false);
      } catch (err) {
        setError("채팅방 목록을 불러오는데 실패했습니다.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 채팅방 생성
  const handleCreateRoom = async (roomData) => {
    if (!auth.currentUser) {
      throw new Error("로그인이 필요합니다.");
    }

    try {
      const docRef = await createChatRoom({
        ...roomData,
        createdBy: auth.currentUser.uid,
      });
      return docRef.id;
    } catch (err) {
      setError("채팅방 생성에 실패했습니다.");
      throw err;
    }
  };

  // 채팅방 필터링
  const filterRooms = (searchTerm = "", filterType = "all") => {
    let filtered = [...rooms];

    // 검색어로 필터링
    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 타입으로 필터링
    switch (filterType) {
      case "mine":
        filtered = filtered.filter(room => room.isMine);
        break;
      case "joined":
        filtered = filtered.filter(room => room.participants?.includes(auth.currentUser?.uid));
        break;
      default:
        break;
    }

    return filtered;
  };

  return {
    loading,
    error,
    rooms,
    createRoom: handleCreateRoom,
    filterRooms,
  };
} 
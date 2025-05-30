import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  subscribeToChatRoom,
  subscribeToMessages,
  subscribeToParticipants,
  sendMessage,
  addParticipant,
  removeParticipant,
} from '../services/chatService';

export function useChat(roomId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [myJoinedAt, setMyJoinedAt] = useState(null);

  // 채팅방 정보 구독
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToChatRoom(roomId, (doc) => {
      if (doc.exists()) {
        setRoomInfo(doc.data());
      } else {
        setError("존재하지 않는 채팅방입니다.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 메시지 구독
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToMessages(roomId, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, [roomId]);

  // 참여자 구독
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToParticipants(roomId, (snapshot) => {
      const participantList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setParticipants(participantList);
      
      // 내 참여 시간 찾기
      if (auth.currentUser) {
        const myData = participantList.find(p => p.id === auth.currentUser.uid);
        setMyJoinedAt(myData?.joinedAt || null);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // 메시지 전송
  const handleSendMessage = async (text) => {
    if (!auth.currentUser) throw new Error("로그인이 필요합니다.");
    
    await sendMessage(roomId, {
      text,
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
    });
  };

  // 채팅방 참여
  const handleJoinRoom = async () => {
    if (!auth.currentUser) throw new Error("로그인이 필요합니다.");
    
    await addParticipant(roomId, auth.currentUser.uid, {
      email: auth.currentUser.email,
    });
  };

  // 채팅방 나가기
  const handleLeaveRoom = async () => {
    if (!auth.currentUser) return;
    await removeParticipant(roomId, auth.currentUser.uid);
  };

  return {
    loading,
    error,
    roomInfo,
    messages,
    participants,
    myJoinedAt,
    sendMessage: handleSendMessage,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
  };
} 
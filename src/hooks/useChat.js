import { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from '../firebase';
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import useNotification from './useNotification';

export function useChat(roomId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [myJoinedAt, setMyJoinedAt] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const notify = useNotification();
  const prevLastMsgRef = useRef(null);

  // Auth 상태 준비 확인
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthReady(true);
      if (!user) {
        setError('로그인이 필요합니다.');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 채팅방 정보 로드
  useEffect(() => {
    if (!roomId || !authReady) return;

    const roomRef = doc(db, 'chatRooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, 
      (doc) => {
        if (doc.exists()) {
          setRoomInfo(doc.data());
          setParticipants(doc.data().participants || []);
          setError(null);
        } else {
          setError('존재하지 않는 채팅방입니다.');
        }
        setLoading(false);
      },
      (error) => {
        console.error('채팅방 정보 로드 오류:', error);
        setError('채팅방 정보를 불러올 수 없습니다.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId, authReady]);

  // 메시지 로드
  useEffect(() => {
    if (!roomId || !authReady) return;

    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const newMessages = [];
        snapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() });
        });
        setMessages(newMessages.reverse());
        
        // 알림: 새 메시지 감지 (로그인된 사용자만)
        if (auth.currentUser && newMessages.length > 0) {
          const newest = newMessages[newMessages.length - 1];
          if (newest && prevLastMsgRef.current) {
            const isNewMessage = newest.id !== prevLastMsgRef.current.id;
            const isFromOtherUser = newest.uid !== auth.currentUser.uid;
            const isAfterJoined = myJoinedAt && newest.createdAt && newest.createdAt.seconds > myJoinedAt.seconds;

            if (isNewMessage && isFromOtherUser && isAfterJoined) {
              notify('새 메시지', {
                body: newest.text?.slice(0, 50) || '새 메시지가 도착했습니다',
                icon: newest.photoURL || '/logo192.png',
                tag: roomId, // 같은 채팅방의 알림은 하나로 묶음
              });
            }
          }
        }
        if (newMessages.length > 0) {
          prevLastMsgRef.current = newMessages[newMessages.length - 1];
        }
        setError(null);
      },
      (error) => {
        console.error('메시지 로드 오류:', error);
        setError('메시지를 불러올 수 없습니다.');
      }
    );

    return () => unsubscribe();
  }, [roomId, authReady]);

  // 메시지 전송
  const sendMessage = useCallback(async (text) => {
    if (!roomId || !auth.currentUser || !text.trim()) return;

    try {
      const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
      await addDoc(messagesRef, {
        text: text.trim(),
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        photoURL: auth.currentUser.photoURL
      });
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      setError('메시지를 전송할 수 없습니다.');
    }
  }, [roomId]);

  // 채팅방 입장
  const joinRoom = useCallback(async () => {
    if (!roomId || !auth.currentUser) return;

    try {
      const roomRef = doc(db, 'chatRooms', roomId);
      
      await updateDoc(roomRef, {
        participants: arrayUnion(auth.currentUser.uid)
      });

      setMyJoinedAt({ seconds: Date.now() / 1000 });
      setError(null);
    } catch (error) {
      console.error('채팅방 입장 오류:', error);
      setError('채팅방에 입장할 수 없습니다.');
    }
  }, [roomId]);

  // 채팅방 퇴장
  const leaveRoom = useCallback(async () => {
    if (!roomId || !auth.currentUser) return;

    try {
      const roomRef = doc(db, 'chatRooms', roomId);
      await updateDoc(roomRef, {
        participants: arrayRemove(auth.currentUser.uid)
      });
    } catch (error) {
      console.error('채팅방 퇴장 오류:', error);
    }
  }, [roomId]);

  return {
    loading,
    error,
    roomInfo,
    messages,
    participants,
    myJoinedAt,
    sendMessage,
    joinRoom,
    leaveRoom
  };
} 
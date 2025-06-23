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
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import useNotification from './useNotification';

export function useChat(roomId) {
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
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

  // 실제 참여자 목록 로드 (서브컬렉션 기반)
  useEffect(() => {
    if (!roomId || !authReady) return;

    const participantsRef = collection(db, 'chatRooms', roomId, 'participants');
    
    const unsubscribe = onSnapshot(participantsRef,
      (snapshot) => {
        const participantsList = [];
        snapshot.forEach((doc) => {
          participantsList.push({ id: doc.id, ...doc.data() });
        });
        setParticipants(participantsList);
      },
      (error) => {
        console.error('참여자 목록 로드 오류:', error);
      }
    );

    return () => unsubscribe();
  }, [roomId, authReady]);

  // 메시지 로드
  useEffect(() => {
    if (!roomId || !authReady) return;

    // 새로 만든 채팅방인지 확인 - sessionStorage 사용
    const newChatRoomId = sessionStorage.getItem('newChatRoom');
    const isNewRoom = newChatRoomId === roomId;

    // 디버깅 로그
    

    if (isNewRoom) {
      // 새로 만든 방: 메시지 로딩 스킵하고 즉시 완료
      
      setMessages([]);
      setMessagesLoading(false);
      
      // 플래그 제거 (한 번만 적용)
      sessionStorage.removeItem('newChatRoom');
      
      return;
    }

    // 기존 방: 정상적으로 메시지 로딩
    setMessagesLoading(true);
    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const newMessages = [];
        snapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() });
        });
        setMessages(newMessages.reverse());
        setMessagesLoading(false);
        
        // 디버깅: 메시지 로딩 완료 로그
        if (process.env.NODE_ENV === 'development') {

        }
        
        // 메시지가 0개인 경우 즉시 로딩 완료 처리
        if (newMessages.length === 0) {
  
        }
        
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
        setMessagesLoading(false);
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
      // 이미 참여자인지 확인 (해당 계정이 이 채팅방에 참여한 적이 있는지)
      const participantRef = doc(db, 'chatRooms', roomId, 'participants', auth.currentUser.uid);
      const participantDoc = await getDoc(participantRef);
      const isAlreadyParticipant = participantDoc.exists();
      
      // 새로운 계정(UID)이면 무조건 입장 메시지 표시
      const shouldShowJoinMessage = !isAlreadyParticipant;
      
      if (shouldShowJoinMessage) {
        console.log('🎉 새로운 계정으로 첫 입장 - 입장 메시지 생성');
      } else {
        console.log('👤 이미 참여한 적이 있는 계정 - 입장 메시지 생성 안함');
      }

      // participants 서브컬렉션에 사용자 추가
      await setDoc(participantRef, {
        joinedAt: serverTimestamp(),
        lastReadAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
      }, { merge: true });

      // 기존 participants 배열도 유지 (호환성)
      const roomRef = doc(db, 'chatRooms', roomId);
      await updateDoc(roomRef, {
        participants: arrayUnion(auth.currentUser.uid)
      });

      // 새로운 계정의 첫 입장인 경우 입장 알림 메시지 추가
      if (shouldShowJoinMessage) {
        console.log('🎉 새로운 계정의 첫 입장 - 입장 메시지 생성 중...');
        
        // 사용자 프로필에서 닉네임 가져오기
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userProfile = userDoc.exists() ? userDoc.data() : null;
        const displayName = userProfile?.nickname || userProfile?.nick || userProfile?.displayName || auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || '익명';

        console.log('📝 입장 메시지 생성:', `${displayName}님이 입장했습니다.`);

        // 입장 알림 메시지 추가
        const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
        await addDoc(messagesRef, {
          text: `${displayName}님이 입장했습니다.`,
          createdAt: serverTimestamp(),
          type: 'system',
          isSystemMessage: true,
          uid: 'system'
        });
        
        console.log('✅ 입장 메시지 생성 완료');
      }

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
      // 사용자 프로필에서 닉네임 가져오기 (퇴장 메시지용)
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userProfile = userDoc.exists() ? userDoc.data() : null;
      const displayName = userProfile?.nickname || userProfile?.nick || userProfile?.displayName || auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || '익명';

      // participants 서브컬렉션에서 사용자 제거
      const participantRef = doc(db, 'chatRooms', roomId, 'participants', auth.currentUser.uid);
      await deleteDoc(participantRef);

      // 기존 participants 배열에서도 제거 (호환성)
      const roomRef = doc(db, 'chatRooms', roomId);
      await updateDoc(roomRef, {
        participants: arrayRemove(auth.currentUser.uid)
      });

      // 퇴장 알림 메시지 추가
      const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
      await addDoc(messagesRef, {
        text: `${displayName}님이 퇴장했습니다.`,
        createdAt: serverTimestamp(),
        type: 'system',
        isSystemMessage: true,
        uid: 'system'
      });
    } catch (error) {
      console.error('채팅방 퇴장 오류:', error);
    }
  }, [roomId]);

  return {
    loading,
    messagesLoading,
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
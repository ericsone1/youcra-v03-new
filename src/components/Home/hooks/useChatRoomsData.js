import { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';

export const useChatRoomsData = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('🔄 useChatRoomsData: 인증 상태 변화', { isAuthenticated, currentUser: !!currentUser });

    // 로그인하지 않은 상태에서는 빈 배열 표시
    if (!isAuthenticated || !currentUser) {
      console.log('📋 비로그인 상태: 빈 채팅방 목록 표시');
      setChatRooms([]);
      setLoadingRooms(false);
      return;
    }

    // 로그인 상태에서만 실제 Firestore 데이터 가져오기
    console.log('🔥 로그인 상태: Firestore 채팅방 데이터 구독 시작');
    
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('📡 Firestore 스냅샷 수신:', snapshot.docs.length + '개 채팅방');
      setLoadingRooms(true);
      
      try {
        const roomPromises = snapshot.docs.map(async (docSnap) => {
          const room = { id: docSnap.id, ...docSnap.data() };

          try {
            // 해시태그가 없는 경우 기본값 설정
            if (!room.hashtags || room.hashtags.length === 0) {
              room.hashtags = ["일반", "소통"];
            }

            // 메시지 수와 참여자 수로 인기도 계산
            const msgQ = query(
              collection(db, "chatRooms", room.id, "messages"),
              orderBy("createdAt", "desc"),
              limit(100) // 성능을 위해 최근 100개만
            );
            const msgSnap = await getDocs(msgQ);
            const participants = new Set();
            let lastMsg = null;
            let messageCount = 0;

            msgSnap.forEach((msgDoc) => {
              const msg = msgDoc.data();
              if (msg.uid) participants.add(msg.uid);
              if (!lastMsg) lastMsg = msg;
              messageCount++;
            });

            // 좋아요 수 가져오기
            const likesQ = query(collection(db, "chatRooms", room.id, "likes"));
            const likesSnap = await getDocs(likesQ);
            const likesCount = likesSnap.size;

            // 사용자의 좋아요 상태 확인
            const userLikeDoc = currentUser ? 
              await getDoc(doc(db, "chatRooms", room.id, "likes", currentUser.uid)) : 
              null;
            const userLiked = userLikeDoc?.exists() || false;

            // 인기도 스코어 계산 (참여자 수 * 2 + 메시지 수 + 좋아요 수 * 3)
            const participantCount = participants.size;
            const popularityScore = participantCount * 2 + messageCount + likesCount * 3;

            // 방 정보 업데이트
            room.participantCount = participantCount;
            room.messageCount = messageCount;
            room.likesCount = likesCount;
            room.userLiked = userLiked;
            room.popularityScore = popularityScore;
            room.lastMsg = lastMsg;
            room.lastMsgTime = lastMsg?.createdAt?.seconds
              ? new Date(lastMsg.createdAt.seconds * 1000)
              : null;
            room.isActive = lastMsg?.createdAt?.seconds 
              ? (Date.now() - lastMsg.createdAt.seconds * 1000) < 3600000 // 1시간 이내
              : false;
            room.isDummy = false;

            return room;
          } catch (error) {
            console.error(`Error processing room ${room.id}:`, error);
            room.participantCount = 0;
            room.messageCount = 0;
            room.likesCount = 0;
            room.userLiked = false;
            room.popularityScore = 0;
            room.isActive = false;
            room.isDummy = false;
            return room;
          }
        });

        const processedRooms = await Promise.all(roomPromises);
        
        // 인기도순으로 정렬
        const sortedRooms = processedRooms
          .map(room => {
            // 인기도가 0인 방에게 최소 점수 부여 (1~5점 랜덤)
            if (room.popularityScore === 0) {
              room.popularityScore = Math.floor(Math.random() * 5) + 1;
            }
            return room;
          })
          .sort((a, b) => b.popularityScore - a.popularityScore);

        setChatRooms(sortedRooms);
        setLoadingRooms(false);
        console.log('✅ Firestore 채팅방 데이터 로드 완료:', sortedRooms.length + '개');
        
      } catch (error) {
        console.error('❌ Firestore 채팅방 데이터 로드 실패:', error);
        setChatRooms([]);
        setLoadingRooms(false);
      }
    }, (error) => {
      console.error('❌ Firestore 구독 오류:', error);
      setChatRooms([]);
      setLoadingRooms(false);
    });

    return () => {
      console.log('🔄 useChatRoomsData: Firestore 구독 해제');
      unsubscribe();
    };
  }, [currentUser, isAuthenticated]);

  return { 
    chatRooms, 
    loadingRooms,
    refreshRooms: () => {
      setLoadingRooms(true);
      // useEffect에서 자동으로 다시 로드됨
    }
  };
}; 
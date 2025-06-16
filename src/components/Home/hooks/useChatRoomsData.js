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

  // 더미 채팅방 데이터
  const getDummyRooms = () => {
    const dummyRoomNames = [
      "썰툰 채널 협업방", "개그 맞구독방", "AI 맞구독방", "50대 썰채널 맞구독방", "뷰티 유튜버 협업방",
      "쿠킹 채널 맞구독방", "게임 유튜버 협업방", "브이로그 맞구독방", "IT리뷰 협업방", "펫튜버 맞구독방"
    ];
    
    const dummyHashtagSets = [
      ["썰툰", "애니메이션", "협업"],
      ["개그", "코미디", "맞구독"],
      ["AI", "인공지능", "맞구독"],
      ["50대", "썰", "맞구독"],
      ["뷰티", "메이크업", "협업"],
      ["쿠킹", "요리", "맞구독"],
      ["게임", "스트리머", "협업"],
      ["브이로그", "일상", "맞구독"],
      ["IT", "리뷰", "협업"],
      ["펫", "동물", "맞구독"]
    ];

    return dummyRoomNames.map((name, index) => ({
      id: `dummy_${index}`,
      name: name,
      hashtags: dummyHashtagSets[index] || ["일반", "소통"],
      participantCount: Math.floor(Math.random() * 50) + 5,
      messageCount: Math.floor(Math.random() * 200) + 10,
      likesCount: Math.floor(Math.random() * 30) + 1,
      popularityScore: Math.floor(Math.random() * 100) + 50, // 더 높은 점수로 인기 표시
      isActive: Math.random() > 0.2, // 80% 확률로 활성 상태
      userLiked: false,
      isDummy: true
    }));
  };

  useEffect(() => {
    console.log('🔄 useChatRoomsData: 인증 상태 변화', { isAuthenticated, currentUser: !!currentUser });

    // 로그아웃 상태에서는 더미 데이터만 표시
    if (!isAuthenticated || !currentUser) {
      console.log('📋 비로그인 상태: 더미 채팅방 데이터 표시');
      setLoadingRooms(true);
      
      // 약간의 로딩 시간 시뮬레이션
      setTimeout(() => {
        const dummyRooms = getDummyRooms();
        setChatRooms(dummyRooms);
        setLoadingRooms(false);
        console.log('✅ 더미 채팅방 데이터 로드 완료:', dummyRooms.length + '개');
      }, 1000);
      
      return; // Firestore 구독하지 않음
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
          // 더미 해시태그 추가 (기존 해시태그가 없는 경우)
          if (!room.hashtags || room.hashtags.length === 0) {
            const dummyHashtags = [
              ["게임", "롤", "팀원모집"],
              ["음악", "힙합", "수다"],
              ["먹방", "맛집", "일상"],
              ["영화", "드라마", "토론"],
              ["스포츠", "축구", "응원"],
              ["공부", "취업", "정보공유"],
              ["여행", "맛집", "추천"],
              ["애니", "웹툰", "덕후"],
              ["연애", "고민", "상담"],
              ["힐링", "일상", "소통"]
            ];
            const randomIndex = Math.floor(Math.random() * dummyHashtags.length);
            room.hashtags = dummyHashtags[randomIndex];
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

      // 10개 미만일 경우 더미 채팅방 추가
        if (sortedRooms.length < 10) {
          const dummyRooms = getDummyRooms().slice(0, 10 - sortedRooms.length);
          sortedRooms.push(...dummyRooms);
      }

      const finalSortedRooms = sortedRooms.slice(0, 10); // 상위 10개까지

      setChatRooms(finalSortedRooms);
        setLoadingRooms(false);
        console.log('✅ Firestore 채팅방 데이터 로드 완료:', finalSortedRooms.length + '개');
        
      } catch (error) {
        console.error('❌ Firestore 채팅방 데이터 로드 실패:', error);
        // 오류 발생시 더미 데이터로 폴백
        const dummyRooms = getDummyRooms();
        setChatRooms(dummyRooms);
        setLoadingRooms(false);
      }
    }, (error) => {
      console.error('❌ Firestore 구독 오류:', error);
      // 오류 발생시 더미 데이터로 폴백
      const dummyRooms = getDummyRooms();
      setChatRooms(dummyRooms);
      setLoadingRooms(false);
    });

    return () => {
      console.log('🔄 Firestore 구독 해제');
      unsubscribe();
    };
  }, [isAuthenticated, currentUser]);

  return { chatRooms, loadingRooms };
}; 
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../firebase';
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

export function useChatRoomsHome() {
  const [chatRooms, setChatRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleRoomsCount, setVisibleRoomsCount] = useState(3);
  const navigate = useNavigate();

  // 인기 채팅방 데이터 가져오기
  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoadingRooms(true);
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
          const userLikeDoc = auth.currentUser ? 
            await getDoc(doc(db, "chatRooms", room.id, "likes", auth.currentUser.uid)) : 
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

          return room;
        } catch (error) {
          console.error(`Error processing room ${room.id}:`, error);
          room.participantCount = 0;
          room.messageCount = 0;
          room.likesCount = 0;
          room.userLiked = false;
          room.popularityScore = 0;
          room.isActive = false;
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
      const dummyRoomNames = [
        "코딩 스터디방", "맛집 탐방단", "영화 리뷰방", "운동 메이트", "독서 클럽",
        "여행 계획방", "펜팔 친구들", "취미 공유방", "언어 교환방", "투자 정보방"
      ];
      
      const dummyHashtagSets = [
        ["코딩", "개발", "프로그래밍"],
        ["맛집", "리뷰", "추천"],
        ["영화", "리뷰", "토론"],
        ["운동", "헬스", "다이어트"],
        ["독서", "책", "추천"],
        ["여행", "계획", "정보"],
        ["펜팔", "외국어", "친구"],
        ["취미", "공유", "소통"],
        ["언어", "교환", "학습"],
        ["투자", "주식", "정보"]
      ];

      while (sortedRooms.length < 10) {
        const index = sortedRooms.length;
        const dummyRoom = {
          id: `dummy_${index}`,
          name: dummyRoomNames[index] || `채팅방 ${index + 1}`,
          hashtags: dummyHashtagSets[index] || ["일반", "소통"],
          participantCount: Math.floor(Math.random() * 50) + 5,
          messageCount: Math.floor(Math.random() * 200) + 10,
          likesCount: Math.floor(Math.random() * 30) + 1,
          popularityScore: Math.floor(Math.random() * 20) + 1,
          isActive: Math.random() > 0.3,
          userLiked: false
        };
        sortedRooms.push(dummyRoom);
      }

      setChatRooms(sortedRooms);
      setLoadingRooms(false);
    });

    return () => unsubscribe();
  }, []);

  // 검색어로 필터링된 채팅방
  const filteredChatRooms = chatRooms.filter(room => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.name?.toLowerCase().includes(query) ||
      room.hashtags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const handleRoomClick = (roomId) => {
    if (roomId.startsWith('dummy_')) {
      console.log('더미 방 클릭');
      return;
    }
    navigate(`/chat/${roomId}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/chat?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return {
    chatRooms,
    loadingRooms,
    searchQuery,
    setSearchQuery,
    filteredChatRooms,
    visibleRoomsCount,
    setVisibleRoomsCount,
    handleRoomClick,
    handleSearch,
    handleSearchKeyDown
  };
} 
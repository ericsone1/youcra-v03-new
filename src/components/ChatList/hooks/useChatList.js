import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { db, auth } from "../../../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";

export function useChatList() {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const navigate = useNavigate();

  // 최근 활동 기준 정렬 함수
  const getLastActiveAt = (room) => {
    return room.sortTimestamp || 0;
  };

  // 채팅방 데이터 실시간 구독
  useEffect(() => {
    // 인증 로딩 중이면 대기
    if (authLoading) {
      return;
    }

    // 로그아웃 상태면 빈 배열 설정
    if (!isAuthenticated) {
      setRooms([]);
      setRoomsLoading(false);
      return;
    }

    // 로그인 상태에서만 Firestore 쿼리 실행
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      
      const roomPromises = snapshot.docs.map(async (docSnap) => {
        const room = { id: docSnap.id, ...docSnap.data() };

        try {
          // 1. 메시지 정보 가져오기
          const msgQ = query(
            collection(db, "chatRooms", room.id, "messages"),
            orderBy("createdAt", "desc")
          );
          const msgSnap = await getDocs(msgQ);
          const messageParticipants = new Set();
          let lastMsg = null;
          let myLastMsg = null;

          msgSnap.forEach((msgDoc) => {
            const msg = msgDoc.data();
            if (msg.uid) messageParticipants.add(msg.uid);
            if (!lastMsg) lastMsg = msg;
            if (msg.uid === auth.currentUser?.uid && !myLastMsg) {
              myLastMsg = msg;
            }
          });

          // 2. 참여자 정보 가져오기
          const participantsRef = collection(db, "chatRooms", room.id, "participants");
          const participantsSnap = await getDocs(participantsRef);
          let joinedAt = null;
          let lastReadAt = null;
          let isInParticipants = false;
          
          participantsSnap.forEach((doc) => {
            if (doc.id === auth.currentUser?.uid) {
              joinedAt = doc.data().joinedAt;
              lastReadAt = doc.data().lastReadAt;
              isInParticipants = true;
            }
          });
          
          // 3. 안읽음 메시지 개수 계산
          let unreadCount = 0;
          if (lastReadAt) {
            msgSnap.forEach((msgDoc) => {
              const msg = msgDoc.data();
              if (msg.createdAt && msg.uid !== auth.currentUser?.uid) {
                const msgTime = msg.createdAt.seconds;
                const readTime = lastReadAt.seconds;
                if (msgTime > readTime) {
                  unreadCount++;
                }
              }
            });
          } else if (joinedAt) {
            // lastReadAt이 없으면 joinedAt 이후 메시지들이 안읽음
            msgSnap.forEach((msgDoc) => {
              const msg = msgDoc.data();
              if (msg.createdAt && msg.uid !== auth.currentUser?.uid) {
                const msgTime = msg.createdAt.seconds;
                const joinTime = joinedAt.seconds;
                if (msgTime > joinTime) {
                  unreadCount++;
                }
              }
            });
          }

          // 4. 방 정보 업데이트
          room.participantUids = Array.from(messageParticipants);
          room.participantCount = messageParticipants.size;
          room.lastMsg = lastMsg;
          room.lastMsgTime = lastMsg?.createdAt?.seconds
            ? new Date(lastMsg.createdAt.seconds * 1000)
            : null;
          room.lastMsgText = lastMsg?.text || (lastMsg?.imageUrl ? "[이미지]" : "") || "";
          room.joinedAt = joinedAt;
          room.lastReadAt = lastReadAt;
          room.unreadCount = unreadCount;
          room.myLastActiveAt = myLastMsg?.createdAt || null;

          // 5. 정렬을 위한 타임스탬프 설정
          room.sortTimestamp = myLastMsg?.createdAt?.seconds || joinedAt?.seconds || 0;

          // 6. 기본 속성 설정
          room.title = room.name || room.title || "";
          room.desc = room.desc || "새로운 채팅방입니다. 함께 이야기해요!";
          room.members = room.participantCount;
          room.isMine = room.createdBy === auth.currentUser?.uid;
          
          // 7. 참여 상태 확인 로직
          const hasMessages = messageParticipants.has(auth.currentUser?.uid);
          
          // 조건:
          // 1. 방장이면 항상 표시
          // 2. participants에 있으면 표시 (활성 참여자)
          // 3. participants에 없지만 메시지 이력이 있고 joinedAt이 있으면 표시 (단순 뒤로가기)
          room.isJoined = isInParticipants || (hasMessages && joinedAt);
          room.isVisible = room.isMine || room.isJoined;
          
          room.isSearched = !search || 
            room.title.includes(search) || 
            room.desc.includes(search) ||
            (room.hashtags && room.hashtags.some(tag => tag.toLowerCase().includes(search.toLowerCase().replace('#', ''))));

          return room;
        } catch (error) {
          console.error(`Error processing room ${room.id}:`, error);
          return room;
        }
      });

      // 모든 방의 데이터를 병렬로 처리
      const processedRooms = await Promise.all(roomPromises);
      setRooms(processedRooms);
      setRoomsLoading(false);
    });

    return () => unsubscribe();
  }, [search, isAuthenticated, authLoading]);

  // 검색 핸들러
  const handleSearch = (searchText) => {
    setSearch(searchText);
    setSearchActive(true);
  };

  // 검색 해제 핸들러
  const handleClearSearch = () => {
    setSearch("");
    setSearchInput("");
    setSearchActive(false);
  };

  // 내가 만든 방 목록
  const getMyRooms = () => {
    return rooms
      .filter(room => room.isMine && room.isSearched)
      .sort((a, b) => getLastActiveAt(b) - getLastActiveAt(a));
  };

  // 참여중인 방 목록
  const getJoinedRooms = () => {
    return rooms
      .filter(room => !room.isMine && room.isJoined && room.isSearched)
      .sort((a, b) => getLastActiveAt(b) - getLastActiveAt(a));
  };

  return {
    // 상태
    rooms,
    roomsLoading: authLoading || roomsLoading,
    searchInput,
    setSearchInput,
    searchActive,

    // 핸들러
    handleSearch,
    handleClearSearch,

    // 계산된 값
    myRooms: getMyRooms(),
    joinedRooms: getJoinedRooms(),
  };
} 
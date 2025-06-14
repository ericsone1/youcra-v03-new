import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

export function useChatList() {
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  // 탭 관련 상태 제거 - 이제 내 채팅방만 표시
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomHashtags, setNewRoomHashtags] = useState("");
  const [creating, setCreating] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [myRoomsVisibleCount, setMyRoomsVisibleCount] = useState(5);
  const [joinedRoomsVisibleCount, setJoinedRoomsVisibleCount] = useState(5);
  const navigate = useNavigate();

  // 해시태그 파싱 함수
  const parseHashtags = (text) => {
    const hashtagRegex = /#[\w가-힣]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
  };

  // 최근 활동 기준 정렬 함수
  const getLastActiveAt = (room) => {
    return room.sortTimestamp || 0;
  };

  // 채팅방 데이터 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log("chatRooms snapshot docs:", snapshot.docs.length);
      
      const roomPromises = snapshot.docs.map(async (docSnap) => {
        const room = { id: docSnap.id, ...docSnap.data() };
        console.log("Processing room:", room.id);

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

          // 1. 메시지 정보 가져오기
          const msgQ = query(
            collection(db, "chatRooms", room.id, "messages"),
            orderBy("createdAt", "desc")
          );
          const msgSnap = await getDocs(msgQ);
          const participants = new Set();
          let lastMsg = null;
          let myLastMsg = null;

          msgSnap.forEach((msgDoc) => {
            const msg = msgDoc.data();
            if (msg.uid) participants.add(msg.uid);
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
          
          participantsSnap.forEach((doc) => {
            if (doc.id === auth.currentUser?.uid) {
              joinedAt = doc.data().joinedAt;
              lastReadAt = doc.data().lastReadAt;
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
          room.participantUids = Array.from(participants);
          room.participantCount = participants.size;
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

          // 6. UI 관련 속성 설정
          room.likes = Math.floor(Math.random() * 100) + 10;
          room.title = room.name || room.title || "";
          room.desc = room.desc || "새로운 채팅방입니다. 함께 이야기해요!";
          room.lastMsgDisplay = room.lastMsgText || "아직 메시지가 없습니다.";
          room.imageUrl = `https://picsum.photos/seed/${room.id}/48`;
          room.members = room.participantCount;
          room.isMine = room.createdBy === auth.currentUser?.uid;
          room.isJoined = room.participantUids?.includes(auth.currentUser?.uid);
          // 내 채팅방만 표시 (내가 만든 방 또는 참여중인 방)
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
  }, [search]); // filter 의존성도 제거

  // 방 생성 핸들러
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    
    // 해시태그 파싱
    const parsedHashtags = parseHashtags(newRoomHashtags);
    
    const docRef = await addDoc(collection(db, "chatRooms"), {
      name: newRoomName,
      hashtags: parsedHashtags,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || "anonymous",
      profileImage: "",
      maxParticipants: 10,
    });
    
    setNewRoomName("");
    setNewRoomHashtags("");
    setCreating(false);
    setShowCreateModal(false);
    navigate(`/chat/${docRef.id}`);
  };

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

  // 방 입장 핸들러
  const handleEnterRoom = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  // 필터된 방 목록 계산 (사용하지 않음 - 내 채팅방만 표시)
  const getFilteredRooms = () => {
    let filtered = rooms.filter(room => room.isVisible && room.isSearched);
    
    // 항상 최신순으로 정렬
    filtered.sort((a, b) => getLastActiveAt(b) - getLastActiveAt(a));
    
    return filtered;
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
    roomsLoading,
    search,
    searchInput,
    setSearchInput,
    searchActive,
    showCreateModal,
    setShowCreateModal,
    newRoomName,
    setNewRoomName,
    newRoomHashtags,
    setNewRoomHashtags,
    creating,
    visibleCount,
    setVisibleCount,
    myRoomsVisibleCount,
    setMyRoomsVisibleCount,
    joinedRoomsVisibleCount,
    setJoinedRoomsVisibleCount,

    // 핸들러
    handleCreateRoom,
    handleSearch,
    handleClearSearch,
    handleEnterRoom,
    parseHashtags,

    // 계산된 값
    filteredRooms: getFilteredRooms(),
    myRooms: getMyRooms(),
    joinedRooms: getJoinedRooms(),
  };
} 
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import RoomCard from './ChatList/components/RoomCard';
import LazyRoomCard from './ChatList/components/LazyRoomCard';
import VirtualizedRoomList from './ChatList/components/VirtualizedRoomList';
import { useLazyList } from '../hooks/useIntersectionObserver';
import { useScrollOptimization } from '../hooks/useScrollTransition';

function AllChatRooms() {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  
  // 스크롤 최적화 훅
  const { isPending, deferredUpdate } = useScrollOptimization(scrollContainerRef);
  
  const [rooms, setRooms] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState("최신순");
  const [loading, setLoading] = useState(true);
  const [useVirtualization, setUseVirtualization] = useState(false);

  // 채팅방 데이터 실시간 구독
  useEffect(() => {
    let unsubscribe;
    
    try {
      const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
      unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          const roomPromises = snapshot.docs.map(async (docSnap) => {
            const room = { id: docSnap.id, ...docSnap.data() };
            try {
              // 메시지 정보 및 참여자 등 추가 데이터 수집 (타임아웃 설정)
              const msgQ = query(collection(db, "chatRooms", room.id, "messages"), orderBy("createdAt", "desc"));
              const msgSnap = await Promise.race([
                getDocs(msgQ),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
              ]);
              
              const participants = new Set();
              let lastMsg = null;
              msgSnap.forEach((msgDoc) => {
                const msg = msgDoc.data();
                if (msg.uid) participants.add(msg.uid);
                if (!lastMsg) lastMsg = msg;
              });
              
              const partSnap = await Promise.race([
                getDocs(collection(db, "chatRooms", room.id, "participants")),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
              ]);
              partSnap.forEach((p) => participants.add(p.id));
              
              room.participantCount = participants.size;
              room.lastMsgText = lastMsg?.text || (lastMsg?.imageUrl ? "[이미지]" : "") || "";
              room.sortTimestamp = lastMsg?.createdAt?.seconds || room.createdAt?.seconds || 0;
              room.title = room.name || room.title || "";
              room.desc = room.desc || "새로운 채팅방입니다. 함께 이야기해요!";
              room.hashtags = room.hashtags || [];
              return room;
            } catch (e) {
              console.warn(`Failed to load details for room ${room.id}:`, e.message);
              // 기본값으로 반환
              room.participantCount = 0;
              room.lastMsgText = "";
              room.sortTimestamp = room.createdAt?.seconds || 0;
              room.title = room.name || room.title || "채팅방";
              room.desc = room.desc || "새로운 채팅방입니다.";
              room.hashtags = room.hashtags || [];
              return room;
            }
          });
          const processed = await Promise.all(roomPromises);
          setRooms(processed);
        } catch (error) {
          console.error("Error processing chat rooms:", error);
          setRooms([]);
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error("Error fetching chat rooms:", error);
        setLoading(false);
        setRooms([]);
      });
    } catch (error) {
      console.error("Error setting up chat rooms listener:", error);
      setLoading(false);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 필터 & 검색
  const filteredRooms = rooms
    .filter((room) => {
      if (!searchInput.trim()) return true;
      const s = searchInput.toLowerCase();
      return (
        room.title.toLowerCase().includes(s) ||
        room.desc.toLowerCase().includes(s) ||
        (room.hashtags && room.hashtags.some((tag) => tag.toLowerCase().includes(s.replace('#', ''))))
      );
    })
    .sort((a, b) => {
      if (filter === "좋아요순") return (b.likes || 0) - (a.likes || 0);
      if (filter === "참여인원순") return (b.participantCount || 0) - (a.participantCount || 0);
      // 최신순 default
      return b.sortTimestamp - a.sortTimestamp;
    });

  // 지연 로딩 적용
  const { 
    visibleItems: visibleRooms, 
    hasMore, 
    isLoading: lazyLoading, 
    targetRef: loadMoreRef 
  } = useLazyList(filteredRooms, 10, 5);

  // 가상화 모드 자동 전환 (100개 이상일 때)
  useEffect(() => {
    setUseVirtualization(filteredRooms.length > 100);
  }, [filteredRooms.length]);

  return (
    <div className="max-w-md mx-auto bg-[#f7faff] rounded-2xl p-3 min-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <h2 className="text-2xl font-bold">전체 채팅방</h2>
        <div className="w-6" />
      </div>

      {/* 검색 */}
      <div className="mb-3 relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            const newValue = e.target.value;
            deferredUpdate(() => setSearchInput(newValue));
          }}
          placeholder="채팅방 이름, 키워드, #해시태그 검색"
          className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchInput && (
          <button onClick={() => deferredUpdate(() => setSearchInput(""))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      {/* 정렬 */}
      <div className="mb-4">
        <select 
          value={filter} 
          onChange={(e) => {
            const newFilter = e.target.value;
            deferredUpdate(() => setFilter(newFilter));
          }} 
          className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="최신순">최신순</option>
          <option value="좋아요순">좋아요순</option>
          <option value="참여인원순">참여인원순</option>
        </select>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-500">방 개수: {filteredRooms.length}</div>
        {filteredRooms.length > 50 && (
          <button
            onClick={() => setUseVirtualization(!useVirtualization)}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
          >
            {useVirtualization ? '🚀 가상화 ON' : '⚡ 가상화 OFF'}
          </button>
        )}
      </div>

      {/* 리스트 */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-500">채팅방을 불러오는 중...</div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          검색 결과가 없습니다
        </div>
      ) : useVirtualization ? (
        <VirtualizedRoomList
          rooms={filteredRooms}
          onEnter={(id) => navigate(`/chat/${id}`)}
          variant="all"
          estimatedSize={120}
          overscan={8}
          className={isPending ? 'opacity-90' : ''}
        />
      ) : (
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto space-y-3 pb-safe scroll-optimized"
        >
          {visibleRooms.map((room) => (
            <LazyRoomCard
              key={room.id}
              room={room}
              onEnter={(id) => navigate(`/chat/${id}`)}
              variant="all"
              className={isPending ? 'opacity-90' : ''}
            />
          ))}
          
          {/* 더 보기 로딩 트리거 */}
          {hasMore && !loading && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {lazyLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-sm">더 많은 채팅방을 불러오는 중...</span>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  {filteredRooms.length - visibleRooms.length}개 더 보기
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AllChatRooms; 
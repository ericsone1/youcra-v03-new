import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaPlus } from "react-icons/fa";
import Modal from "react-modal";

function ChatList() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [filter, setFilter] = useState("최신순");
  const [activeTab, setActiveTab] = useState("내 채팅방");
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
          
          participantsSnap.forEach((doc) => {
            if (doc.id === auth.currentUser?.uid) {
              joinedAt = doc.data().joinedAt;
            }
          });

          // 3. 방 정보 업데이트
          room.participantUids = Array.from(participants);
          room.participantCount = participants.size;
          room.lastMsg = lastMsg;
          room.lastMsgTime = lastMsg?.createdAt?.seconds
            ? new Date(lastMsg.createdAt.seconds * 1000)
            : null;
          room.lastMsgText = lastMsg?.text || (lastMsg?.imageUrl ? "[이미지]" : "") || "";
          room.joinedAt = joinedAt;
          room.myLastActiveAt = myLastMsg?.createdAt || null;

          // 4. 정렬을 위한 타임스탬프 설정
          room.sortTimestamp = myLastMsg?.createdAt?.seconds || joinedAt?.seconds || 0;

          // 5. UI 관련 속성 설정
          room.likes = Math.floor(Math.random() * 100) + 10;
          room.title = room.name || room.title || "";
          room.desc = room.desc || "새로운 채팅방입니다. 함께 이야기해요!";
          room.lastMsgDisplay = room.lastMsgText || "아직 메시지가 없습니다.";
          room.imageUrl = `https://picsum.photos/seed/${room.id}/48`;
          room.members = room.participantCount;
          room.buttonText = "입장하기";
          room.buttonColor = "bg-blue-500";
          room.buttonTextColor = "text-white";
          room.buttonHover = "hover:bg-blue-600";
          room.buttonBorder = "";
          room.buttonShadow = "";
          room.buttonRounded = "rounded-lg";
          room.buttonPadding = "px-4 py-2";
          room.buttonFont = "font-bold";
          room.buttonTextSize = "text-base";
          room.buttonClass = `${room.buttonColor} ${room.buttonTextColor} ${room.buttonHover} ${room.buttonRounded} ${room.buttonPadding} ${room.buttonFont} ${room.buttonTextSize}`;
          room.roomClass = "flex items-center bg-white rounded-xl shadow p-3";
          room.roomInfoClass = "flex-1 min-w-0";
          room.roomTitleClass = "font-bold text-base truncate";
          room.roomDescClass = "text-xs text-gray-500 truncate";
          room.roomMetaClass = "text-xs text-gray-400 flex gap-3 mt-1";
          room.thumbClass = "w-12 h-12 rounded-lg object-cover mr-3";
          room.iconClass = "inline-block align-middle mr-1";
          room.likesIcon = "❤️";
          room.membersIcon = "👥";
          room.buttonWrapper = "flex items-center";
          room.roomWrapper = "mb-3";
          room.roomKey = room.id;
          room.onEnter = () => navigate(`/chat/${room.id}`);
          room.showButton = true;
          room.showMeta = true;
          room.showDesc = true;
          room.showThumb = true;
          room.showTitle = true;
          room.showLikes = true;
          room.showMembers = true;
          room.showEnter = true;
          room.showAll = true;
          room.show = true;
          room.searchable = room.title + room.desc;
          room.filterValue = filter;
          room.searchValue = search;
          room.tab = activeTab;
          room.isMine = room.createdBy === auth.currentUser?.uid;
          room.isJoined = room.participantUids?.includes(auth.currentUser?.uid);
          room.isAll = true;
          room.isVisible = (activeTab === "전체") || (activeTab === "내 채팅방" && (room.isMine || room.isJoined));
          room.isSearched = !search || 
            room.title.includes(search) || 
            room.desc.includes(search) ||
            (room.hashtags && room.hashtags.some(tag => tag.toLowerCase().includes(search.toLowerCase().replace('#', ''))));
          room.isFiltered = true;
          room.showFinal = room.isVisible && room.isSearched && room.isFiltered;
          room.show = room.showFinal;
          room.display = room.show;

          console.log(`Room ${room.id} processed:`, {
            title: room.title,
            sortTimestamp: room.sortTimestamp,
            isMine: room.isMine,
            isJoined: room.isJoined
          });

          return room;
        } catch (error) {
          console.error(`Error processing room ${room.id}:`, error);
          return room;
        }
      });

      // 모든 방의 데이터를 병렬로 처리
      const processedRooms = await Promise.all(roomPromises);
      console.log("All rooms processed:", processedRooms.length);
      
      // 정렬된 방 목록 설정
      setRooms(processedRooms);
    });

    return () => unsubscribe();
  }, [activeTab, search, filter]);

  // 방 생성 핸들러
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    
    // 해시태그 파싱
    const parsedHashtags = parseHashtags(newRoomHashtags);
    
    const docRef = await addDoc(collection(db, "chatRooms"), {
      name: newRoomName,
      hashtags: parsedHashtags, // 해시태그 배열 추가
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || "anonymous",
      profileImage: "",
      maxParticipants: 10,
    });
    setNewRoomName("");
    setNewRoomHashtags("");
    setCreating(false);
    setShowCreateModal(false);
    navigate(`/chat/${docRef.id}`); // 방 생성 후 곧바로 입장
  };

  // 최근 활동 기준 정렬 함수
  function getLastActiveAt(room) {
    return room.sortTimestamp || 0;
  }

  return (
    <div className="max-w-md mx-auto bg-[#f7faff] rounded-2xl p-3 min-h-screen flex flex-col">
      <h2 className="text-2xl font-bold text-center mt-4 mb-2">채팅방 리스트</h2>
      {/* 상단 탭 */}
      <div className="flex gap-2 mb-2">
        <button className={`flex-1 py-2 rounded-full font-bold text-base ${activeTab === "내 채팅방" ? "bg-blue-500 text-white" : "bg-blue-100 text-gray-500"}`} onClick={() => setActiveTab("내 채팅방")}>내 채팅방</button>
        <button className={`flex-1 py-2 rounded-full font-bold text-base ${activeTab === "전체" ? "bg-blue-500 text-white" : "bg-blue-100 text-gray-500"}`} onClick={() => setActiveTab("전체")}>전체</button>
      </div>
      {/* 검색창 */}
      <input
        className="w-full rounded-lg border px-3 py-2 mb-2 text-sm"
        placeholder="채팅방 이름, 키워드, #해시태그 검색"
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            setSearch(searchInput);
            setSearchActive(true);
          }
        }}
      />
      {/* 검색 해제 버튼 */}
      {searchActive && (
          <button
          className="text-xs text-blue-500 underline mb-2 ml-1"
          onClick={() => {
            setSearch("");
            setSearchInput("");
            setSearchActive(false);
          }}
        >
          검색 해제
          </button>
      )}
      {/* 정렬 셀렉트 박스 */}
      <div className="mb-3">
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="최신순">최신순</option>
          <option value="좋아요순">좋아요순</option>
          <option value="참여인원순">참여인원순</option>
        </select>
      </div>
      {/* 채팅방 리스트 */}
      <div className="text-sm text-gray-500 mb-2">방 개수: {rooms.length}</div>
      <div className="flex flex-col gap-3 mb-24">
        {/* 렌더링 직전 rooms 배열 디버깅 */}
        {(() => {
          console.log("렌더링 직전 rooms 배열:", rooms);
          rooms.forEach((room, idx) => {
            console.log(
              `[렌더링][${idx}] id: ${room.id}, title: ${room.title}, desc: ${room.desc}, members: ${room.members}, likes: ${room.likes}, showFinal: ${room.showFinal}`
            );
          });
        })()}
        {activeTab === "전체" ? (
          rooms.filter(room => room.isSearched)
            .slice(0, visibleCount)
            .map(room => (
              <div key={room.id} className="flex items-center bg-white rounded-xl shadow p-3 gap-3 hover:bg-blue-50 transition">
                {/* 썸네일 - 더 크게 */}
                <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-md">
                  {room.name?.slice(0, 2).toUpperCase() || 'CH'}
                </div>
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base truncate mb-1">{room.title}</div>
                  <div className="text-xs text-gray-500 truncate mb-2">{room.desc}</div>
                  
                  {/* 사람수, 좋아요 수 */}
                  <div className="flex gap-4 text-xs text-gray-400 mb-2 items-center">
                    <span className="flex items-center"><span className="mr-1">👥</span>{room.members}명</span>
                    <span className="flex items-center"><span className="mr-1">❤️</span>{room.likes}</span>
                  </div>
                  
                  {/* 해시태그 표시 (별도 줄) */}
                  {room.hashtags && room.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.hashtags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          #{tag}
                        </span>
                      ))}
                      {room.hashtags.length > 3 && (
                        <span className="text-xs text-gray-400">+{room.hashtags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                {/* 입장 버튼 - 더 크게 */}
                <button
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-base hover:bg-blue-600 transition shadow-md"
                  onClick={room.onEnter}
                >
                  입장하기
                </button>
              </div>
            ))
        ) : (
          <>
            {/* 내가 만든 방 */}
            <div className="mb-2 mt-2 flex items-center justify-between">
              <span className="text-base font-bold text-blue-700">내가 만든 방</span>
              <button
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full shadow font-bold text-sm hover:bg-blue-600 transition"
                onClick={() => navigate('/chat/create')}
              >
                <FaPlus /> 방 생성하기
              </button>
            </div>
            {(() => {
              const myRooms = rooms
                .filter(room => room.isMine && room.isSearched)
                .sort((a, b) => getLastActiveAt(b) - getLastActiveAt(a));
              
              console.log("My rooms sorted:", myRooms.map(r => ({
                id: r.id,
                sortTimestamp: r.sortTimestamp,
                title: r.title
              })));

              return myRooms.slice(0, myRoomsVisibleCount).length === 0 ? (
                <div className="text-sm text-gray-400 mb-2">내가 만든 방이 없습니다.</div>
              ) : (
                <>
                  {myRooms.slice(0, myRoomsVisibleCount).map(room => (
                    <div key={room.id} className="flex items-center bg-white rounded-xl shadow p-3 gap-3 hover:bg-blue-50 transition">
                      {/* 썸네일 - 더 크게 */}
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-md">
                        {room.name?.slice(0, 2).toUpperCase() || 'CH'}
                      </div>
                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base truncate mb-1">{room.title}</div>
                        <div className="text-xs text-gray-500 truncate mb-2">{room.desc}</div>
                        
                        {/* 사람수, 좋아요 수 */}
                        <div className="flex gap-4 text-xs text-gray-400 mb-2 items-center">
                          <span className="flex items-center"><span className="mr-1">👥</span>{room.members}명</span>
                          <span className="flex items-center"><span className="mr-1">❤️</span>{room.likes}</span>
                        </div>
                        
                        {/* 해시태그 표시 (별도 줄) */}
                        {room.hashtags && room.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {room.hashtags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                #{tag}
                              </span>
                            ))}
                            {room.hashtags.length > 3 && (
                              <span className="text-xs text-gray-400">+{room.hashtags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* 입장 버튼 - 더 크게 */}
                      <button
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-base hover:bg-blue-600 transition shadow-md"
                        onClick={room.onEnter}
                      >
                        입장하기
                      </button>
                    </div>
                  ))}
                  {myRooms.length > myRoomsVisibleCount && (
                    <div className="text-center mt-2">
                      <button
                        className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition"
                        onClick={() => setMyRoomsVisibleCount(c => c + 5)}
                      >
                        더보기
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
            {/* 참여중인 방 */}
            <div className="mb-2 mt-4 text-base font-bold text-blue-700">참여중인 방</div>
            {(() => {
              const joinedRooms = rooms
                .filter(room => !room.isMine && room.isJoined && room.isSearched)
                .sort((a, b) => getLastActiveAt(b) - getLastActiveAt(a));
              
              console.log("Joined rooms sorted:", joinedRooms.map(r => ({
                id: r.id,
                sortTimestamp: r.sortTimestamp,
                title: r.title
              })));

              return joinedRooms.slice(0, joinedRoomsVisibleCount).length === 0 ? (
                <div className="text-sm text-gray-400 mb-2">참여중인 방이 없습니다.</div>
              ) : (
                <>
                  {joinedRooms.slice(0, joinedRoomsVisibleCount).map(room => (
                    <div key={room.id} className="flex items-center bg-white rounded-xl shadow p-3 gap-3 hover:bg-blue-50 transition">
                      {/* 썸네일 - 더 크게 */}
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-md">
                        {room.name?.slice(0, 2).toUpperCase() || 'CH'}
                      </div>
                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base truncate mb-1">{room.title}</div>
                        <div className="text-xs text-gray-500 truncate mb-2">{room.desc}</div>
                        
                        {/* 사람수, 좋아요 수 */}
                        <div className="flex gap-4 text-xs text-gray-400 mb-2 items-center">
                          <span className="flex items-center"><span className="mr-1">👥</span>{room.members}명</span>
                          <span className="flex items-center"><span className="mr-1">❤️</span>{room.likes}</span>
                        </div>
                        
                        {/* 해시태그 표시 (별도 줄) */}
                        {room.hashtags && room.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {room.hashtags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                #{tag}
                              </span>
                            ))}
                            {room.hashtags.length > 3 && (
                              <span className="text-xs text-gray-400">+{room.hashtags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* 입장 버튼 - 더 크게 */}
                      <button
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-base hover:bg-blue-600 transition shadow-md"
                        onClick={room.onEnter}
                      >
                        입장하기
                      </button>
                    </div>
                  ))}
                  {joinedRooms.length > joinedRoomsVisibleCount && (
                    <div className="text-center mt-2">
                      <button
                        className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition"
                        onClick={() => setJoinedRoomsVisibleCount(c => c + 5)}
                      >
                        더보기
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
        {/* 전체 탭 더보기 버튼 */}
        {activeTab === "전체" && rooms.filter(room => room.isSearched).length > visibleCount && (
          <div className="text-center mt-2">
            <button
              className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition"
              onClick={() => setVisibleCount(c => c + 5)}
            >
              더보기
            </button>
          </div>
        )}
      </div>
      {/* 방 생성 모달 */}
      <Modal
        isOpen={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
        ariaHideApp={false}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs flex flex-col items-center">
          <h3 className="font-bold text-lg mb-4">새 채팅방 만들기</h3>
            <input
            className="w-full border rounded-lg px-3 py-2 mb-4 text-base"
            placeholder="채팅방 이름 입력"
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <input
            className="w-full border rounded-lg px-3 py-2 mb-4 text-base"
            placeholder="#게임 #음악 #일상 (띄어쓰기로 구분)"
            value={newRoomHashtags}
            onChange={e => setNewRoomHashtags(e.target.value)}
            maxLength={50}
          />
          {/* 해시태그 미리보기 */}
          {newRoomHashtags && (
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-1">입력된 태그:</div>
              <div className="flex flex-wrap gap-1">
                {parseHashtags(newRoomHashtags).map((tag, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold text-base hover:bg-blue-600 transition mb-2"
            onClick={handleCreateRoom}
            disabled={creating || !newRoomName.trim()}
          >
            {creating ? "생성 중..." : "방 만들기"}
          </button>
          <button
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-bold text-base hover:bg-gray-300 transition"
            onClick={() => setShowCreateModal(false)}
            disabled={creating}
          >
            취소
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ChatList;
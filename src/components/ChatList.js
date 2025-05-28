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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function ChatList() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("최신순");
  const [activeTab, setActiveTab] = useState("전체");
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log("chatRooms snapshot docs:", snapshot.docs.length);
      const roomList = [];
      for (const docSnap of snapshot.docs) {
        const room = { id: docSnap.id, ...docSnap.data() };
        console.log("room raw data:", room);
        // 참여자 수, 최근 메시지, 활성화 상태 계산
        const msgQ = query(
          collection(db, "chatRooms", room.id, "messages"),
          orderBy("createdAt", "desc")
        );
        const msgSnap = await getDocs(msgQ);
        const participants = new Set();
        let lastMsg = null;
        msgSnap.forEach((msgDoc, idx) => {
          const msg = msgDoc.data();
          if (msg.uid) participants.add(msg.uid);
          if (idx === 0) lastMsg = msg;
        });
        room.participantUids = Array.from(participants);
        room.participantCount = participants.size;
        room.lastMsg = lastMsg;
        room.lastMsgTime = lastMsg?.createdAt?.seconds
          ? new Date(lastMsg.createdAt.seconds * 1000)
          : null;
        room.lastMsgText =
          lastMsg?.text ||
          (lastMsg?.imageUrl ? "[이미지]" : "") ||
          "";
        // 랜덤 좋아요 수, 랜덤 설명 추가 (데모용)
        room.likes = Math.floor(Math.random() * 100) + 10;
        // title, desc 값 보장
        room.title = room.name || room.title || "";
        room.desc = room.lastMsgText || "채팅방에 참여해보세요!";
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
        room.isVisible =
          (activeTab === "전체") ||
          (activeTab === "내 채팅방" && (room.isMine || room.isJoined));
        room.isSearched =
          !search ||
          room.title.includes(search) ||
          room.desc.includes(search);
        room.isFiltered = true; // 필터링 로직 추가 가능
        room.showFinal = room.isVisible && room.isSearched && room.isFiltered;
        room.show = room.showFinal;
        room.display = room.show;
        room.displayClass = room.display ? "" : "hidden";
        room.displayStyle = room.display ? {} : { display: "none" };
        room.displayKey = room.id;
        room.displayTab = activeTab;
        room.displayFilter = filter;
        room.displaySearch = search;
        room.displayAll = true;
        room.displayMine = room.isMine;
        room.displayJoined = room.isJoined;
        room.displaySearched = room.isSearched;
        room.displayFiltered = room.isFiltered;
        room.displayFinal = room.showFinal;
        room.displayShow = room.show;
        room.displayVisible = room.isVisible;
        room.displaySearched2 = room.isSearched;
        room.displayFiltered2 = room.isFiltered;
        room.displayShow2 = room.displayShowFinal;
        room.displayShow3 = room.show;
        room.displayShow4 = room.display;
        room.displayShow5 = room.displayFinal;
        room.displayShow6 = room.displayShow;
        room.displayShow7 = room.displayShow2;
        room.displayShow8 = room.displayShow3;
        room.displayShow9 = room.displayShow4;
        room.displayShow10 = room.displayShow5;
        room.displayShow11 = room.displayShow6;
        room.displayShow12 = room.displayShow7;
        room.displayShow13 = room.displayShow8;
        room.displayShow14 = room.displayShow9;
        room.displayShow15 = room.displayShow10;
        room.displayShow16 = room.displayShow11;
        room.displayShow17 = room.displayShow12;
        room.displayShow18 = room.displayShow13;
        room.displayShow19 = room.displayShow14;
        room.displayShow20 = room.displayShow15;
        room.displayShow21 = room.displayShow16;
        room.displayShow22 = room.displayShow17;
        room.displayShow23 = room.displayShow18;
        room.displayShow24 = room.displayShow19;
        room.displayShow25 = room.displayShow20;
        room.displayShow26 = room.displayShow21;
        room.displayShow27 = room.displayShow22;
        room.displayShow28 = room.displayShow23;
        room.displayShow29 = room.displayShow24;
        room.displayShow30 = room.displayShow25;
        room.displayShow31 = room.displayShow26;
        room.displayShow32 = room.displayShow27;
        room.displayShow33 = room.displayShow28;
        room.displayShow34 = room.displayShow29;
        room.displayShow35 = room.displayShow30;
        room.displayShow36 = room.displayShow31;
        room.displayShow37 = room.displayShow32;
        room.displayShow38 = room.displayShow33;
        room.displayShow39 = room.displayShow34;
        room.displayShow40 = room.displayShow35;
        room.displayShow41 = room.displayShow36;
        room.displayShow42 = room.displayShow37;
        room.displayShow43 = room.displayShow38;
        room.displayShow44 = room.displayShow39;
        room.displayShow45 = room.displayShow40;
        room.displayShow46 = room.displayShow41;
        room.displayShow47 = room.displayShow42;
        room.displayShow48 = room.displayShow43;
        room.displayShow49 = room.displayShow44;
        room.displayShow50 = room.displayShow45;
        room.displayShow51 = room.displayShow46;
        room.displayShow52 = room.displayShow47;
        room.displayShow53 = room.displayShow48;
        room.displayShow54 = room.displayShow49;
        room.displayShow55 = room.displayShow50;
        room.displayShow56 = room.displayShow51;
        room.displayShow57 = room.displayShow52;
        room.displayShow58 = room.displayShow53;
        room.displayShow59 = room.displayShow54;
        room.displayShow60 = room.displayShow55;
        room.displayShow61 = room.displayShow56;
        room.displayShow62 = room.displayShow57;
        room.displayShow63 = room.displayShow58;
        room.displayShow64 = room.displayShow59;
        room.displayShow65 = room.displayShow60;
        room.displayShow66 = room.displayShow61;
        room.displayShow67 = room.displayShow62;
        room.displayShow68 = room.displayShow63;
        room.displayShow69 = room.displayShow64;
        room.displayShow70 = room.displayShow65;
        room.displayShow71 = room.displayShow66;
        room.displayShow72 = room.displayShow67;
        room.displayShow73 = room.displayShow68;
        room.displayShow74 = room.displayShow69;
        room.displayShow75 = room.displayShow70;
        room.displayShow76 = room.displayShow71;
        room.displayShow77 = room.displayShow72;
        room.displayShow78 = room.displayShow73;
        room.displayShow79 = room.displayShow74;
        room.displayShow80 = room.displayShow75;
        room.displayShow81 = room.displayShow76;
        room.displayShow82 = room.displayShow77;
        room.displayShow83 = room.displayShow78;
        room.displayShow84 = room.displayShow79;
        room.displayShow85 = room.displayShow80;
        room.displayShow86 = room.displayShow81;
        room.displayShow87 = room.displayShow82;
        room.displayShow88 = room.displayShow83;
        room.displayShow89 = room.displayShow84;
        room.displayShow90 = room.displayShow85;
        room.displayShow91 = room.displayShow86;
        room.displayShow92 = room.displayShow87;
        room.displayShow93 = room.displayShow88;
        room.displayShow94 = room.displayShow89;
        room.displayShow95 = room.displayShow90;
        room.displayShow96 = room.displayShow91;
        room.displayShow97 = room.displayShow92;
        room.displayShow98 = room.displayShow93;
        room.displayShow99 = room.displayShow94;
        room.displayShow100 = room.displayShow95;
        room.displayShow101 = room.displayShow96;
        room.displayShow102 = room.displayShow97;
        room.displayShow103 = room.displayShow98;
        room.displayShow104 = room.displayShow99;
        room.displayShow105 = room.displayShow100;
        room.displayShow106 = room.displayShow101;
        room.displayShow107 = room.displayShow102;
        room.displayShow108 = room.displayShow103;
        room.displayShow109 = room.displayShow104;
        room.displayShow110 = room.displayShow105;
        room.displayShow111 = room.displayShow106;
        room.displayShow112 = room.displayShow107;
        room.displayShow113 = room.displayShow108;
        room.displayShow114 = room.displayShow109;
        room.displayShow115 = room.displayShow110;
        room.displayShow116 = room.displayShow111;
        room.displayShow117 = room.displayShow112;
        room.displayShow118 = room.displayShow113;
        room.displayShow119 = room.displayShow114;
        room.displayShow120 = room.displayShow115;
        room.displayShow121 = room.displayShow116;
        room.displayShow122 = room.displayShow117;
        room.displayShow123 = room.displayShow118;
        room.displayShow124 = room.displayShow119;
        room.displayShow125 = room.displayShow120;
        room.displayShow126 = room.displayShow121;
        room.displayShow127 = room.displayShow122;
        room.displayShow128 = room.displayShow123;
        room.displayShow129 = room.displayShow124;
        room.displayShow130 = room.displayShow125;
        room.displayShow131 = room.displayShow126;
        room.displayShow132 = room.displayShow127;
        room.displayShow133 = room.displayShow128;
        room.displayShow134 = room.displayShow129;
        room.displayShow135 = room.displayShow130;
        room.displayShow136 = room.displayShow131;
        room.displayShow137 = room.displayShow132;
        room.displayShow138 = room.displayShow133;
        room.displayShow139 = room.displayShow134;
        room.displayShow140 = room.displayShow135;
        room.displayShow141 = room.displayShow136;
        room.displayShow142 = room.displayShow137;
        room.displayShow143 = room.displayShow138;
        room.displayShow144 = room.displayShow139;
        room.displayShow145 = room.displayShow140;
        room.displayShow146 = room.displayShow141;
        room.displayShow147 = room.displayShow142;
        room.displayShow148 = room.displayShow143;
        room.displayShow149 = room.displayShow144;
        room.displayShow150 = room.displayShow145;
        room.displayShow151 = room.displayShow146;
        room.displayShow152 = room.displayShow147;
        room.displayShow153 = room.displayShow148;
        room.displayShow154 = room.displayShow149;
        room.displayShow155 = room.displayShow150;
        room.displayShow156 = room.displayShow151;
        room.displayShow157 = room.displayShow152;
        room.displayShow158 = room.displayShow153;
        room.displayShow159 = room.displayShow154;
        room.displayShow160 = room.displayShow155;
        room.displayShow161 = room.displayShow156;
        room.displayShow162 = room.displayShow157;
        room.displayShow163 = room.displayShow158;
        room.displayShow164 = room.displayShow159;
        room.displayShow165 = room.displayShow160;
        room.displayShow166 = room.displayShow161;
        room.displayShow167 = room.displayShow162;
        room.displayShow168 = room.displayShow163;
        room.displayShow169 = room.displayShow164;
        room.displayShow170 = room.displayShow165;
        room.displayShow171 = room.displayShow166;
        room.displayShow172 = room.displayShow167;
        room.displayShow173 = room.displayShow168;
        room.displayShow174 = room.displayShow169;
        room.displayShow175 = room.displayShow170;
        room.displayShow176 = room.displayShow171;
        room.displayShow177 = room.displayShow172;
        room.displayShow178 = room.displayShow173;
        room.displayShow179 = room.displayShow174;
        room.displayShow180 = room.displayShow175;
        room.displayShow181 = room.displayShow176;
        room.displayShow182 = room.displayShow177;
        room.displayShow183 = room.displayShow178;
        room.displayShow184 = room.displayShow179;
        room.displayShow185 = room.displayShow180;
        room.displayShow186 = room.displayShow181;
        room.displayShow187 = room.displayShow182;
        room.displayShow188 = room.displayShow183;
        room.displayShow189 = room.displayShow184;
        room.displayShow190 = room.displayShow185;
        room.displayShow191 = room.displayShow186;
        room.displayShow192 = room.displayShow187;
        room.displayShow193 = room.displayShow188;
        room.displayShow194 = room.displayShow189;
        room.displayShow195 = room.displayShow190;
        room.displayShow196 = room.displayShow191;
        room.displayShow197 = room.displayShow192;
        room.displayShow198 = room.displayShow193;
        room.displayShow199 = room.displayShow194;
        room.displayShow200 = room.displayShow195;
        console.log("room.title:", room.title, "room.desc:", room.desc);
        roomList.push(room);
      }
      // 디버깅: roomList 전체 및 각 room 주요 필드 출력
      console.log("roomList 전체:", roomList);
      roomList.forEach((room, idx) => {
        console.log(
          `[${idx}] id: ${room.id}, title: ${room.title}, desc: ${room.desc}, members: ${room.members}, likes: ${room.likes}, showFinal: ${room.showFinal}`
        );
      });
      setRooms(roomList);
    });
    return () => unsubscribe();
  }, [activeTab, search, filter]);

  return (
    <div className="max-w-md mx-auto bg-[#f7faff] rounded-2xl p-3 min-h-screen flex flex-col">
      <h2 className="text-2xl font-bold text-center mt-4 mb-2">채팅방 리스트</h2>
      {/* 상단 탭 */}
      <div className="flex gap-2 mb-2">
        <button className={`flex-1 py-2 rounded-full font-bold text-base ${activeTab === "내 채팅방" ? "bg-blue-500 text-white" : "bg-blue-100 text-gray-500"}`} onClick={() => setActiveTab("내 채팅방")}>내 채팅방</button>
        <button className={`flex-1 py-2 rounded-full font-bold text-base ${activeTab === "전체" ? "bg-blue-500 text-white" : "bg-blue-100 text-gray-500"}`} onClick={() => setActiveTab("전체")}>전체</button>
      </div>
      {/* 검색창 */}
      <input className="w-full rounded-lg border px-3 py-2 mb-2 text-sm" placeholder="채팅방 이름, 키워드 검색" value={search} onChange={e => setSearch(e.target.value)} />
      {/* 필터 버튼 */}
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 py-2 rounded-full font-bold text-base ${filter === "최신순" ? "bg-yellow-400 text-gray-900" : "bg-gray-100 text-gray-500"}`} onClick={() => setFilter("최신순")}>최신순</button>
        <button className={`flex-1 py-2 rounded-full font-bold text-base ${filter === "좋아요순" ? "bg-yellow-400 text-gray-900" : "bg-gray-100 text-gray-500"}`} onClick={() => setFilter("좋아요순")}>좋아요순</button>
        <button className={`flex-1 py-2 rounded-full font-bold text-base ${filter === "참여인원순" ? "bg-yellow-400 text-gray-900" : "bg-gray-100 text-gray-500"}`} onClick={() => setFilter("참여인원순")}>참여인원순</button>
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
          rooms.map(room => (
            <div key={room.id} className="flex items-center bg-white rounded-xl shadow p-3 gap-3 hover:bg-blue-50 transition">
              {/* 썸네일 */}
              <img src={room.imageUrl} alt="썸네일" className="w-14 h-14 rounded-lg object-cover" />
              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base truncate mb-1">{room.title}</div>
                <div className="text-xs text-gray-500 truncate mb-1">{room.desc}</div>
                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                  <span className="flex items-center"><span className="mr-1">👥</span>{room.members}명</span>
                  <span className="flex items-center"><span className="mr-1">❤️</span>{room.likes}</span>
                </div>
              </div>
              {/* 입장 버튼 */}
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition"
                onClick={room.onEnter}
              >
                입장하기
              </button>
            </div>
          ))
        ) : (
          <>
            {/* 내가 만든 방 */}
            <div className="mb-2 mt-2 text-base font-bold text-blue-700">내가 만든 방</div>
            {rooms.filter(room => room.isMine).length === 0 && (
              <div className="text-sm text-gray-400 mb-2">내가 만든 방이 없습니다.</div>
            )}
            {rooms.filter(room => room.isMine).map(room => (
              <div key={room.id} className="flex items-center bg-white rounded-xl shadow p-3 gap-3 hover:bg-blue-50 transition">
                <img src={room.imageUrl} alt="썸네일" className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base truncate mb-1">{room.title}</div>
                  <div className="text-xs text-gray-500 truncate mb-1">{room.desc}</div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-1">
                    <span className="flex items-center"><span className="mr-1">👥</span>{room.members}명</span>
                    <span className="flex items-center"><span className="mr-1">❤️</span>{room.likes}</span>
                  </div>
                </div>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition"
                  onClick={room.onEnter}
                >
                  입장하기
                </button>
              </div>
            ))}
            {/* 참여중인 방 */}
            <div className="mb-2 mt-4 text-base font-bold text-blue-700">참여중인 방</div>
            {rooms.filter(room => !room.isMine && room.isJoined).length === 0 && (
              <div className="text-sm text-gray-400 mb-2">참여중인 방이 없습니다.</div>
            )}
            {rooms.filter(room => !room.isMine && room.isJoined).map(room => (
              <div key={room.id} className="flex items-center bg-white rounded-xl shadow p-3 gap-3 hover:bg-blue-50 transition">
                <img src={room.imageUrl} alt="썸네일" className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base truncate mb-1">{room.title}</div>
                  <div className="text-xs text-gray-500 truncate mb-1">{room.desc}</div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-1">
                    <span className="flex items-center"><span className="mr-1">👥</span>{room.members}명</span>
                    <span className="flex items-center"><span className="mr-1">❤️</span>{room.likes}</span>
                  </div>
                </div>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition"
                  onClick={room.onEnter}
                >
                  입장하기
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default ChatList;
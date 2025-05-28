import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc } from "firebase/firestore";

const RESET_OPTIONS = [
  { label: "초기화 안함", value: "none" },
  { label: "6시간 단위 초기화", value: "6h" },
  { label: "1일 단위 초기화", value: "1d" },
  { label: "3일 단위 초기화", value: "3d" },
  { label: "일주일 단위 초기화", value: "7d" },
];

function ChatRoomHostVideos() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [videoList, setVideoList] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const resetRef = useRef(null);
  const [selectedReset, setSelectedReset] = useState(RESET_OPTIONS[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [addMsg, setAddMsg] = useState("");

  // 영상 리스트 실시간 구독
  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setVideoList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [roomId]);

  // 드래그&드롭 순서 변경
  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragEnter = (idx) => {
    if (dragIdx === null || dragIdx === idx) return;
    const newList = [...videoList];
    const [moved] = newList.splice(dragIdx, 1);
    newList.splice(idx, 0, moved);
    setVideoList(newList);
    setDragIdx(idx);
  };
  const handleDragEnd = async () => {
    setDragIdx(null);
    // Firestore registeredAt swap (간단 버전: 순서대로 registeredAt 재설정)
    for (let i = 0; i < videoList.length; i++) {
      const ref = doc(db, "chatRooms", roomId, "videos", videoList[i].id);
      await setDoc(ref, { registeredAt: Date.now() + i }, { merge: true });
    }
  };

  // 리스트 초기화 옵션 드롭다운 바깥 클릭 시 닫힘
  useEffect(() => {
    if (!resetOpen) return;
    const handleClick = (e) => {
      if (resetRef.current && !resetRef.current.contains(e.target)) setResetOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [resetOpen]);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-0">
      {/* 상단바 */}
      <div className="flex items-center p-4 border-b">
        <button onClick={() => navigate(-1)} className="mr-2 text-lg text-gray-500">←</button>
        <div className="font-bold text-lg flex-1 text-center">콘텐츠 리스트 관리</div>
      </div>
      <div className="p-4 flex flex-col gap-6">
        {/* 리스트 초기화 메뉴 */}
        <div className="mb-4 relative" ref={resetRef}>
          <button className="bg-gray-200 px-4 py-2 rounded font-bold" onClick={() => setResetOpen(v => !v)}>
            리스트 초기화
          </button>
          {resetOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
              {RESET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedReset.value === opt.value ? 'bg-blue-100 font-bold' : ''}`}
                  onClick={() => {
                    setSelectedReset(opt);
                    setResetOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-600">현재 적용 중: <span className="font-bold text-blue-600">{selectedReset.label}</span></div>
        </div>
        {/* 영상 리스트 드래그&드롭 */}
        <div className="flex flex-col gap-2">
          {videoList.length === 0 && (
            <>
              <div className="text-gray-400">등록된 콘텐츠가 없습니다.</div>
              <div className="flex justify-center mt-4">
                <button
                  className="w-12 h-12 rounded-full bg-blue-500 text-white text-3xl flex items-center justify-center shadow hover:bg-blue-600"
                  onClick={() => setShowAddModal(true)}
                  title="콘텐츠 등록"
                >
                  +
                </button>
              </div>
            </>
          )}
          {videoList.map((video, idx) => (
            <div
              key={video.id}
              className={`flex items-center gap-2 bg-gray-50 rounded p-2 cursor-move ${dragIdx === idx ? 'ring-2 ring-blue-400' : ''}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
            >
              <img src={video.thumbnail} alt="썸네일" className="w-16 h-10 object-cover rounded" />
              <div className="truncate font-bold flex-1">{video.title}</div>
              <span className="text-xs text-gray-400">길게 눌러 순서 변경</span>
            </div>
          ))}
        </div>
      </div>
      {/* 콘텐츠 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative">
            <button className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-700" onClick={() => setShowAddModal(false)}>✕</button>
            <h2 className="font-bold text-lg mb-4">콘텐츠 등록</h2>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="콘텐츠(유튜브/인스타/틱톡 등) 링크를 입력하세요"
              value={newVideoUrl}
              onChange={e => setNewVideoUrl(e.target.value)}
            />
            <button
              className="w-full bg-blue-500 text-white py-2 rounded font-bold hover:bg-blue-600 mb-2"
              onClick={() => setAddMsg('아직 실제 등록 기능은 구현 전입니다.')}
            >
              등록
            </button>
            {addMsg && <div className="text-sm text-red-500 text-center">{addMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRoomHostVideos; 
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, getDocs, getDoc } from "firebase/firestore";

function ChatRoomHost() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [videoList, setVideoList] = useState([]);
  const [videoListState, setVideoListState] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 방장 확인 로직
  const myEmail = auth.currentUser?.email;
  const isOwner = roomData && roomData.ownerEmail === myEmail;

  // 채팅방 정보 및 권한 확인
  useEffect(() => {
    if (!roomId || !auth.currentUser) return;

    const fetchRoomData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        if (roomDoc.exists()) {
          const data = roomDoc.data();
          setRoomData(data);
          
          // 방장이 아니면 접근 차단
          if (data.ownerEmail !== auth.currentUser.email) {
            alert("방장만 접근할 수 있습니다.");
            navigate(`/chat/${roomId}`);
            return;
          }
        } else {
          alert("채팅방을 찾을 수 없습니다.");
          navigate("/chat");
          return;
        }
      } catch (error) {
        console.error("방 정보 확인 오류:", error);
        alert("방 정보를 확인할 수 없습니다.");
        navigate(`/chat/${roomId}`);
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, navigate]);

  // 영상 리스트 실시간 구독
  useEffect(() => {
    if (!roomId || !isOwner) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVideoList(list);
      setVideoListState(list);
    });
    return () => unsub();
  }, [roomId, isOwner]);

  // 로딩 중이거나 방장이 아닌 경우
  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">권한 확인 중...</div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null; // 이미 위에서 리다이렉션 처리됨
  }

  // 영상 삭제
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("정말 이 영상을 삭제할까요?")) return;
    await deleteDoc(doc(db, "chatRooms", roomId, "videos", videoId));
  };

  // 영상 순서 변경
  const handleMoveVideo = async (idx, dir) => {
    const newList = [...videoListState];
    const target = newList[idx];
    newList.splice(idx, 1);
    newList.splice(idx + dir, 0, target);
    setVideoListState(newList);
    // Firestore registeredAt swap
    const a = newList[idx];
    const b = newList[idx + dir];
    if (a && b) {
      const aRef = doc(db, "chatRooms", roomId, "videos", a.id);
      const bRef = doc(db, "chatRooms", roomId, "videos", b.id);
      const aTime = a.registeredAt;
      const bTime = b.registeredAt;
      await setDoc(aRef, { registeredAt: bTime }, { merge: true });
      await setDoc(bRef, { registeredAt: aTime }, { merge: true });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-0">
      {/* 상단바 */}
      <div className="flex items-center p-4 border-b">
        <button onClick={() => navigate(-1)} className="mr-2 text-lg text-gray-500">←</button>
        <div className="font-bold text-lg flex-1 text-center">방장 관리</div>
      </div>
      <div className="p-4 flex flex-col gap-6">
        {/* 참여자 관리 */}
        <section>
          <h2 className="font-bold text-base mb-2">👥 참여자 관리</h2>
          <div className="bg-gray-50 rounded p-3 mb-2">참여자 리스트 및 내보내기 기능 (추후 구현)</div>
        </section>
        {/* 방 설정 변경 */}
        <section>
          <h2 className="font-bold text-base mb-2">🔒 방 설정 변경</h2>
          <div className="bg-gray-50 rounded p-3 mb-2">방 이름 변경 등 (추후 구현)</div>
        </section>
        {/* 영상 관리 */}
        <section>
          <Link to={`/chat/${roomId}/host/videos`} className="block font-bold text-base mb-2 text-blue-600 hover:underline cursor-pointer">🎥 영상 관리</Link>
          <div className="flex flex-col gap-2">
            {videoListState.length === 0 && <div className="text-gray-400">등록된 영상이 없습니다.</div>}
            {videoListState.map((video, idx) => (
              <div key={video.id} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                <img src={video.thumbnail} alt="썸네일" className="w-16 h-10 object-cover rounded" />
                <div className="truncate font-bold flex-1">{video.title}</div>
                <button disabled={idx === 0} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200" onClick={() => handleMoveVideo(idx, -1)}>▲</button>
                <button disabled={idx === videoListState.length - 1} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200" onClick={() => handleMoveVideo(idx, 1)}>▼</button>
                <button className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600" onClick={() => handleDeleteVideo(video.id)}>삭제</button>
              </div>
            ))}
          </div>
        </section>
        {/* 방 삭제 */}
        <section>
          <h2 className="font-bold text-base mb-2 text-red-600">⚠️ 방 삭제</h2>
          <button className="w-full bg-red-500 text-white py-2 rounded font-bold hover:bg-red-600">채팅방 삭제 (추후 구현)</button>
        </section>
      </div>
    </div>
  );
}

export default ChatRoomHost; 
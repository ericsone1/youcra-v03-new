import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

function VideoListPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [videoList, setVideoList] = useState([]);
  const [certifiedIds, setCertifiedIds] = useState([]);

  // 영상 리스트 불러오기
  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setVideoList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [roomId]);

  // 내가 인증한 영상 id 리스트 불러오기
  useEffect(() => {
    if (!roomId || !auth.currentUser || videoList.length === 0) {
      setCertifiedIds([]);
      return;
    }
    const unsubscribes = videoList.map((video) => {
      const q = collection(db, "chatRooms", roomId, "videos", video.id, "certifications");
      return onSnapshot(q, (snapshot) => {
        const found = snapshot.docs.find(
          (doc) => doc.data().uid === auth.currentUser.uid
        );
        setCertifiedIds((prev) => {
          if (found && !prev.includes(video.id)) {
            return [...prev, video.id];
          }
          if (!found && prev.includes(video.id)) {
            return prev.filter((id) => id !== video.id);
          }
          return prev;
        });
      });
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [roomId, videoList]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mt-8">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="mr-2 text-lg text-gray-500">←</button>
        <div className="font-bold text-lg flex-1">시청 영상 리스트</div>
        <button
          className="bg-yellow-400 text-white px-3 py-1 rounded font-bold"
          onClick={() => navigate(`/chat/${roomId}/add-video`)}
        >
          내 영상 등록하기
        </button>
        <button
          className="ml-2 text-gray-400 hover:text-blue-500 text-2xl font-bold"
          onClick={() => navigate(`/chat/${roomId}`)}
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      {videoList.length === 0 && (
        <div className="text-sm text-gray-400">아직 등록된 영상이 없습니다.</div>
      )}
      <div className="flex flex-col gap-4">
        {videoList.map((video) => (
          <div key={video.id} className="border rounded-lg p-2 bg-gray-50 shadow flex items-center gap-4">
            <img src={video.thumbnail} alt="썸네일" className="w-32 h-20 object-cover rounded" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base truncate">{video.title}</div>
              <div className="text-xs text-gray-500">{video.channel}</div>
              <div className="text-xs text-gray-400">등록자: {video.registeredBy}</div>
            </div>
            {certifiedIds.includes(video.id) ? (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">시청 완료</span>
            ) : (
              <span className="bg-gray-300 text-gray-600 text-xs px-2 py-1 rounded font-bold">미인증</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VideoListPage;

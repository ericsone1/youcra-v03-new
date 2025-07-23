import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

function getYoutubeId(url) {
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

async function fetchYoutubeMeta(videoId) {
  const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${API_KEY}`
  );
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    const snippet = data.items[0].snippet;
    const duration = data.items[0].contentDetails.duration;
    const statistics = data.items[0].statistics;
    let seconds = 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hour = parseInt(match[1] || "0", 10);
      const min = parseInt(match[2] || "0", 10);
      const sec = parseInt(match[3] || "0", 10);
      seconds = hour * 3600 + min * 60 + sec;
    }
    return {
      title: snippet.title,
      thumbnail: snippet.thumbnails.medium.url,
      channel: snippet.channelTitle,
      channelId: snippet.channelId,
      channelThumbnail: snippet.thumbnails.default?.url || snippet.thumbnails.medium?.url,
      videoId,
      duration: seconds,
      viewCount: parseInt(statistics.viewCount || 0),
      likeCount: parseInt(statistics.likeCount || 0),
      views: parseInt(statistics.viewCount || 0),
      publishedAt: snippet.publishedAt,
      description: snippet.description || '',
      ucraViewCount: 0, // 유크라 조회수 초기값
      registeredAt: serverTimestamp(), // 등록 시간
    };
  }
  return null;
}

function AddVideoPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoMsg, setVideoMsg] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);

  // 영상 정보 확인
  const handleVideoCheck = async () => {
    setVideoMsg("");
    setVideoMeta(null);
    const videoId = getYoutubeId(videoUrl);
    if (!videoId) {
      setVideoMsg("유효한 유튜브 링크를 입력하세요.");
      return;
    }
    setVideoLoading(true);
    const meta = await fetchYoutubeMeta(videoId);
    if (!meta) {
      setVideoMsg("유튜브 정보를 불러올 수 없습니다.");
      setVideoLoading(false);
      return;
    }
    setVideoMeta(meta);
    setVideoLoading(false);
  };

  // 영상 등록
  const handleVideoRegister = async () => {
    alert("영상 등록 함수 실행됨!");
    console.log("영상 등록 함수 실행됨!");
    if (!videoMeta) return;
    setVideoLoading(true);
    if (roomId) {
      // 채팅방에서 등록 시
      await addDoc(collection(db, "chatRooms", roomId, "videos"), {
        ...videoMeta,
        registeredBy: auth.currentUser?.uid || "anonymous",
        registeredAt: serverTimestamp(),
      });
    }
    // 홈탭/전체 영상 등록 (roomId와 무관하게 항상 저장)
    await addDoc(collection(db, "videos"), {
      ...videoMeta,
      uploaderUid: auth.currentUser?.uid || "anonymous",
      uploaderName: auth.currentUser?.displayName || "익명",
      uploaderEmail: auth.currentUser?.email || "",
      registeredAt: serverTimestamp(),
    });
    setVideoMsg("영상이 등록되었습니다!");
    setVideoUrl("");
    setVideoMeta(null);
    setVideoLoading(false);
    setTimeout(() => navigate(-1), 1000); // 1초 후 리스트로 이동
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mt-8">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="mr-2 text-lg text-gray-500">←</button>
        <div className="font-bold text-lg flex-1">내 영상 등록하기</div>
      </div>
      <div className="flex gap-2 items-center mb-2">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1"
          placeholder="유튜브 영상 링크를 입력하세요"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          disabled={videoLoading}
        />
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={handleVideoCheck}
          disabled={videoLoading}
        >
          확인
        </button>
      </div>
      {videoMsg && <div className="text-sm text-red-500">{videoMsg}</div>}
      {videoMeta && (
        <div className="flex items-center gap-2 mb-2">
          <img src={videoMeta.thumbnail} alt="썸네일" className="w-24 h-14 rounded" />
          <div>
            <div className="font-bold">{videoMeta.title}</div>
            <div className="text-xs text-gray-500">{videoMeta.channel}</div>
            <div className="text-xs text-gray-500">길이: {videoMeta.duration}초</div>
          </div>
          <button
            className="bg-green-500 text-white px-3 py-1 rounded ml-2"
            onClick={handleVideoRegister}
            disabled={videoLoading}
          >
            등록
          </button>
        </div>
      )}
    </div>
  );
}

export default AddVideoPage; 
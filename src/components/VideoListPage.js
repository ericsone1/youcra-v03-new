import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

// YouTube ID 추출 함수
function getYoutubeId(url) {
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// YouTube 메타데이터 가져오기
async function fetchYoutubeMeta(videoId) {
  const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`
  );
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    const snippet = data.items[0].snippet;
    const duration = data.items[0].contentDetails.duration;
    let seconds = 0;
    const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const min = parseInt(match[1] || "0", 10);
      const sec = parseInt(match[2] || "0", 10);
      seconds = min * 60 + sec;
    }
    return {
      title: snippet.title,
      thumbnail: snippet.thumbnails.medium.url,
      channel: snippet.channelTitle,
      videoId,
      duration: seconds,
    };
  }
  return null;
}

function VideoListPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // 탭 관리
  const [activeTab, setActiveTab] = useState("watch"); // "watch" | "add"
  
  // 영상 리스트 관련
  const [videoList, setVideoList] = useState([]);
  const [certifiedIds, setCertifiedIds] = useState([]);
  
  // 영상 등록 관련
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");

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

  // 영상 확인
  const handleVideoCheck = async () => {
    if (!videoUrl.trim()) {
      setVideoMsg("YouTube URL을 입력하세요.");
      return;
    }
    
    const videoId = getYoutubeId(videoUrl);
    if (!videoId) {
      setVideoMsg("올바른 YouTube URL을 입력하세요.");
      return;
    }
    
    setVideoLoading(true);
    setVideoMsg("");
    
    try {
      const meta = await fetchYoutubeMeta(videoId);
      if (meta) {
        setVideoMeta(meta);
        setVideoMsg("");
      } else {
        setVideoMsg("영상 정보를 가져올 수 없습니다.");
      }
    } catch (error) {
      console.error("영상 메타데이터 가져오기 오류:", error);
      setVideoMsg("영상 정보를 가져오는 중 오류가 발생했습니다.");
    }
    
    setVideoLoading(false);
  };

  // 영상 등록
  const handleVideoRegister = async () => {
    if (!videoMeta) return;
    
    setVideoLoading(true);
    try {
      await addDoc(collection(db, "chatRooms", roomId, "videos"), {
        ...videoMeta,
        registeredAt: serverTimestamp(),
        registeredBy: auth.currentUser.email,
      });
      setVideoUrl("");
      setVideoMeta(null);
      setVideoMsg("영상이 성공적으로 등록되었습니다! 🎉");
      // 등록 후 시청하기 탭으로 전환
      setTimeout(() => {
        setActiveTab("watch");
        setVideoMsg("");
      }, 1500);
    } catch (error) {
      console.error("영상 등록 오류:", error);
      setVideoMsg("영상 등록 중 오류가 발생했습니다.");
    }
    setVideoLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 통일된 헤더 */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate(-1)} 
            className="text-2xl text-gray-600 hover:text-blue-600 transition-colors"
            aria-label="뒤로가기"
          >
            ←
          </button>
          <h1 className="font-bold text-lg text-gray-800">시청 리스트</h1>
          <button
            onClick={() => navigate(`/chat/${roomId}`)}
            className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* 탭 네비게이션 */}
        <div className="flex bg-gray-50 border-b">
          <button
            onClick={() => setActiveTab("watch")}
            className={`flex-1 py-4 px-6 font-medium transition-all ${
              activeTab === "watch"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            🎬 시청하기 ({videoList.length})
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`flex-1 py-4 px-6 font-medium transition-all ${
              activeTab === "add"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            ➕ 영상 등록
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="p-4">
          {activeTab === "watch" ? (
            // 시청하기 탭
            <div className="space-y-4">
              {videoList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">등록된 영상이 없어요</h3>
                  <p className="text-gray-500 mb-6">첫 번째 영상을 등록해보세요!</p>
                  <button
                    onClick={() => setActiveTab("add")}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    영상 등록하기
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {videoList.map((video) => (
                    <div 
                      key={video.id} 
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                      onClick={() => navigate(`/chat/${roomId}?video=${video.id}`)}
                    >
                      <div className="flex gap-3">
                        <div className="relative">
                          <img 
                            src={video.thumbnail} 
                            alt="썸네일" 
                            className="w-24 h-16 object-cover rounded-lg" 
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">▶</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm leading-5 line-clamp-2 mb-1">
                            {video.title}
                          </h3>
                          <p className="text-xs text-gray-500 mb-1">{video.channel}</p>
                          <p className="text-xs text-gray-400">등록: {video.registeredBy?.split('@')[0]}</p>
                        </div>
                        <div className="flex flex-col justify-center">
                          {certifiedIds.includes(video.id) ? (
                            <div className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                              ✅ 완료
                            </div>
                          ) : (
                            <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                              시청하기
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // 영상 등록 탭
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="text-4xl mb-3">📹</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">새 영상 등록</h3>
                <p className="text-gray-500 text-sm">YouTube 링크를 입력하여 영상을 등록하세요</p>
              </div>

              {/* URL 입력 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  YouTube URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    disabled={videoLoading}
                  />
                  <button
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={handleVideoCheck}
                    disabled={videoLoading || !videoUrl.trim()}
                  >
                    {videoLoading ? "확인중..." : "확인"}
                  </button>
                </div>
                {videoMsg && (
                  <p className={`text-sm ${videoMsg.includes("성공") ? "text-green-600" : "text-red-600"}`}>
                    {videoMsg}
                  </p>
                )}
              </div>

              {/* 영상 미리보기 */}
              {videoMeta && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-800 mb-3">영상 미리보기</h4>
                  <div className="flex gap-3 mb-4">
                    <img 
                      src={videoMeta.thumbnail} 
                      alt="썸네일" 
                      className="w-32 h-20 object-cover rounded-lg" 
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm text-gray-900 leading-5 mb-1">
                        {videoMeta.title}
                      </h5>
                      <p className="text-xs text-gray-600 mb-1">{videoMeta.channel}</p>
                      <p className="text-xs text-gray-500">
                        길이: {Math.floor(videoMeta.duration / 60)}분 {videoMeta.duration % 60}초
                      </p>
                    </div>
                  </div>
                  <button
                    className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={handleVideoRegister}
                    disabled={videoLoading}
                  >
                    {videoLoading ? "등록 중..." : "영상 등록하기"}
                  </button>
                </div>
              )}

              {/* 도움말 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-2">💡 이용 안내</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• YouTube 영상 URL을 복사하여 붙여넣으세요</li>
                  <li>• 등록된 영상은 채팅방 멤버들과 함께 시청할 수 있어요</li>
                  <li>• 시청 완료 시 인증 포인트를 받을 수 있습니다</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoListPage;

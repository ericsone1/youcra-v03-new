import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";

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
  const [videoListState, setVideoListState] = useState([]);
  const [certifiedIds, setCertifiedIds] = useState([]);
  
  // 방장 권한 관련
  const [isOwner, setIsOwner] = useState(false);
  const [roomData, setRoomData] = useState(null);
  
  // 드래그 앤 드롭 관련
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  
  // 영상 등록 관련
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");

  // 방장 권한 확인
  useEffect(() => {
    const checkOwnership = async () => {
      if (!roomId || !auth.currentUser) return;
      
      try {
        const roomRef = doc(db, "chatRooms", roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (roomSnap.exists()) {
          const data = roomSnap.data();
          setRoomData(data);
          const ownerCheck = data.createdBy === auth.currentUser.uid || data.createdByEmail === auth.currentUser.email;
          setIsOwner(ownerCheck);
        }
      } catch (error) {
        console.error("방장 권한 확인 오류:", error);
      }
    };
    
    checkOwnership();
  }, [roomId]);

  // 영상 리스트 불러오기
  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVideoList(list);
      setVideoListState(list);
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

  // 영상 삭제 (방장만 가능)
  const handleDeleteVideo = async (videoId, videoTitle) => {
    if (!isOwner) return;
    
    if (!window.confirm(`"${videoTitle}" 영상을 삭제하시겠습니까?`)) return;
    
    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "videos", videoId));
    } catch (error) {
      console.error("영상 삭제 오류:", error);
      alert("영상 삭제 중 오류가 발생했습니다.");
    }
  };

  // 드래그 시작
  const handleDragStart = (e, index) => {
    if (!isOwner) return;
    setDraggedIndex(index);
    setDraggedItem(videoListState[index]);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
    
    // 드래그 이미지 커스터마이징
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = "rotate(5deg)";
    dragImage.style.opacity = "0.8";
    dragImage.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
    dragImage.style.borderRadius = "12px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.target.offsetWidth / 2, e.target.offsetHeight / 2);
    
    // 원본 요소 스타일링
    e.target.style.transform = "scale(0.95)";
    e.target.style.opacity = "0.7";
    e.target.style.transition = "all 0.2s ease";
    
    // 임시 드래그 이미지 제거
    setTimeout(() => {
      if (dragImage.parentNode) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  // 드래그 오버
  const handleDragOver = (e, index) => {
    if (!isOwner) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  // 드래그 리브
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // 드래그 종료
  const handleDragEnd = (e) => {
    e.target.style.transform = "scale(1)";
    e.target.style.opacity = "1";
    e.target.style.transition = "all 0.3s ease";
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setDraggedItem(null);
  };

  // 드롭 처리
  const handleDrop = async (e, dropIndex) => {
    if (!isOwner || draggedIndex === null) return;
    
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setIsDragging(false);
      setDraggedItem(null);
      return;
    }

    // 드롭 애니메이션을 위한 임시 상태
    const newList = [...videoListState];
    const draggedVideo = newList[draggedIndex];
    
    // 배열에서 드래그된 아이템 제거
    newList.splice(draggedIndex, 1);
    // 새 위치에 삽입
    newList.splice(dropIndex, 0, draggedVideo);
    
    // 애니메이션과 함께 상태 업데이트
    setVideoListState(newList);
    setDraggedIndex(null);
    setIsDragging(false);
    setDraggedItem(null);

    // Firestore에서 순서 업데이트
    try {
      const updates = newList.map((video, index) => {
        const timestamp = new Date(Date.now() - index * 1000); // 역순으로 timestamp 생성
        return setDoc(doc(db, "chatRooms", roomId, "videos", video.id), {
          registeredAt: timestamp
        }, { merge: true });
      });
      
      await Promise.all(updates);
    } catch (error) {
      console.error("영상 순서 변경 오류:", error);
      alert("영상 순서 변경 중 오류가 발생했습니다.");
      // 실패 시 원래 상태로 복원
      setVideoListState(videoList);
    }
  };

  return (
    <>
      {/* 드래그 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes dragPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes dropZone {
          0%, 100% { 
            border-color: #3b82f6;
            background-color: rgb(239 246 255);
          }
          50% { 
            border-color: #1d4ed8;
            background-color: rgb(219 234 254);
          }
        }
        
        .drag-over {
          animation: dropZone 1s ease-in-out infinite;
        }
        
        .drag-item {
          animation: dragPulse 0.5s ease-in-out;
        }
        
        .smooth-reorder {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      
      <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 유크라 스타일 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex-shrink-0 flex items-center justify-between px-4 py-3 border-b z-30 bg-rose-100">
        <button 
          onClick={() => navigate(-1)} 
          className="text-2xl text-gray-600 hover:text-blue-600"
          aria-label="뒤로가기"
        >
          ←
        </button>
                 <div className="flex-1 text-center">
           <div className="font-bold text-lg">🎬 콘텐츠 시청리스트</div>
           <div className="text-xs text-gray-600">영상 등록 및 시청하기</div>
         </div>
        <button
          onClick={() => navigate(`/chat/${roomId}`)}
          className="text-2xl text-gray-600 hover:text-blue-600"
          aria-label="닫기"
        >
          ×
        </button>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-20" style={{ paddingTop: '80px' }}>
        {/* 탭 네비게이션 */}
        <div className="flex bg-gray-50 border-b sticky top-0 z-20">
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
                  {/* 방장용 안내 메시지 */}
                  {isOwner && videoList.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">👑</span>
                        <span className="text-sm font-medium text-blue-800">방장 전용 기능</span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        영상을 길게 눌러서 드래그하여 순서를 변경할 수 있습니다. 모든 영상의 삭제가 가능합니다.
                      </p>
                    </div>
                  )}
                  
                  {/* 일반 사용자용 안내 메시지 */}
                  {!isOwner && videoList.length > 0 && videoList.some(v => v.registeredBy === auth.currentUser?.email) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">📹</span>
                        <span className="text-sm font-medium text-green-800">내가 등록한 영상</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        자신이 등록한 영상은 삭제할 수 있습니다.
                      </p>
                    </div>
                  )}
                  
                  {videoListState.map((video, idx) => (
                    <div 
                      key={video.id} 
                      className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-300 ease-in-out transform ${
                        isOwner ? 'cursor-move hover:shadow-lg' : 'hover:shadow-md'
                      } ${
                        dragOverIndex === idx ? 'drag-over scale-105 shadow-lg border-blue-400' : ''
                      } ${
                        draggedIndex === idx ? 'opacity-50 scale-95 rotate-2 drag-item' : 'hover:scale-[1.02]'
                      } ${
                        isDragging && draggedIndex !== idx ? 'smooth-reorder' : ''
                      }`}
                      draggable={isOwner}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, idx)}
                      style={{
                        // 드래그 중일 때 다른 아이템들이 부드럽게 이동하는 효과
                        transform: isDragging && draggedIndex !== idx && dragOverIndex !== null 
                          ? (idx < dragOverIndex && idx >= draggedIndex) || (idx > dragOverIndex && idx <= draggedIndex)
                            ? 'translateY(-4px)' 
                            : 'translateY(0)'
                          : undefined
                      }}
                    >
                      <div className="flex gap-3">
                        <div 
                          className="relative cursor-pointer"
                          onClick={() => navigate(`/chat/${roomId}?video=${video.id}`)}
                        >
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
                        
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => navigate(`/chat/${roomId}?video=${video.id}`)}
                        >
                          <h3 className="font-medium text-gray-900 text-sm leading-5 line-clamp-2 mb-1">
                            {video.title}
                          </h3>
                          <p className="text-xs text-gray-500 mb-1">{video.channel}</p>
                          <p className="text-xs text-gray-400">등록: {video.registeredBy?.split('@')[0]}</p>
                        </div>
                        
                        {/* 우측 버튼 영역 */}
                        <div className="flex flex-col justify-center items-end gap-2">
                          {/* 시청 상태 버튼 */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation(); // 드래그 이벤트 방지
                              navigate(`/chat/${roomId}?video=${video.id}`);
                            }} 
                            className="cursor-pointer"
                          >
                            {certifiedIds.includes(video.id) ? (
                              <div className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-medium text-center">
                                ✅ 완료
                              </div>
                            ) : (
                              <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full font-medium text-center">
                                시청하기
                              </div>
                            )}
                          </div>
                          
                          {/* 삭제 버튼 - 방장은 모든 영상, 일반 유저는 자신의 영상만 */}
                          {(isOwner || video.registeredBy === auth.currentUser?.email) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // 드래그 이벤트 방지
                                handleDeleteVideo(video.id, video.title);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-full font-medium text-center transition-colors shadow-md hover:shadow-lg"
                              title="영상 삭제"
                            >
                              삭제하기
                            </button>
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
      </main>

      {/* 하단 여백 - 모바일 네비게이션 공간 확보 */}
      <div style={{ height: '72px' }}></div>
      </div>
    </>
  );
}

export default VideoListPage;

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
// import Picker from '@emoji-mart/react';
// import data from '@emoji-mart/data';
import YouTube from 'react-youtube';
import Modal from "react-modal";

const MAX_LENGTH = 200;

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0") +
    " " +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0")
  );
}

function renderMessageWithPreview(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const lines = text.split("\n");
  const elements = [];
  lines.forEach((line, idx) => {
    const parts = line.split(urlRegex);
    parts.forEach((part, i) => {
      if (urlRegex.test(part)) {
        const ytMatch = part.match(youtubeRegex);
        if (ytMatch) {
          const videoId = ytMatch[1];
          elements.push(
            <a
              key={`link-${idx}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {part}
            </a>
          );
          elements.push(
            <div key={`yt-${idx}-${i}`} className="my-2">
              <iframe
                width="320"
                height="180"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded"
              ></iframe>
            </div>
          );
        } else {
          elements.push(
            <a
              key={`link-${idx}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {part}
            </a>
          );
        }
      } else {
        elements.push(
          <React.Fragment key={`txt-${idx}-${i}`}>{part}</React.Fragment>
        );
      }
    });
    if (idx !== lines.length - 1) elements.push(<br key={`br-${idx}`} />);
  });
  return elements;
}

function getYoutubeId(url) {
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

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

function getYoutubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [participants, setParticipants] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // 영상 관련 상태
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");
  const [videoList, setVideoList] = useState([]);
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(null);
  const [isCertified, setIsCertified] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [certifiedVideoIds, setCertifiedVideoIds] = useState([]);
  const [popupPos, setPopupPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const playerRef = useRef(null);
  const autoNextTimer = useRef(null);
  const [showDelete, setShowDelete] = useState(null);
  const longPressTimer = useRef(null);
  const [countdown, setCountdown] = useState(5);
  const [showVideoPanel, setShowVideoPanel] = useState(false);

  // 비로그인 접근 제한
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        alert("로그인 후 이용 가능합니다.");
        navigate("/");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 채팅방 이름 불러오기
  useEffect(() => {
    if (loading) return;
    const unsub = onSnapshot(doc(db, "chatRooms", roomId), (docSnap) => {
      if (docSnap.exists()) {
        setRoomName(docSnap.data().name);
      }
    });
    return () => unsub && unsub();
  }, [roomId, loading]);

  // 메시지 실시간 구독
  useEffect(() => {
    if (loading) return;
    const q = query(
      collection(db, "chatRooms", roomId, "messages"),
      orderBy("createdAt")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsub && unsub();
  }, [roomId, loading]);

  // 실시간 참여자 관리
  useEffect(() => {
    if (loading || !auth.currentUser) return;
    const user = auth.currentUser;
    const participantRef = doc(db, "chatRooms", roomId, "participants", user.uid);

    setDoc(participantRef, {
      email: user.email,
      joinedAt: serverTimestamp(),
    });

    const unsub = onSnapshot(
      collection(db, "chatRooms", roomId, "participants"),
      (snapshot) => {
        setParticipants(snapshot.docs.map((doc) => doc.data().email));
      }
    );

    return () => {
      deleteDoc(participantRef);
      unsub();
    };
  }, [roomId, loading]);

  // 영상 리스트 실시간 구독
  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setVideoList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [roomId]);

  // 내가 인증한 영상 id 리스트 구독
  useEffect(() => {
    if (!roomId || !auth.currentUser) return;
    if (videoList.length === 0) {
      setCertifiedVideoIds([]);
      return;
    }
    const unsubscribes = videoList.map((video) => {
      const q = collection(db, "chatRooms", roomId, "videos", video.id, "certifications");
      return onSnapshot(q, (snapshot) => {
        const found = snapshot.docs.find(
          (doc) => doc.data().uid === auth.currentUser.uid
        );
        setCertifiedVideoIds((prev) => {
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
  }, [roomId, videoList, auth.currentUser]);

  // 팝업 플레이어 인증 상태
  useEffect(() => {
    setIsCertified(false);
    setWatchSeconds(0);
    setVideoEnded(false);
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
    }
  }, [selectedVideoIdx]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [messages, loading, error]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading, messages, error]);

  // 메시지 전송
  const handleSend = async (e) => {
    e.preventDefault();
    if (sending) return;
    if (!newMsg.trim()) {
      setError("메시지를 입력하세요!");
      return;
    }
    if (newMsg.length > MAX_LENGTH) {
      setError(`메시지는 ${MAX_LENGTH}자 이내로 입력하세요.`);
      return;
    }
    setError("");
    setSending(true);
    try {
      await addDoc(collection(db, "chatRooms", roomId, "messages"), {
        text: newMsg,
        email: auth.currentUser.email,
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        photoURL: auth.currentUser.photoURL || "",
      });
      setNewMsg("");
    } catch (err) {
      setError("메시지 전송 중 오류가 발생했습니다.");
    }
    setSending(false);
  };

  // 메시지 삭제(길게 눌러야)
  const handleDelete = async (msgId) => {
    if (window.confirm("정말 이 메시지를 삭제할까요?")) {
      await deleteDoc(doc(db, "chatRooms", roomId, "messages", msgId));
      setShowDelete(null);
    }
  };

  // 길게 누르기 핸들러
  const handlePointerDown = (msgId) => {
    longPressTimer.current = setTimeout(() => setShowDelete(msgId), 700);
  };
  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleBack = () => {
    navigate("/chat");
  };

  const myUid = auth.currentUser?.uid;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleChange = (e) => {
    if (e.target.value.length <= MAX_LENGTH) {
      setNewMsg(e.target.value);
    } else {
      setNewMsg(e.target.value.slice(0, MAX_LENGTH));
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (newMsg.length + emoji.native.length > MAX_LENGTH) return;
    setNewMsg((prev) => prev + emoji.native);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  // 영상 등록 체크
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
    if (!videoMeta) return;
    setVideoLoading(true);
    await addDoc(collection(db, "chatRooms", roomId, "videos"), {
      ...videoMeta,
      registeredBy: auth.currentUser?.uid || "anonymous",
      registeredAt: serverTimestamp(),
    });
    setVideoMsg("영상이 등록되었습니다!");
    setVideoUrl("");
    setVideoMeta(null);
    setVideoLoading(false);
  };

  // 드래그 핸들러
  const handleDragStart = (e) => {
    setDragging(true);
    const startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const startY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    dragOffset.current = {
      x: startX - popupPos.x,
      y: startY - popupPos.y,
    };
  };
  const handleDrag = (e) => {
    if (!dragging) return;
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    setPopupPos({
      x: clientX - dragOffset.current.x,
      y: clientY - dragOffset.current.y,
    });
  };
  const handleDragEnd = () => {
    setDragging(false);
  };

  // 유튜브 플레이어 핸들러
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    setWatchSeconds(0);
    setVideoEnded(false);
  };
  const handleYoutubeStateChange = (event) => {
    if (event.data === 1) {
      if (!playerRef.current._interval) {
        playerRef.current._interval = setInterval(() => {
          setWatchSeconds((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (playerRef.current && playerRef.current._interval) {
        clearInterval(playerRef.current._interval);
        playerRef.current._interval = null;
      }
    }
  };
  const handleYoutubeEnd = () => {
    setVideoEnded(true);
  };

  // 인증 핸들러
  const handleCertify = async () => {
    setCertLoading(true);
    const video = videoList[selectedVideoIdx];
    await addDoc(
      collection(db, "chatRooms", roomId, "videos", video.id, "certifications"),
      {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        certifiedAt: serverTimestamp(),
      }
    );
    setIsCertified(true);
    setCertLoading(false);
  };

  // certAvailable 선언 (홈탭과 동일한 90% 시청 조건으로 수정)
  let certAvailable = false;
  if (
    selectedVideoIdx !== null &&
    videoList[selectedVideoIdx] &&
    typeof videoList[selectedVideoIdx].duration === "number"
  ) {
    const videoDuration = videoList[selectedVideoIdx].duration;
    // 홈탭과 동일: 90% 시청 시 인증 가능
    const progressRate = videoDuration > 0 ? (watchSeconds / videoDuration) : 0;
    certAvailable = progressRate >= 0.9 || videoEnded;
  }
  
  // 홈탭과 동일한 자동 다음 영상 이동 로직
  useEffect(() => {
    if (certAvailable && selectedVideoIdx < videoList.length - 1) {
      const timer = setTimeout(() => {
        console.log('🎬 90% 시청 완료, 다음 영상으로 자동 이동');
        setSelectedVideoIdx(selectedVideoIdx + 1);
        setWatchSeconds(0);
        setVideoEnded(false);
      }, 3000); // 3초 후 자동 이동
      
      return () => clearTimeout(timer);
    }
  }, [certAvailable, selectedVideoIdx, videoList.length]);

  // 카운트다운 자동 이동 useEffect
  useEffect(() => {
    if (certAvailable && !isCertified && !certLoading) {
      setCountdown(5);
      autoNextTimer.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(autoNextTimer.current);
            if (selectedVideoIdx < videoList.length - 1) {
              setSelectedVideoIdx(selectedVideoIdx + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(autoNextTimer.current);
      setCountdown(5);
    }
    return () => clearInterval(autoNextTimer.current);
  }, [certAvailable, isCertified, certLoading, selectedVideoIdx, videoList.length]);

  // ---------------------- return문 시작 ----------------------
  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow">
        <button onClick={handleBack} className="text-blue-500 font-bold">← 뒤로</button>
        <div className="font-bold text-lg">{roomName || "채팅방"}</div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">{participants.length}명 참여중</div>
          <button
            className="ml-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            onClick={() => setShowVideoPanel(true)}
          >
            영상시청
          </button>
        </div>
      </div>

      {/* 채팅 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 py-2" style={{ minHeight: 0 }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 mb-2 ${msg.uid === myUid ? "justify-end" : ""}`}
            onPointerDown={() => handlePointerDown(msg.id)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {msg.uid !== myUid && (
              <img
                src={msg.photoURL || "https://i.pravatar.cc/40?u=" + msg.email}
                alt="profile"
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="bg-white rounded-lg px-3 py-2 shadow max-w-xs break-words">
              <div className="text-xs text-gray-500 mb-1">{msg.email}</div>
              <div>{renderMessageWithPreview(msg.text)}</div>
              <div className="text-xs text-gray-400 mt-1">{formatTime(msg.createdAt)}</div>
            </div>
            {msg.uid === myUid && (
              <img
                src={msg.photoURL || "https://i.pravatar.cc/40?u=" + msg.email}
                alt="profile"
                className="w-8 h-8 rounded-full"
              />
            )}
            {showDelete === msg.id && (
              <button
                className="ml-2 text-red-500 text-xs"
                onClick={() => handleDelete(msg.id)}
              >
                삭제
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <form
        className="flex items-center gap-2 px-4 py-2 bg-white"
        onSubmit={handleSend}
      >
        <button
          type="button"
          className="text-2xl"
          onClick={() => setShowEmoji((v) => !v)}
        >
          😊
        </button>
        {/* {showEmoji && (
          <div className="absolute bottom-16 left-4 z-50">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
          </div>
        )} */}
        <textarea
          ref={inputRef}
          className="flex-1 border rounded px-2 py-1 resize-none"
          rows={1}
          value={newMsg}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          placeholder="메시지 입력"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={sending}
        >
          전송
        </button>
      </form>

      {/* 영상 리스트/등록 모달 */}
      <Modal
        isOpen={showVideoPanel}
        onRequestClose={() => setShowVideoPanel(false)}
        className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-lg z-50 p-4 overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-40"
        ariaHideApp={false}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">시청 영상 리스트</h2>
          <button onClick={() => setShowVideoPanel(false)} className="text-2xl text-gray-400 hover:text-gray-700">✕</button>
        </div>
        {/* 영상 등록 폼 */}
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
        {/* 영상 리스트 */}
        {videoList.length === 0 && (
          <div className="text-sm text-gray-500">아직 등록된 영상이 없습니다.</div>
        )}
        <div className="flex flex-col gap-4">
          {videoList.map((video, idx) => (
            <div
              key={video.id}
              className={`border rounded-lg p-2 bg-white shadow flex items-center gap-4 relative`}
            >
              <img src={video.thumbnail} alt="썸네일" className="w-32 h-20 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base truncate">{video.title}</div>
                <div className="text-xs text-gray-500">{video.channel}</div>
                <div className="text-xs text-gray-400">등록자: {video.registeredBy}</div>
              </div>
              {certifiedVideoIds.includes(video.id) ? (
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded font-bold cursor-default"
                  disabled
                >
                  시청 완료
                </button>
              ) : (
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded font-bold"
                  onClick={() => setSelectedVideoIdx(idx)}
                >
                  시청하기
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* 드래그 가능한 영상 팝업 플레이어 */}
      {selectedVideoIdx !== null && videoList[selectedVideoIdx] && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg p-4"
          style={{
            top: popupPos.y,
            left: popupPos.x,
            width: 380,
            maxWidth: '90vw',
            cursor: dragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
            onClick={() => setSelectedVideoIdx(null)}
            style={{ position: 'absolute', top: 8, right: 8 }}
          >
            ✕
          </button>
          <h4 className="font-bold mb-2 line-clamp-2 break-words" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{videoList[selectedVideoIdx].title}</h4>
          <YouTube
            videoId={videoList[selectedVideoIdx].videoId}
            opts={{
              width: "340",
              height: "200",
              playerVars: { autoplay: 1 },
            }}
            onReady={handleYoutubeReady}
            onStateChange={handleYoutubeStateChange}
            onEnd={handleYoutubeEnd}
          />
          <div className="mb-2 text-sm text-gray-600">
            {videoList[selectedVideoIdx]?.duration >= 180
              ? certAvailable
                ? "3분 이상 시청 완료! 인증 가능"
                : `시청 시간: ${watchSeconds}초 (3분 이상 시 인증 가능)`
              : certAvailable
                ? "영상 끝까지 시청 완료! 인증 가능"
                : "영상 끝까지 시청해야 인증 가능"}
          </div>
          <button
            className={`w-full py-2 rounded font-bold ${
              certAvailable && !certLoading
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-300 text-gray-500"
            }`}
            disabled={!certAvailable || certLoading}
            onClick={handleCertify}
          >
            {certAvailable
              ? (certLoading ? "인증 중..." : (videoList[selectedVideoIdx]?.duration >= 180 ? "3분 이상 인증완료" : "영상 끝 인증완료"))
              : (videoList[selectedVideoIdx]?.duration >= 180 ? "3분 이상 시청해야 인증 가능" : "영상 끝까지 시청해야 인증 가능")}
          </button>
          {certAvailable && selectedVideoIdx < videoList.length - 1 && (
            <div className="mt-2 text-xs text-blue-500">
              {countdown}초 후 다음 영상으로 자동 이동합니다.
            </div>
          )}
          <div className="flex items-center gap-4 mt-4">
            <a
              href={getYoutubeUrl(videoList[selectedVideoIdx].videoId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-red-500 font-bold underline"
              title="유튜브에서 좋아요/댓글 남기기"
            >
              👍 좋아요 / 💬 댓글 (유튜브로 이동)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRoom;
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
  getDoc,
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
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const [userNickMap, setUserNickMap] = useState({});

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

  // 메시지 실시간 구독 + 닉네임 매핑
  useEffect(() => {
    if (loading) return;
    const q = query(
      collection(db, "chatRooms", roomId, "messages"),
      orderBy("createdAt")
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      // 닉네임 매핑
      const uids = Array.from(new Set(msgs.map((m) => m.uid).filter(Boolean)));
      const nickMap = {};
      await Promise.all(
        uids.map(async (uid) => {
          if (!userNickMap[uid]) {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              nickMap[uid] = userDoc.data().nickname || userDoc.data().email?.split("@")[0] || "익명";
            } else {
              nickMap[uid] = "익명";
            }
          } else {
            nickMap[uid] = userNickMap[uid];
          }
        })
      );
      setUserNickMap((prev) => ({ ...prev, ...nickMap }));
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
  const myEmail = auth.currentUser?.email;
  // 방장 이메일(예시: participants[0]이 방장)
  const ownerEmail = participants[0];
  const isOwner = myEmail && ownerEmail && myEmail === ownerEmail;

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

  // certAvailable 선언 (return문 바로 위)
  let certAvailable = false;
  if (
    selectedVideoIdx !== null &&
    videoList[selectedVideoIdx] &&
    typeof videoList[selectedVideoIdx].duration === "number"
  ) {
    certAvailable =
      videoList[selectedVideoIdx].duration >= 180
        ? watchSeconds >= 180
        : videoEnded;
  }

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

  useEffect(() => {
    // 채팅방 진입 시 body, html 스크롤 막기
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';
    return () => {
      // 채팅방 나갈 때 원복
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, []);

  // ---------------------- return문 시작 ----------------------
  return (
    <div className="flex flex-col bg-blue-50" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 상단바 (56px) - 항상 상단 고정 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: 56, zIndex: 200 }}>
        <button onClick={handleBack} className="text-2xl text-gray-600 hover:text-blue-600 mr-2" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center font-bold text-lg text-gray-800 truncate">{roomName || "맞구톡방입니다."}</div>
        <div className="flex items-center gap-2 ml-2">
          <button className="text-xl text-gray-500 hover:text-blue-500" aria-label="검색"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" /></svg></button>
          <button className="text-xl text-gray-500 hover:text-blue-500" aria-label="메뉴" onClick={() => setShowInfoPanel(true)}><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
        </div>
      </div>
      {/* 플레이어 상단 고정 */}
      {selectedVideoIdx !== null && videoList[selectedVideoIdx] && (
        <div className="w-full bg-white shadow z-20 sticky top-0 left-0 flex flex-col items-center" style={{ position: 'relative' }}>
          {/* X버튼을 플레이어 바깥 상단 우측에 flex로 배치 */}
          <div className="w-full flex justify-end items-center" style={{ minHeight: 40 }}>
            <button
              className="text-2xl text-gray-400 hover:text-gray-700 z-30 mr-2 mt-2"
              onClick={() => setSelectedVideoIdx(null)}
              aria-label="플레이어 닫기"
              style={{ background: 'none', border: 'none' }}
            >
              ✕
            </button>
          </div>
          <div className="w-full flex flex-col items-center">
            {/* 반응형 유튜브 플레이어 */}
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <div className="absolute top-0 left-0 w-full h-full">
                <YouTube
                  videoId={videoList[selectedVideoIdx].videoId}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: { autoplay: 1 },
                  }}
                  onReady={handleYoutubeReady}
                  onStateChange={handleYoutubeStateChange}
                  onEnd={handleYoutubeEnd}
                  className="rounded"
                />
              </div>
            </div>
            {/* 제목 - 1줄, 말줄임 처리 */}
            <h4 className="font-bold mt-3 mb-2 w-full text-center truncate" style={{ wordBreak: 'break-all', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={videoList[selectedVideoIdx].title}>
              {videoList[selectedVideoIdx].title}
            </h4>
            {/* 안내 문구 - 버튼 위에 조건에 따라 노출 */}
            <div className="mb-2 text-sm text-gray-600">
              {videoList[selectedVideoIdx]?.duration >= 180
                ? '최소 3분 이상 시청 시 인증 가능'
                : '영상 끝까지 시청 시 인증 가능'}
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
            <div className="flex items-center gap-4 mt-4 mb-4">
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
        </div>
      )}
      {/* 채팅 메시지 리스트 */}
      <div
        className="flex-1 overflow-y-auto px-2 py-2 bg-blue-50"
        style={{
          height: 'calc(100vh - 56px - 60px - 56px)',
          paddingTop: 56, // 상단바 높이만큼 여백 추가
          boxSizing: 'border-box',
        }}
      >
        {messages.map((msg, idx) => {
          const isMine = msg.uid === myUid;
          const showProfile = !isMine && (idx === 0 || messages[idx - 1].uid !== msg.uid);
          const showNickname = !isMine && (idx === 0 || messages[idx - 1].uid !== msg.uid);
          // 날짜 구분선 표시
          const prevDate = idx > 0 ? formatTime(messages[idx - 1].createdAt).slice(0, 10) : null;
          const currDate = formatTime(msg.createdAt).slice(0, 10);
          const showDateDivider = idx === 0 || prevDate !== currDate;
          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className="flex justify-center my-3">
                  <div className="bg-gray-200 text-gray-600 text-xs rounded-xl px-3 py-1 shadow-sm">
                    {currDate.replace(/-/g, ".")} {getDayOfWeek(msg.createdAt)}
                  </div>
                </div>
              )}
              <div
                className={`flex w-full mb-1 ${isMine ? 'justify-end' : 'justify-start'} items-end`}
              >
                {/* 상대방 프로필/닉네임 */}
                {!isMine && showProfile && (
                  <img
                    src={msg.photoURL || `https://i.pravatar.cc/40?u=${msg.email}`}
                    alt="profile"
                    className="w-8 h-8 rounded-full mr-2 border"
                  />
                )}
                <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                  {/* 닉네임 */}
                  {!isMine && showNickname && (
                    <div className="text-xs text-gray-500 mb-1 ml-1">{userNickMap[msg.uid] || msg.email?.split("@")?.[0] || "익명"}</div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl shadow-md break-words whitespace-pre-line ${
                      isMine
                        ? 'bg-yellow-200 text-gray-900 rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md'
                    }`}
                    style={{
                      borderTopLeftRadius: isMine ? 20 : 6,
                      borderTopRightRadius: isMine ? 6 : 20,
                      marginLeft: isMine ? 32 : 0,
                      marginRight: isMine ? 0 : 32,
                      minWidth: 40,
                    }}
                  >
                    <div>{renderMessageWithPreview(msg.text)}</div>
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 ${isMine ? 'text-right' : 'text-left'} px-1`}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
                {/* 내 메시지 프로필 */}
                {isMine && (
                  <img
                    src={msg.photoURL || `https://i.pravatar.cc/40?u=${msg.email}`}
                    alt="profile"
                    className="w-8 h-8 rounded-full ml-2 border"
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* 카카오톡 스타일 입력창 - 푸터 위에 고정 */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          bottom: 60,
          width: '100vw',
          zIndex: 100,
          background: '#fff',
          boxShadow: '0 -2px 12px 0 rgba(0,0,0,0.04)',
          padding: '10px 12px 14px 12px',
          boxSizing: 'border-box',
        }}
      >
        <form
          className="flex items-end gap-2 w-full"
          onSubmit={handleSend}
          style={{ margin: 0 }}
        >
          <button
            type="button"
            className="text-2xl mr-2"
            onClick={() => setShowEmoji((v) => !v)}
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            😊
          </button>
          <div className="flex-1 flex items-center bg-gray-100 rounded-2xl px-3 py-2" style={{ minHeight: 44 }}>
            <textarea
              ref={inputRef}
              className="flex-1 bg-gray-100 border-0 outline-none resize-none text-base"
              rows={1}
              value={newMsg}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              maxLength={MAX_LENGTH}
              placeholder="메시지 입력"
              style={{ background: 'transparent', minHeight: 24, maxHeight: 80 }}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-2xl ml-2 font-bold shadow"
            disabled={sending}
            style={{ minWidth: 56 }}
          >
            전송
          </button>
        </form>
      </div>

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
              className={`border rounded-lg p-2 bg-white shadow flex items-center gap-4 relative cursor-pointer hover:bg-blue-50`}
              onClick={() => {
                setShowVideoPanel(false);
                setSelectedVideoIdx(idx);
              }}
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
                  onClick={e => { e.stopPropagation(); setSelectedVideoIdx(idx); setShowVideoPanel(false); }}
                >
                  시청하기
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* 채팅방 정보 패널 (모달) */}
      {showInfoPanel && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-30">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden animate-slideInUp">
            {/* 상단 */}
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <button onClick={() => setShowInfoPanel(false)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
              <div className="flex-1 text-center font-bold text-lg">채팅방 정보</div>
              <div style={{ width: 32 }} />
            </div>
            {/* 프로필/방이름/참여자 */}
            <div className="flex flex-col items-center py-6">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="방 프로필" className="w-20 h-20 rounded-full mb-2 border-2 border-blue-200" />
              <div className="font-bold text-lg mb-1 flex items-center gap-1">
                {roomName || "방 이름(더미)"}
                {isOwner && <span title="방장" className="ml-1 text-yellow-500 text-xl">👑</span>}
              </div>
              <div className="text-gray-500 text-sm">참여자 {participants.length}명</div>
            </div>
            {/* 메뉴 리스트 */}
            <div className="divide-y flex items-center justify-between px-6 py-4">
              {/* 좌측: 시청리스트 버튼 */}
              {isOwner && (
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-3 rounded hover:bg-blue-600 text-sm"
                  onClick={() => {
                    setShowInfoPanel(false);
                    setShowVideoPanel(true);
                  }}
                >
                  시청리스트
                </button>
              )}
              {/* 우측: 방 관리 버튼 */}
              {isOwner && (
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-3 rounded hover:bg-blue-600 text-sm ml-auto"
                  style={{ minWidth: 0 }}
                  onClick={() => {
                    setShowInfoPanel(false);
                    navigate(`/chat/${roomId}/manage`);
                  }}
                >
                  방 관리
                </button>
              )}
            </div>
            <div className="divide-y">
              <MenuItem icon="📢" label="공지" />
              <MenuItem icon="🗳️" label="투표" />
              <MenuItem icon="🤖" label="챗봇" />
              <MenuItem icon="🖼️" label="사진/동영상" />
              <MenuItem icon="🎬" label="시청하기" onClick={() => { setShowInfoPanel(false); setShowVideoPanel(true); }} />
              <MenuItem icon="📁" label="파일" />
              <MenuItem icon="🔗" label="링크" />
              <MenuItem icon="📅" label="일정" />
              <MenuItem icon="👥" label="대화상대" />
            </div>
            <div className="p-4 flex flex-col gap-2">
              <button onClick={() => setShowInfoPanel(false)} className="w-full text-blue-600 font-bold py-2 rounded hover:bg-blue-50">💬 채팅방으로 돌아가기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 메뉴 아이템 컴포넌트
function MenuItem({ icon, label, onClick }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 hover:bg-blue-50 cursor-pointer" onClick={onClick}>
      <span className="text-xl w-7 text-center">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </div>
  );
}

// 날짜 요일 반환 함수 추가
function getDayOfWeek(ts) {
  if (!ts) return '';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()] + '요일';
}

export default ChatRoom;
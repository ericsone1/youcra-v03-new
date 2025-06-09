import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { auth, db, storage } from "../firebase";
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
  getDocs,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
  const location = useLocation();
  
  // === 기본 채팅 관련 State ===
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [participants, setParticipants] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userNickMap, setUserNickMap] = useState({});
  const [myJoinedAt, setMyJoinedAt] = useState(null);
  
  // === 채팅방 정보 관련 State ===
  const [roomData, setRoomData] = useState(null);
  const [roomLiked, setRoomLiked] = useState(false);
  const [roomLikesCount, setRoomLikesCount] = useState(0);
  
  // === 영상 관련 State ===
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");
  const [videoList, setVideoList] = useState([]);
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(null);
  const [isCertified, setIsCertified] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [certifiedVideoIds, setCertifiedVideoIds] = useState([]);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [actualWatchSeconds, setActualWatchSeconds] = useState(0);
  const [lastPlayerTime, setLastPlayerTime] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [endCountdown, setEndCountdown] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [watching, setWatching] = useState(0);
  
  // === UI 관련 State ===
  const [popupPos, setPopupPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(null);
  const [playerHovered, setPlayerHovered] = useState(false);
  
  // === Refs ===
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const playerRef = useRef(null);
  const autoNextTimer = useRef(null);
  const longPressTimer = useRef(null);
  const endTimer = useRef(null);

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

  // 참여자 joinedAt 읽기
  useEffect(() => {
    if (!roomId || !auth.currentUser) return;
    const participantRef = doc(db, "chatRooms", roomId, "participants", auth.currentUser.uid);
    getDoc(participantRef).then(docSnap => {
      if (docSnap.exists()) {
        setMyJoinedAt(docSnap.data().joinedAt || null);
      }
    });
  }, [roomId, auth.currentUser]);

  // 현재 사용자 닉네임 가져오기
  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchCurrentUserNick = async () => {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const nickname = userDoc.data().nickname || auth.currentUser.email?.split("@")[0] || "나";
        setUserNickMap(prev => ({
          ...prev,
          [auth.currentUser.uid]: nickname
        }));
      }
    };
    fetchCurrentUserNick();
  }, [auth.currentUser]);

  // 메시지 실시간 구독 + 닉네임 매핑 (joinedAt 이후 메시지만) - 성능 최적화
  useEffect(() => {
    if (loading) return;

    // 최초 입장 시간 저장
    const initialJoinTime = myJoinedAt?.seconds;

    const q = query(
      collection(db, "chatRooms", roomId, "messages"),
      orderBy("createdAt")
    );
    
    const unsub = onSnapshot(q, async (snapshot) => {
      let msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // 최초 입장 시에만 메시지 필터링 적용
      if (initialJoinTime && messages.length === 0) {
        msgs = msgs.filter(msg => msg.createdAt && msg.createdAt.seconds >= initialJoinTime);
      }
      
      setMessages(msgs);
      
      // 닉네임 매핑 - 성능 최적화: 이미 매핑된 유저는 제외
      const uids = Array.from(new Set(msgs.map((m) => m.uid).filter(Boolean)));
      
      // 현재 userNickMap 상태를 가져와서 체크
      setUserNickMap((currentNickMap) => {
        const unMappedUids = uids.filter(uid => !currentNickMap[uid]);
        
        if (unMappedUids.length > 0) {
          // 비동기로 닉네임 매핑 처리
          Promise.all(
            unMappedUids.map(async (uid) => {
              try {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists()) {
                  return {
                    uid,
                    nickname: userDoc.data().nickname || userDoc.data().email?.split("@")[0] || "익명"
                  };
                } else {
                  return { uid, nickname: "익명" };
                }
              } catch (error) {
                console.error("닉네임 조회 오류:", error);
                return { uid, nickname: "익명" };
              }
            })
          ).then(results => {
            const nickMap = {};
            results.forEach(({ uid, nickname }) => {
              nickMap[uid] = nickname;
            });
            setUserNickMap(prev => ({ ...prev, ...nickMap }));
          });
        }
        
        return currentNickMap; // 현재 상태 유지
      });
    });
    
    return () => unsub && unsub();
  }, [roomId, loading, myJoinedAt]); // userNickMap 의존성 제거

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
    setActualWatchSeconds(0);
    setLastPlayerTime(0);
    setVideoEnded(false);
    setMinimized(false);
    setEndCountdown(0);
    
    // 모든 타이머 정리
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
    }
    
    if (autoNextTimer.current) {
      clearInterval(autoNextTimer.current);
      autoNextTimer.current = null;
    }
    
    if (endTimer.current) {
      clearInterval(endTimer.current);
      endTimer.current = null;
    }
  }, [selectedVideoIdx]);

  // 영상 선택 시 좋아요 상태 초기화
  useEffect(() => {
    setLiked(false);
    setLikeCount(0);
    setWatching(Math.floor(Math.random() * 1000) + 100);
  }, [selectedVideoIdx]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [messages, loading, error]);

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
  
  // 방장 확인 로직 - UID 기반으로 올바르게 비교
  const isOwner = roomData && myUid && (
    roomData.createdBy === myUid ||      // UID와 createdBy 비교 (핵심)
    roomData.ownerEmail === myEmail ||   // 이메일 기반 백업
    roomData.creatorEmail === myEmail    // 이메일 기반 백업
  );

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
    // inputRef.current?.focus(); // 키보드 자동 열림 방지를 위해 주석 처리
  };

  // 파일 업로드 함수들 - React 방식으로 개선
  const handleFileSelect = (type) => {
    if (!fileInputRef.current) return;
    
    // 파일 타입에 따른 accept 속성 설정
    switch(type) {
      case 'image':
        fileInputRef.current.accept = 'image/*';
        break;
      case 'video':
        fileInputRef.current.accept = 'video/*';
        break;
      case 'file':
      default:
        fileInputRef.current.accept = '*/*';
        break;
    }
    
    // 파일 타입을 data attribute로 저장
    fileInputRef.current.dataset.fileType = type;
    
    // 이전 선택 초기화 후 클릭
    fileInputRef.current.value = '';
    fileInputRef.current.click();
    setShowUploadMenu(false);
  };

  // 파일 선택 핸들러
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    const fileType = e.target.dataset.fileType || 'file';
    
    if (file) {
      handleFileUpload(file, fileType);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    try {
      // Firebase Storage에 파일 업로드
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `chatrooms/${roomId}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // 메시지로 파일 정보 저장
      await addDoc(collection(db, "chatRooms", roomId, "messages"), {
        fileType: type,
        fileName: file.name,
        fileUrl: downloadURL,
        fileSize: file.size,
        email: auth.currentUser.email,
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        photoURL: auth.currentUser.photoURL || "",
      });
      
    } catch (error) {
      console.error('파일 업로드 중 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 파일 크기를 읽기 쉽게 변환하는 함수
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 메시지 렌더링 함수 수정
  const renderMessage = (msg) => {
    if (msg.fileType) {
      // 파일 메시지 렌더링
      switch (msg.fileType) {
        case 'image':
          return (
            <div className="max-w-xs">
              <img 
                src={msg.fileUrl} 
                alt={msg.fileName}
                className="rounded-lg max-w-full h-auto cursor-pointer"
                onClick={() => window.open(msg.fileUrl, '_blank')}
              />
              <div className="text-xs text-gray-500 mt-1">{msg.fileName}</div>
            </div>
          );
        case 'video':
          return (
            <div className="max-w-xs">
              <video 
                src={msg.fileUrl} 
                controls 
                className="rounded-lg max-w-full h-auto"
                style={{ maxHeight: '200px' }}
              />
              <div className="text-xs text-gray-500 mt-1">{msg.fileName}</div>
            </div>
          );
        case 'file':
        default:
          return (
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg max-w-xs">
              <div className="text-2xl">📎</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{msg.fileName}</div>
                <div className="text-xs text-gray-500">{formatFileSize(msg.fileSize)}</div>
              </div>
              <a 
                href={msg.fileUrl} 
                download={msg.fileName}
                className="text-blue-500 text-sm hover:underline"
              >
                다운로드
              </a>
            </div>
          );
      }
    } else {
      // 텍스트 메시지 렌더링
      return renderMessageWithPreview(msg.text);
    }
  };

  // URL 입력 시 실시간 중복 체크
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!videoUrl) {
        setVideoMsg("");
        return;
      }

      const videoId = getYoutubeId(videoUrl);
      if (!videoId) return;

      try {
        const videosRef = collection(db, "chatRooms", roomId, "videos");
        const duplicateQuery = query(videosRef, where("videoId", "==", videoId));
        const duplicateSnapshot = await getDocs(duplicateQuery);

        if (!duplicateSnapshot.empty) {
          setVideoMsg("이미 등록된 영상입니다.");
        } else {
          setVideoMsg("");
        }
      } catch (error) {
        console.error("중복 체크 중 오류:", error);
      }
    };

    const timeoutId = setTimeout(checkDuplicate, 500); // 디바운스 처리
    return () => clearTimeout(timeoutId);
  }, [videoUrl, roomId]);

  // 영상 등록 체크
  const handleVideoCheck = async () => {
    try {
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
    } catch (error) {
      console.error("영상 확인 중 오류:", error);
      setVideoMsg("영상 확인 중 오류가 발생했습니다.");
      setVideoLoading(false);
    }
  };

  // 영상 등록
  const handleVideoRegister = async () => {
    if (!videoMeta) return;
    
    try {
      setVideoLoading(true);
      const videosRef = collection(db, "chatRooms", roomId, "videos");
      
      await addDoc(videosRef, {
        ...videoMeta,
        registeredBy: auth.currentUser?.uid || "anonymous",
        registeredAt: serverTimestamp(),
      });

      setVideoMsg("영상이 등록되었습니다!");
      setVideoUrl("");
      setVideoMeta(null);
    } catch (error) {
      console.error("영상 등록 중 오류:", error);
      setVideoMsg("영상 등록 중 오류가 발생했습니다.");
    } finally {
      setVideoLoading(false);
    }
  };

  // 드래그 핸들러 - 간단하고 빠른 방식
  const handleDragStart = (e) => {
    setDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragOffset.current = {
      x: clientX - popupPos.x,
      y: clientY - popupPos.y,
    };
  };
  
  const handleDrag = (e) => {
    if (!dragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragOffset.current.x;
    const newY = clientY - dragOffset.current.y;
    
    // 화면 경계 체크
    const maxX = window.innerWidth - (minimized ? 80 : 400);
    const maxY = window.innerHeight - (minimized ? 80 : 500);
    
    setPopupPos({
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(10, Math.min(newY, maxY)),
    });
  };
  
  const handleDragEnd = () => {
    setDragging(false);
  };

  // 유튜브 플레이어 핸들러
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    setWatchSeconds(0);
    setActualWatchSeconds(0);
    setLastPlayerTime(0);
    setVideoEnded(false);
  };
  
  const handleYoutubeStateChange = (event) => {
    // 기존 interval 정리
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
    }

    // 재생 중일 때만 새로운 interval 생성
    if (event.data === 1) { // YT.PlayerState.PLAYING
      playerRef.current._interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          const timeDiff = currentTime - lastPlayerTime;
          
          // 정상적인 재생 (1초 전후 차이)인지 확인
          if (timeDiff >= 0.8 && timeDiff <= 1.5) {
            // 연속 시청으로 인정
            setActualWatchSeconds(prev => prev + 1);
          } else if (Math.abs(timeDiff) > 2) {
            // 시크바 조작 감지 (2초 이상 점프)
            console.log('🔍 시크바 조작 감지:', {
              lastTime: lastPlayerTime,
              currentTime: currentTime,
              diff: timeDiff
            });
          }
          
          setLastPlayerTime(currentTime);
          setWatchSeconds(Math.floor(currentTime));
        } else {
          // 기본 카운터 (플레이어 API 접근 불가 시)
          setWatchSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
  };
  
  const handleYoutubeEnd = () => {
    // 영상 종료 시 interval 정리
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
    }
    
    // 영상 종료 시 videoEnded 상태 설정
    setVideoEnded(true);
    
    // 다음 영상이 있을 때만 카운트다운 시작
    if (selectedVideoIdx < videoList.length - 1) {
      setEndCountdown(3);
      endTimer.current = setInterval(() => {
        setEndCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(endTimer.current);
            setSelectedVideoIdx(selectedVideoIdx + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
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

  // certAvailable 선언 - README 기본 조건에 맞게 단순화
  let certAvailable = false;
  if (
    selectedVideoIdx !== null &&
    videoList[selectedVideoIdx] &&
    typeof videoList[selectedVideoIdx].duration === "number"
  ) {
    certAvailable =
      videoList[selectedVideoIdx].duration >= 180
        ? watchSeconds >= 180  // 3분 이상 영상: 3분 시청
        : videoEnded;          // 3분 미만 영상: 완시청
  }

  // 카운트다운 자동 이동 useEffect
  useEffect(() => {
    const currentVideo = videoList[selectedVideoIdx];
    const isAlreadyCertified = currentVideo && certifiedVideoIds.includes(currentVideo.id);
    
    // 인증 가능하고, 아직 인증하지 않았고, 이미 인증된 영상이 아닐 때만 카운트다운 시작
    if (certAvailable && !isCertified && !certLoading && !isAlreadyCertified) {
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
  }, [certAvailable, isCertified, certLoading, selectedVideoIdx, videoList.length, certifiedVideoIds]);

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

  // 메시지 영역 스크롤 마지막으로 (즉시 이동)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" }); // smooth → instant로 변경
    }
  }, [messages]);

  // 입력창 포커스 시 스크롤 보정 (모바일 대응) - 부드러운 스크롤 제거
  const handleInputFocus = () => {
    // 키보드 자동 열림 방지를 위해 포커스 시 스크롤 동작 제거
    // setTimeout(() => {
    //   if (messagesEndRef.current) {
    //     messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    //   }
    // }, 300);
  };

  // 컴포넌트 언마운트 시 모든 타이머와 리소스 정리
  useEffect(() => {
    return () => {
      // 모든 타이머 정리
      if (playerRef.current && playerRef.current._interval) {
        clearInterval(playerRef.current._interval);
        playerRef.current._interval = null;
      }
      
      if (autoNextTimer.current) {
        clearInterval(autoNextTimer.current);
        autoNextTimer.current = null;
      }
      
      if (endTimer.current) {
        clearInterval(endTimer.current);
        endTimer.current = null;
      }
      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
  }, []);

  // 채팅방 정보 불러오기 (방장 확인용)
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        if (roomDoc.exists()) {
          setRoomData(roomDoc.data());
        }
      } catch (error) {
        console.error("채팅방 정보 불러오기 오류:", error);
      }
    };

    fetchRoomData();
  }, [roomId]);

  // 업로드 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUploadMenu && !event.target.closest('.upload-menu-container')) {
        setShowUploadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUploadMenu]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const videoId = params.get('video');
    console.log('쿼리 videoId:', videoId);
    console.log('videoList:', videoList.map(v => v.id));
    if (videoId && videoList.length > 0) {
      const idx = videoList.findIndex(v => v.id === videoId);
      console.log('찾은 idx:', idx);
      if (idx !== -1) {
        setSelectedVideoIdx(idx);
      }
    }
  }, [location.search, videoList]);

  // 채팅방 좋아요 상태 확인
  useEffect(() => {
    if (!auth.currentUser || !roomId) return;

    const fetchRoomLikes = async () => {
      try {
        // 좋아요 수 가져오기
        const likesQ = query(collection(db, "chatRooms", roomId, "likes"));
        const likesSnap = await getDocs(likesQ);
        setRoomLikesCount(likesSnap.size);

        // 사용자의 좋아요 상태 확인
        const userLikeDoc = await getDoc(doc(db, "chatRooms", roomId, "likes", auth.currentUser.uid));
        setRoomLiked(userLikeDoc.exists());
      } catch (error) {
        console.error("좋아요 상태 확인 오류:", error);
      }
    };

    fetchRoomLikes();
  }, [roomId, auth.currentUser]);

  // 채팅방 좋아요 토글 함수
  const handleRoomLikeToggle = async () => {
    if (!auth.currentUser) {
      alert("로그인 후 좋아요를 누를 수 있습니다.");
      return;
    }

    try {
      const likeDocRef = doc(db, "chatRooms", roomId, "likes", auth.currentUser.uid);
      
      if (roomLiked) {
        // 좋아요 취소
        await deleteDoc(likeDocRef);
        setRoomLiked(false);
        setRoomLikesCount(prev => prev - 1);
      } else {
        // 좋아요 추가
        await setDoc(likeDocRef, {
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || auth.currentUser.email,
          createdAt: new Date()
        });
        setRoomLiked(true);
        setRoomLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 컴포넌트 언마운트 시 스크롤 이벤트 리스너 정리
  useEffect(() => {
    // 메시지가 업데이트되면 스크롤
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [messages, loading, error]);

  // 자동 포커스 제거됨 - 키보드 자동 열림 방지
  // useEffect(() => {
  //   inputRef.current?.focus();
  // }, [loading, messages, error]);

  // ---------------------- return문 시작 ----------------------
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex-shrink-0 flex items-center justify-between px-4 py-3 border-b z-30 bg-rose-100">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center">
          <div className="font-bold text-lg truncate">{roomName}</div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <span>👥 {participants.length}명</span>
            <button
              onClick={handleRoomLikeToggle}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 font-semibold
                ${roomLiked 
                  ? 'bg-red-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500 border border-gray-200'
                }
              `}
            >
              <svg className="w-3 h-3" fill={roomLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {roomLikesCount}
            </button>
          </div>
        </div>
        <button onClick={() => navigate(`/chat/${roomId}/info`)} className="text-4xl text-gray-600 hover:text-blue-600 p-2" aria-label="메뉴">≡</button>
      </header>

      {/* 채팅메시지 패널 */}
      <main className="flex-1 min-h-0 overflow-y-auto px-2 py-3 hide-scrollbar bg-blue-25" style={{
        background: 'linear-gradient(180deg, #f0f9ff 0%, #f8fafc 100%)',
        paddingBottom: 150, // 원래 구조로 되돌리고 적절한 값 설정
        paddingTop: 140,
        position: 'relative',
        zIndex: 10,
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}>
        {messages.map((msg, idx) => {
          const isMine = msg.uid === auth.currentUser?.uid;
          const showDate = idx === 0 || (formatTime(msg.createdAt).slice(0, 10) !== formatTime(messages[idx - 1]?.createdAt).slice(0, 10));
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="text-center text-xs text-gray-400 my-4">
                  {formatTime(msg.createdAt).slice(0, 10)} {getDayOfWeek(msg.createdAt)}
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                {!isMine && (
                  <div className="flex flex-col items-start mr-2">
                    <div className="text-xs text-gray-500 mb-1 ml-2">{userNickMap[msg.uid] || msg.email?.split('@')[0] || '익명'}</div>
                    <button 
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white shadow-md self-end hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => navigate(`/profile/${roomId}/${msg.uid}`)}
                      title={`${userNickMap[msg.uid] || msg.email?.split('@')[0] || '익명'}님의 프로필 보기`}
                    >
                      {(userNickMap[msg.uid] || msg.email?.split('@')[0] || '익명').slice(0, 2).toUpperCase()}
                    </button>
                  </div>
                )}
                <div className={`max-w-[70%] px-3 py-2 rounded-2xl shadow ${isMine ? 'bg-blue-500 text-white text-right' : 'bg-white text-left'} break-words`}>
                  {msg.fileType ? (
                    <div className="text-left">
                      {renderMessage(msg)}
                    </div>
                  ) : (
                    <div className="text-sm">{renderMessageWithPreview(msg.text)}</div>
                  )}
                  <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>{formatTime(msg.createdAt).slice(11, 16)}</div>
                </div>
                {isMine && (
                  <button 
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-medium text-white shadow-md ml-2 self-end hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => navigate('/my')}
                    title="내 프로필 보기"
                  >
                    {(userNickMap[auth.currentUser?.uid] || auth.currentUser?.email?.split('@')[0] || '나').slice(0, 2).toUpperCase()}
                  </button>
                )}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* 메시지 입력창 */}
      <form className="flex items-center px-3 py-3 border-t gap-2 w-full max-w-md mx-auto bg-white" style={{ minHeight: 60, position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 50, boxSizing: 'border-box' }} onSubmit={handleSend}>
        <div className="relative upload-menu-container">
          <button 
            type="button" 
            className="text-xl w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-all duration-200 hover:scale-105 shadow-md" 
            onClick={() => setShowUploadMenu(!showUploadMenu)} 
            aria-label="파일 업로드"
            disabled={uploading}
          >
            {uploading ? "⏳" : "+"}
          </button>
          
          {/* 업로드 메뉴 */}
          {showUploadMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 px-3 py-3 z-50 flex gap-3">
              <button
                type="button"
                className="flex flex-col items-center justify-center w-16 h-16 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-105"
                onClick={() => handleFileSelect('image')}
              >
                <span className="text-2xl mb-1">🖼️</span>
                <span className="text-xs text-gray-600 font-medium">사진</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center justify-center w-16 h-16 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-105"
                onClick={() => handleFileSelect('video')}
              >
                <span className="text-2xl mb-1">🎬</span>
                <span className="text-xs text-gray-600 font-medium">동영상</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center justify-center w-16 h-16 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-105"
                onClick={() => handleFileSelect('file')}
              >
                <span className="text-2xl mb-1">📎</span>
                <span className="text-xs text-gray-600 font-medium">파일</span>
              </button>
            </div>
          )}
          
          {/* 업로드 중 안내 */}
          {uploading && (
            <div className="absolute bottom-full left-0 mb-2 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg">
              📤 파일 업로드 중...
            </div>
          )}
        </div>
        
        <input
          ref={inputRef}
          className="flex-1 border rounded-2xl px-3 py-2 text-base outline-none bg-gray-100 min-w-0"
          value={newMsg}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          placeholder="메시지 입력"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-3 py-2 rounded-2xl font-bold shadow disabled:opacity-50 shrink-0"
          disabled={sending || (!newMsg.trim() && !uploading)}
        >
          전송
        </button>
      </form>

      {/* 푸터(탭 네비게이터) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-around items-center border-t h-16 z-40 bg-white">
        <button className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/')}>🏠<span>홈</span></button>
        <button className="flex flex-col items-center text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/chat')}>💬<span>채팅방</span></button>
        <button className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/board')}>📋<span>게시판</span></button>
        <button className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/my')}>👤<span>마이채널</span></button>
      </nav>

      {/* 드래그 가능한 영상 팝업 플레이어 */}
      {selectedVideoIdx !== null && videoList[selectedVideoIdx] && (
        <div
          className={`fixed z-20 bg-white rounded-xl shadow-lg transition-all duration-300 ${
            minimized ? 'w-16 h-16' : 'w-96 max-w-[90vw]'
          }`}
          style={{
            top: popupPos.y,
            left: popupPos.x,
          }}
        >
          {/* 공통 YouTube 플레이어 - 항상 렌더링 */}
          <div 
            className={`absolute transition-all duration-300 ${
              minimized 
                ? 'hidden'  // 최소화 시 완전히 숨김
                : 'w-full top-12 left-0'
            }`}
            style={{ 
              pointerEvents: minimized ? 'none' : 'auto',
              zIndex: 15  // UI 오버레이보다 높게 설정
            }}
          >
            <YouTube
              key={videoList[selectedVideoIdx].videoId}
              videoId={videoList[selectedVideoIdx].videoId}
              opts={{
                width: '100%',
                height: minimized ? '64' : '200',
                playerVars: { autoplay: 1 }
              }}
              onReady={handleYoutubeReady}
              onStateChange={handleYoutubeStateChange}
              onEnd={handleYoutubeEnd}
              className="rounded"
            />
          </div>

          {/* UI 오버레이 */}
          <div className={`relative z-10 ${minimized ? 'w-full h-full' : 'p-3'}`}>
            {minimized ? (
              // 최소화된 상태 - 깔끔한 아이콘만 (드래그 가능)
              <div 
                className="w-full h-full relative bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center rounded-xl shadow-lg select-none"
                style={{ cursor: dragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDrag}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDrag}
                onTouchEnd={handleDragEnd}
              >
                {/* 영상 아이콘 */}
                <div 
                  className="text-white text-2xl cursor-pointer hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMinimized(false);
                  }}
                  title="영상 플레이어 열기"
                >
                  ▶️
                </div>
                
                {/* 닫기 버튼 */}
                <button
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVideoIdx(null);
                    setMinimized(false);
                    if (playerRef.current && playerRef.current._interval) {
                      clearInterval(playerRef.current._interval);
                      playerRef.current._interval = null;
                    }
                  }}
                  title="닫기"
                >
                  ×
                </button>
                
                {/* 재생 시간 표시 */}
                <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 text-center rounded">
                  {Math.floor(watchSeconds / 60)}:{(watchSeconds % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ) : (
              // 확장된 상태
              <div>
                {/* 상단 헤더 - 드래그 가능 영역 */}
                <div 
                  className="flex justify-between items-center mb-1 p-3 -m-3 rounded-t-xl bg-gray-50 select-none"
                  style={{ cursor: dragging ? 'grabbing' : 'grab' }}
                  onMouseDown={handleDragStart}
                  onMouseMove={handleDrag}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={handleDragStart}
                  onTouchMove={handleDrag}
                  onTouchEnd={handleDragEnd}
                  title="드래그해서 이동"
                >
                  <button
                    className="text-lg text-blue-500 hover:text-blue-700 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMinimized(true);
                    }}
                    title="최소화"
                  >
                    ➖
                  </button>
                  
                  {/* 중앙 드래그 핸들 */}
                  <div className="flex-1 text-center text-xs text-gray-500 font-medium">
                    영상 플레이어 (드래그 가능)
                  </div>
                  
                  <button
                    className="text-xl text-gray-400 hover:text-gray-700 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVideoIdx(null);
                      setMinimized(false);
                      if (playerRef.current && playerRef.current._interval) {
                        clearInterval(playerRef.current._interval);
                        playerRef.current._interval = null;
                      }
                    }}
                    title="닫기"
                  >
                    ×
                  </button>
                </div>
                
                {/* 영상 공간 (YouTube 플레이어가 위에 표시됨) */}
                <div 
                  className="mb-2" 
                  style={{ 
                    height: '200px', 
                    pointerEvents: 'none'  // 이 영역에서 마우스 이벤트를 YouTube 플레이어로 전달
                  }}
                >
                  {/* YouTube 플레이어가 여기 위에 absolute로 위치함 */}
                </div>
                
                {/* 제목 - 일반 텍스트로 변경 */}
                <div className="font-bold text-sm mb-2 px-1 leading-tight" title={videoList[selectedVideoIdx].title}>
                  {videoList[selectedVideoIdx].title}
                </div>
                
                {/* 시청 시간과 인증 정보를 한 줄로 */}
                <div className="flex flex-col gap-1 text-xs text-gray-600 mb-2 px-1">
                  <div className="flex justify-between items-center">
                    <span>
                      현재: {Math.floor(watchSeconds / 60)}:{(watchSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-green-600 font-medium">
                      실제 시청: {Math.floor(actualWatchSeconds / 60)}:{(actualWatchSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="text-center text-blue-600 font-medium">
                    {videoList[selectedVideoIdx]?.duration >= 180
                      ? `연속 3분 시청 시 인증 (${Math.max(0, 180 - watchSeconds)}초 남음)`
                      : `끝까지 시청 시 인증`}
                  </div>
                </div>
                
                {/* 인증 버튼 */}
                <button
                  className={`w-full py-2 mb-2 rounded-lg font-bold text-sm ${
                    certifiedVideoIds.includes(videoList[selectedVideoIdx]?.id)
                      ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                      : certAvailable && !certLoading
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!certifiedVideoIds.includes(videoList[selectedVideoIdx]?.id) && (!certAvailable || certLoading)}
                  onClick={() => {
                    if (certifiedVideoIds.includes(videoList[selectedVideoIdx]?.id)) {
                      // 이미 인증된 영상이면
                      if (selectedVideoIdx < videoList.length - 1) {
                        // 다음 영상이 있으면 이동
                        setSelectedVideoIdx(selectedVideoIdx + 1);
                      } else {
                        // 마지막 영상이면 플레이어 종료
                        setSelectedVideoIdx(null);
                        setMinimized(false);
                        if (playerRef.current && playerRef.current._interval) {
                          clearInterval(playerRef.current._interval);
                          playerRef.current._interval = null;
                        }
                        if (endTimer.current) {
                          clearInterval(endTimer.current);
                          endTimer.current = null;
                        }
                      }
                    } else {
                      // 새로운 영상이면 인증 처리
                      handleCertify();
                    }
                  }}
                >
                  {certifiedVideoIds.includes(videoList[selectedVideoIdx]?.id)
                    ? selectedVideoIdx < videoList.length - 1 
                      ? "✅ 시청인증 완료 (다음 영상 보기)" 
                      : "✅ 시청인증 완료 (마지막 영상)"
                    : certLoading 
                    ? "인증 중..." 
                    : certAvailable 
                    ? "시청인증 완료" 
                    : "시청인증 대기"}
                </button>
                
                {/* 간단한 하단 버튼들 */}
                <div className="flex gap-2 text-xs items-center">
                  {/* YouTube 이동 */}
                  <a
                    href={getYoutubeUrl(videoList[selectedVideoIdx].videoId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                    title="YouTube에 이동"
                  >
                    ⚠️ YouTube에 이동
                  </a>
                  
                  {/* 좋아요 */}
                  <button
                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      if (!liked) {
                        setLiked(true);
                        setLikeCount((prev) => prev + 1);
                      } else {
                        setLiked(false);
                        setLikeCount((prev) => (prev > 0 ? prev - 1 : 0));
                      }
                    }}
                  >
                    <span style={{ color: liked ? '#ec4899' : '#6b7280' }}>
                      {liked ? '♥' : '♡'}
                    </span>
                    <span className="text-gray-600">{likeCount}</span>
                  </button>
                  
                  {/* 시청자수 */}
                  <div className="flex items-center gap-1 px-3 py-2 bg-blue-50 rounded-lg">
                    <span className="text-blue-500">👁️</span>
                    <span className="text-blue-600">{watching}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 사용자 프로필 모달 */}
      {showUserProfile && (
        <UserProfileModal 
          uid={showUserProfile} 
          onClose={() => setShowUserProfile(null)} 
          userNickMap={userNickMap}
        />
      )}

      {/* Hidden file input for React-style file upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept="*/*"
      />
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
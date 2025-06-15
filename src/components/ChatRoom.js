import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, NavLink } from "react-router-dom";
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
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// import Picker from '@emoji-mart/react';
// import data from '@emoji-mart/data';
import YouTube from 'react-youtube';
import Modal from "react-modal";
import { roomIdFromParam, roomPath } from '../utils/route';

const MAX_LENGTH = 200;

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  
  // 날짜 부분
  const dateStr = date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");
  
  // 시간 부분 (12시간 형식 + 오전/오후)
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "오후" : "오전";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0시는 12시로 표시
  const timeStr = ampm + " " + String(hours).padStart(2, "0") + ":" + minutes;
  
  return dateStr + " " + timeStr;
}

// 시간만 반환하는 함수 추가
function formatTimeOnly(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "오후" : "오전";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0시는 12시로 표시
  
  return ampm + " " + String(hours).padStart(2, "0") + ":" + minutes;
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
  const { roomId: rawRoomId } = useParams();
  const roomId = roomIdFromParam(rawRoomId);
  const navigate = useNavigate();
  const location = useLocation();
  
  // === 기본 채팅 관련 State ===
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [participants, setParticipants] = useState([]);
  const [participantUids, setParticipantUids] = useState([]);
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
  const [lastPlayerTime, setLastPlayerTime] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [endCountdown, setEndCountdown] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false); // 채팅방 정보 패널 표시 여부
  
  // === 업로드 관련 State ===
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [dragging, setDragging] = useState(false);
  
  // === 기타 State ===
  const [messageReadStatus, setMessageReadStatus] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로딩 여부
  const [messagesLoaded, setMessagesLoaded] = useState(false); // 메시지 로딩 완료 여부
  
  // === UI 관련 State ===
  const [showUserProfile, setShowUserProfile] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [watching, setWatching] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 100, y: 100 });
  const [showDelete, setShowDelete] = useState(null);
  
  // === Refs ===
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const playerRef = useRef(null);
  const autoNextTimer = useRef(null);
  const longPressTimer = useRef(null);
  const endTimer = useRef(null);
  
  // ADD_MISSING_STATE
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  
  // === 시청인증 설정 State ===
  const [certificationSettings, setCertificationSettings] = useState({
    mode: 'time', // 'time' 또는 'complete'
    requiredTime: 180 // 기본 3분
  });

  // 팝업 최초 열림 감지를 위한 ref (중앙 정렬용)
  const prevSelectedVideoIdx = useRef(null);

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
      orderBy("createdAt"),
      limit(100) // 최근 100개 메시지만 로드
    );
    
    const unsub = onSnapshot(q, async (snapshot) => {
      try {
        let msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // 최초 입장 시에만 메시지 필터링 적용
        if (initialJoinTime && messages.length === 0) {
          msgs = msgs.filter(msg => msg.createdAt && msg.createdAt.seconds >= initialJoinTime);
        }
        
        setMessages(msgs);
      
      // 메시지 로딩 완료 표시 (첫 구독 시에만)
      if (!messagesLoaded) {
        // DOM 업데이트를 위해 약간의 딜레이 후 설정
        setTimeout(() => {
          setMessagesLoaded(true);
        }, 100);
      }
      
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
      } catch (error) {
        console.error("메시지 구독 오류:", error);
      }
    }, (error) => {
      console.error("Firestore 구독 오류:", error);
      // 오류 발생 시 사용자에게 알림 (선택사항)
      if (process.env.NODE_ENV === 'development') {
        console.warn('Firestore 인덱스가 필요할 수 있습니다. Firebase Console에서 인덱스를 생성해주세요.');
      }
    });
    
    return () => unsub && unsub();
  }, [roomId, loading, myJoinedAt, messagesLoaded]); // messagesLoaded 의존성 추가

  // 메시지별 읽음 상태 실시간 구독
  useEffect(() => {
    if (loading || !messages.length) return;

    const unsubscribes = [];

    messages.forEach((msg) => {
      const readStatusRef = collection(db, "chatRooms", roomId, "messages", msg.id, "readBy");
      const unsub = onSnapshot(readStatusRef, (snapshot) => {
        const readByUids = snapshot.docs.map(doc => doc.id);
        setMessageReadStatus(prev => ({
          ...prev,
          [msg.id]: readByUids
        }));
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [roomId, messages, loading]);

  // 메시지 읽음 처리 함수
  const markMessageAsRead = async (messageId) => {
    if (!auth.currentUser || !messageId) return;

    try {
      const readDocRef = doc(db, "chatRooms", roomId, "messages", messageId, "readBy", auth.currentUser.uid);
      await setDoc(readDocRef, {
        uid: auth.currentUser.uid,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error("메시지 읽음 처리 오류:", error);
    }
  };

  // 화면에 보이는 메시지들을 읽음 처리
  useEffect(() => {
    if (loading || !messages.length || !auth.currentUser) return;

    // 페이지가 보이는 상태에서만 읽음 처리
    if (document.visibilityState === 'visible') {
      messages.forEach(msg => {
        // 내가 보낸 메시지가 아니고, 아직 읽지 않은 메시지만 처리
        if (msg.uid !== auth.currentUser.uid) {
          const readByUids = messageReadStatus[msg.id] || [];
          if (!readByUids.includes(auth.currentUser.uid)) {
            markMessageAsRead(msg.id);
          }
        }
      });
    }
  }, [messages, messageReadStatus, loading, auth.currentUser]);

  // 페이지 포커스/블러 이벤트 처리
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && messages.length) {
        // 페이지가 다시 보이면 읽지 않은 메시지들을 읽음 처리
        messages.forEach(msg => {
          if (msg.uid !== auth.currentUser?.uid) {
            const readByUids = messageReadStatus[msg.id] || [];
            if (!readByUids.includes(auth.currentUser?.uid)) {
              markMessageAsRead(msg.id);
            }
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages, messageReadStatus, auth.currentUser]);

  // 실시간 참여자 관리
  useEffect(() => {
    if (loading || !auth.currentUser) return;
    const user = auth.currentUser;
    const participantRef = doc(db, "chatRooms", roomId, "participants", user.uid);

    setDoc(participantRef, {
      email: user.email,
      uid: user.uid,
      joinedAt: serverTimestamp(),
    });

    const unsub = onSnapshot(
      collection(db, "chatRooms", roomId, "participants"),
      (snapshot) => {
        const participantsData = snapshot.docs.map((doc) => ({
          email: doc.data().email,
          uid: doc.data().uid || doc.id
        }));
        setParticipants(participantsData.map(p => p.email));
        setParticipantUids(participantsData.map(p => p.uid));
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
      const videos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVideoList(videos);
      
      // URL 쿼리 파라미터에서 비디오 ID 확인하고 자동 선택
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('video');
      // URL 쿼리 파라미터에서 비디오 ID 확인하고 자동 선택
      if (videoId && videos.length > 0) {
        const videoIndex = videos.findIndex(v => v.id === videoId);
        if (videoIndex !== -1) {
          setSelectedVideoIdx(videoIndex);
          // URL에서 쿼리 파라미터 제거 (깔끔하게)
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
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
            const newIds = [...prev, video.id];

            return newIds;
          }
          if (!found && prev.includes(video.id)) {
            const newIds = prev.filter((id) => id !== video.id);
            return newIds;
          }
          return prev;
        });
      });
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [roomId, videoList, auth.currentUser]);

  // 팝업 플레이어 인증 상태 초기화 (영상 변경 시)
  useEffect(() => {
    // 현재 선택된 영상이 이미 인증된 영상인지 확인
    const currentVideo = videoList[selectedVideoIdx];
    const isAlreadyCertified = currentVideo && certifiedVideoIds.includes(currentVideo.id);
    

    
    // 이미 인증된 영상이면 인증 상태를 true로, 아니면 false로 설정
    setIsCertified(isAlreadyCertified);
    setWatchSeconds(0);
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
  }, [selectedVideoIdx, certifiedVideoIds, videoList]);

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
      const messageRef = await addDoc(collection(db, "chatRooms", roomId, "messages"), {
        text: newMsg,
        email: auth.currentUser.email,
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        photoURL: auth.currentUser.photoURL || "",
      });
      
      // 내가 보낸 메시지는 자동으로 읽음 처리
      await setDoc(doc(db, "chatRooms", roomId, "messages", messageRef.id, "readBy", auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        readAt: serverTimestamp()
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

  // 안 읽은 사람 수 계산 함수
  const getUnreadCount = (messageId, messageUid) => {
    const readByUids = messageReadStatus[messageId] || [];
    
    if (messageUid === auth.currentUser?.uid) {
      // 내가 보낸 메시지: 나를 제외한 다른 참여자들이 안 읽은 수
      const otherParticipants = participantUids.filter(uid => uid !== auth.currentUser?.uid);
      const otherParticipantsReadCount = readByUids.filter(uid => uid !== auth.currentUser?.uid).length;
      const unreadCount = otherParticipants.length - otherParticipantsReadCount;
      return unreadCount > 0 ? unreadCount : 0;
    } else {
      // 다른 사람이 보낸 메시지: 전체 참여자 중 안 읽은 수
      const totalParticipants = participantUids.length;
      const unreadCount = totalParticipants - readByUids.length;
      return unreadCount > 0 ? unreadCount : 0;
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
      const messageRef = await addDoc(collection(db, "chatRooms", roomId, "messages"), {
        fileType: type,
        fileName: file.name,
        fileUrl: downloadURL,
        fileSize: file.size,
        email: auth.currentUser.email,
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        photoURL: auth.currentUser.photoURL || "",
      });
      
      // 내가 보낸 파일 메시지는 자동으로 읽음 처리
      await setDoc(doc(db, "chatRooms", roomId, "messages", messageRef.id, "readBy", auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        readAt: serverTimestamp()
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
                alt="첨부 이미지"
                className="rounded-lg max-w-full h-auto cursor-pointer"
                onClick={() => window.open(msg.fileUrl, '_blank')}
              />
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
            </div>
          );
        case 'file':
        default:
          return (
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg max-w-xs">
              <div className="text-2xl">📎</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">첨부파일</div>
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
      return <div className="text-lg leading-relaxed text-left whitespace-pre-wrap font-normal">{renderMessageWithPreview(msg.text)}</div>;
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
    e.stopPropagation();
    setDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragOffset.current = {
      x: clientX - popupPos.x,
      y: clientY - popupPos.y,
    };
  };
  
  const handleDrag = (e) => {
    e.stopPropagation();
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
  
  const handleDragEnd = (e) => {
    if (e) e.stopPropagation();
    setDragging(false);
  };

  // 유튜브 플레이어 핸들러
  const handleYoutubeReady = (event) => {
    try {
      playerRef.current = event.target;
      setWatchSeconds(0);
      setLastPlayerTime(0);
      setVideoEnded(false);
    } catch (error) {
      console.error("YouTube Player 초기화 오류:", error);
    }
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
  };

  // 다음 영상으로 이동하는 공통 함수
  const moveToNextVideo = () => {
    if (selectedVideoIdx < videoList.length - 1) {
      setSelectedVideoIdx(selectedVideoIdx + 1);
    } else {
      setSelectedVideoIdx(0);
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
    setCertifiedVideoIds(prev => prev.includes(video.id) ? prev : [...prev, video.id]);
    setCertLoading(false);
    
    // 인증 완료 후 다음 영상으로 이동
    setTimeout(moveToNextVideo, 1000);
  };

  // certAvailable 선언 - 방장 설정에 따른 동적 조건
  let certAvailable = false;
  if (
    selectedVideoIdx !== null &&
    videoList[selectedVideoIdx] &&
    typeof videoList[selectedVideoIdx].duration === "number"
  ) {
    const videoDuration = videoList[selectedVideoIdx].duration;
    
    if (certificationSettings.mode === 'full') {
      // 완주 기반 인증: 영상을 끝까지 시청해야 함
      certAvailable = videoEnded;
    } else {
      // 시간 기반 인증: 설정된 시간 이상 시청하면 됨
      if (videoDuration <= 180) {
        // 3분 이하 영상은 완주 기반으로 처리
        certAvailable = videoEnded;
      } else {
        // 3분 초과 영상은 3분 시청으로 인증
        const requiredTime = 180;
        certAvailable = watchSeconds >= requiredTime;
      }
    }
  }

  // 자동 인증 및 카운트다운 useEffect
  useEffect(() => {
    const currentVideo = videoList[selectedVideoIdx];
    const isAlreadyCertified = currentVideo && certifiedVideoIds.includes(currentVideo.id);
    const isAutoEnabled = certificationSettings.enabled !== false; // 기본값은 true (기존 호환성)
    const shouldAutoCertify = isAutoEnabled && certAvailable && !isCertified && !certLoading && !isAlreadyCertified;
    
    if (shouldAutoCertify) {
      // 자동 인증 실행 (자동 인증이 활성화된 경우에만)
      handleCertify();
    } else {
      // 조건을 만족하지 않으면 타이머 정리
      clearInterval(autoNextTimer.current);
      setCountdown(5);
    }
    
    return () => clearInterval(autoNextTimer.current);
  }, [certAvailable, isCertified, certLoading, selectedVideoIdx, videoList.length, certifiedVideoIds, certificationSettings.enabled]);

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

  // 채팅방 정보 불러오기 (방장 확인용 + 시청인증 설정)
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        if (roomDoc.exists()) {
          const data = roomDoc.data();
          setRoomData(data);
          
          // 시청인증 설정 불러오기
          if (data.certificationSettings) {
            setCertificationSettings({
              mode: data.certificationSettings.mode || 'time',
              requiredTime: data.certificationSettings.requiredTime || 180
            });
          }
          
          // 새로운 인증 설정 불러오기 (CertificationSettings.js에서 설정한 것)
          if (data.certSettings) {
            setCertificationSettings(prev => ({
              ...prev,
              enabled: data.certSettings.enabled || false,
              watchRule: data.certSettings.watchRule || 'full',
              badgeColor: data.certSettings.badgeColor || '#3b82f6'
            }));
          }
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
    if (videoId && videoList.length > 0) {
      const idx = videoList.findIndex(v => v.id === videoId);
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

  // 스크롤 관리 - 컨테이너 직접 조작
  // 스크롤 처리 로직 개선 - 메시지 로딩 완료 후에만 실행
  useLayoutEffect(() => {
    const scrollToBottom = (smooth = false) => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const scrollOptions = {
          top: container.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        };
        container.scrollTo(scrollOptions);
      }
    };

    // 메시지가 로딩 완료되고 메시지가 있을 때만 스크롤
    if (messagesLoaded && messages.length > 0) {
      if (isInitialLoad) {
        // 초기 로딩 시 충분한 시간을 두고 스크롤 (DOM 렌더링 완료 후)
        setTimeout(() => {
          scrollToBottom(false);
          setIsInitialLoad(false);
        }, 100);
      } else {
        // 새 메시지 추가 시 부드럽게 스크롤
        setTimeout(() => {
          scrollToBottom(true);
        }, 50);
      }
    }
  }, [messages, isInitialLoad, messagesLoaded]); // messagesLoaded 의존성 추가

  // 추가 안전장치: 컴포넌트 마운트 후 스크롤 보장
  useEffect(() => {
    if (messagesLoaded && messages.length > 0) {
      const timer = setTimeout(() => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          container.scrollTop = container.scrollHeight;
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [messagesLoaded, messages.length]);

  // 자동 포커스 제거됨 - 키보드 자동 열림 방지
  // useEffect(() => {
  //   inputRef.current?.focus();
  // }, [loading, messages, error]);

  // 붙여넣기 핸들러 (이미지/파일 클립보드 업로드)
  const handlePaste = (e) => {
    if (!e.clipboardData || !e.clipboardData.items) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          const mime = file.type;
          let fileType = 'file';
          if (mime.startsWith('image/')) fileType = 'image';
          else if (mime.startsWith('video/')) fileType = 'video';
          handleFileUpload(file, fileType);
          e.preventDefault();
        }
      }
    }
  };

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
        <button onClick={() => navigate(roomPath(roomId,'menu'))} className="text-4xl text-gray-600 hover:text-blue-600 p-2" aria-label="메뉴">≡</button>
      </header>

      {/* 채팅메시지 패널 */}
      <main 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 hide-scrollbar" 
        style={{
          background: 'linear-gradient(180deg, #FFFEF7 0%, #FEFDF6 50%, #FDF9F0 100%)',
          paddingBottom: 180, // 입력창 공간을 더 확보하여 마지막 메시지가 잘리지 않도록
          paddingTop: 140,
          position: 'relative',
          zIndex: 10,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        {/* 메시지 로딩 중 표시 */}
        {!messagesLoaded && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mb-4"></div>
            <div className="text-gray-500 text-sm font-medium">메시지를 불러오는 중...</div>
          </div>
        )}
        
        {/* 메시지 목록 */}
        {messagesLoaded && messages.map((msg, idx) => {
          const isMine = msg.uid === auth.currentUser?.uid;
          const showDate = idx === 0 || (formatTime(msg.createdAt).slice(0, 10) !== formatTime(messages[idx - 1]?.createdAt).slice(0, 10));
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="text-center my-4">
                  <div className="inline-block text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mx-auto shadow-sm border border-gray-200 font-medium">
                    {formatTime(msg.createdAt).slice(0, 10)} {getDayOfWeek(msg.createdAt)}
                  </div>
                </div>
              )}
              <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
                {/* 상대방 메시지인 경우만 프로필+닉네임 표시 */}
                {!isMine && (
                  <div className="flex items-start mr-2 gap-2">
                    {/* 프로필 이미지 */}
                    <button 
                      className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shadow border-2 border-white group flex-shrink-0"
                      onClick={() => navigate(`/profile/${roomId}/${msg.uid}`)}
                      title={`${userNickMap[msg.uid] || msg.email?.split('@')[0] || '익명'}님의 프로필 보기`}
                    >
                      <img 
                        src={`https://picsum.photos/seed/${msg.uid || 'anonymous'}/100/100`}
                        alt="프로필"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class=\"w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white\">${(userNickMap[msg.uid] || msg.email?.split('@')[0] || '익명').slice(0, 2).toUpperCase()}</div>`;
                        }}
                      />
                    </button>
                    {/* 닉네임과 말풍선을 세로로 */}
                    <div className="flex flex-col">
                      {/* 닉네임 */}
                      <div className="text-xl text-gray-600 font-medium max-w-20 truncate mb-1">{userNickMap[msg.uid] || msg.email?.split('@')[0] || '익명'}</div>
                      {/* 말풍선+시간 */}
                      <div className={`flex items-end gap-2 max-w-[85%]`}>
                        <div className={`relative px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-bl-sm border border-gray-200 shadow-md break-words`}>
                      <div className="absolute -left-2 bottom-3 w-0 h-0 border-r-8 border-r-white border-t-4 border-t-transparent border-b-4 border-b-transparent drop-shadow-sm"></div>
                    {msg.fileType ? (
                            <div className="text-left">{renderMessage(msg)}</div>
                    ) : (
                            <div className="text-lg leading-relaxed text-left whitespace-pre-wrap font-normal">{renderMessageWithPreview(msg.text)}</div>
                    )}
                  </div>
                        
                        {/* 시간 + 안 읽은 사람 수 */}
                        <div className="flex flex-col items-start gap-1 pb-1">
                          {/* 안 읽은 사람 수 - 시간 윗줄 좌측 */}
                          {(() => {
                            const unreadCount = getUnreadCount(msg.id, msg.uid);
                            return unreadCount > 0 && (
                              <div className="text-xs text-yellow-500 font-bold">
                                {unreadCount}
                              </div>
                            );
                          })()}
                          {/* 시간 */}
                          <div className="text-base text-gray-500 opacity-80 select-none whitespace-nowrap">{formatTimeOnly(msg.createdAt)}</div>
                        </div>
                  </div>
                </div>
                  </div>
                )}
                {/* 내 메시지는 기존과 동일 */}
                {isMine && (
                  <div className={`flex items-end gap-2 max-w-[85%] flex-row-reverse`}>
                    <div className={`relative px-4 py-3 rounded-2xl bg-yellow-300 text-gray-800 rounded-br-sm shadow-md break-words`}>
                      <div className="absolute -right-2 bottom-3 w-0 h-0 border-l-8 border-l-yellow-300 border-t-4 border-t-transparent border-b-4 border-b-transparent drop-shadow-sm"></div>
                      {msg.fileType ? (
                        <div className="text-left">{renderMessage(msg)}</div>
                      ) : (
                        <div className="text-lg leading-relaxed text-left whitespace-pre-wrap font-normal">{renderMessageWithPreview(msg.text)}</div>
                      )}
                    </div>
                    
                    {/* 시간 + 안 읽은 사람 수 */}
                    <div className="flex flex-col items-end gap-1 pb-1">
                      {/* 안 읽은 사람 수 - 시간 윗줄 우측 정렬 */}
                      {(() => {
                        const unreadCount = getUnreadCount(msg.id, msg.uid);
                        return unreadCount > 0 && (
                          <div className="text-xs text-yellow-500 font-bold self-end">
                            {unreadCount}
                          </div>
                        );
                      })()}
                      {/* 시간 */}
                      <div className="text-base text-gray-500 opacity-80 select-none whitespace-nowrap">{formatTimeOnly(msg.createdAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
        
        {/* 메시지가 없을 때 표시 */}
        {messagesLoaded && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl mb-4">💬</div>
            <div className="text-gray-500 text-center">
              <div className="font-medium mb-1">아직 메시지가 없어요</div>
              <div className="text-sm">첫 번째 메시지를 보내보세요!</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      {/* 메시지 입력창 */}
      <form className="flex items-center px-4 py-4 border-t gap-3 w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-lg rounded-t-2xl" style={{ minHeight: 70, position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 50, boxSizing: 'border-box' }} onSubmit={handleSend}>
        <div className="relative upload-menu-container">
          <button 
            type="button" 
            className="text-lg w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 shadow-lg font-bold" 
            onClick={() => setShowUploadMenu(!showUploadMenu)} 
            aria-label="파일 업로드"
            disabled={uploading}
          >
            {uploading ? "⏳" : "+"}
          </button>
          
          {/* 업로드 메뉴 */}
          {showUploadMenu && (
            <div className="absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 px-4 py-4 z-50 flex gap-4">
              <button
                type="button"
                className="flex flex-col items-center justify-center w-18 h-18 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-200 hover:scale-105 border-2 border-transparent hover:border-blue-200"
                onClick={() => handleFileSelect('image')}
              >
                <span className="text-3xl mb-1">🖼️</span>
                <span className="text-xs text-gray-700 font-semibold">사진</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center justify-center w-18 h-18 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 rounded-2xl transition-all duration-200 hover:scale-105 border-2 border-transparent hover:border-red-200"
                onClick={() => handleFileSelect('video')}
              >
                <span className="text-3xl mb-1">🎬</span>
                <span className="text-xs text-gray-700 font-semibold">동영상</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center justify-center w-18 h-18 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 rounded-2xl transition-all duration-200 hover:scale-105 border-2 border-transparent hover:border-green-200"
                onClick={() => handleFileSelect('file')}
              >
                <span className="text-3xl mb-1">📎</span>
                <span className="text-xs text-gray-700 font-semibold">파일</span>
              </button>
            </div>
          )}
          
          {/* 업로드 중 안내 */}
          {uploading && (
            <div className="absolute bottom-full left-0 mb-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-2xl text-sm whitespace-nowrap shadow-xl font-medium">
              📤 파일 업로드 중...
            </div>
          )}
        </div>
        
        <input
          ref={inputRef}
          className="flex-1 border-2 border-gray-200 rounded-2xl px-4 py-3 text-base outline-none bg-white/90 backdrop-blur-sm min-w-0 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 placeholder-gray-500"
          value={newMsg}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          maxLength={MAX_LENGTH}
          placeholder="메시지를 입력하세요..."
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-xl"
          disabled={sending || (!newMsg.trim() && !uploading)}
        >
          {sending ? "전송중..." : "전송"}
        </button>
      </form>

      {/* 푸터(탭 네비게이터) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-evenly items-center border-t h-16 z-40 bg-white">
        <NavLink to="/" className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none flex-1">🏠<span>홈</span></NavLink>
        <NavLink to="/chat" className="flex flex-col items-center text-blue-500 text-sm font-bold focus:outline-none flex-1">💬<span>채팅방</span></NavLink>
        <NavLink to="/board" className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none flex-1">📋<span>게시판</span></NavLink>
        <NavLink to="/my" className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none flex-1">👤<span>마이채널</span></NavLink>
      </nav>

      {/* 드래그 가능한 영상 팝업 플레이어 */}
      {selectedVideoIdx !== null && videoList[selectedVideoIdx] && (
        <div
          className={`fixed z-50 bg-white rounded-xl shadow-lg transition-all duration-300 ${
            minimized ? 'w-16 h-16' : 'w-[85vw] max-w-[420px]'
          }`}
          style={{
            top: popupPos.y,
            left: popupPos.x,
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
            </div>
          ) : (
            // 확장된 상태
            <div className="p-2">
              {/* 상단 헤더 - 드래그 가능 영역 */}
              <div 
                className="flex items-center mb-2 p-1 -m-2 rounded-t-xl bg-gray-50 select-none justify-between"
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
                {/* 중앙 타이틀 */}
                <div className="flex-1 text-center text-xs text-gray-500 font-medium select-none pointer-events-none">
                  영상 플레이어 (드래그 가능)
                </div>

                {/* 우측 버튼 그룹 */}
                <div className="flex items-center gap-1">
                  {/* 최소화 */}
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
                  {/* 닫기 */}
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
              </div>
              
              {/* YouTube 플레이어 */}
              {videoList[selectedVideoIdx]?.videoId ? (
                <div className="youtube-player">
                  <YouTube
                    key={videoList[selectedVideoIdx].videoId}
                    videoId={videoList[selectedVideoIdx].videoId}
                    opts={{
                      width: '100%',
                      height: '100%',
                      playerVars: { 
                        autoplay: 1,
                        controls: 1, // 플레이어 컨트롤 표시 (1 = 표시, 0 = 숨김)
                        modestbranding: 0, // YouTube 로고 표시
                        rel: 0, // 관련 동영상 숨김
                        origin: window.location.origin,
                        enablejsapi: 1,
                        fs: 1, // 전체화면 활성화
                        disablekb: 0, // 키보드 컨트롤 활성화 (0 = 활성화)
                        playsinline: 1, // 모바일에서 인라인 재생
                        widget_referrer: window.location.origin,
                        start: 0 // 처음부터 재생
                      }
                    }}
                    onReady={handleYoutubeReady}
                    onStateChange={handleYoutubeStateChange}
                    onEnd={handleYoutubeEnd}
                    className="rounded"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                  ⚠️ 영상 로딩 중...
                </div>
              )}
              
              {/* 제목 - 컴팩트하게 변경 */}
              <div className="font-bold text-sm mb-1 px-1 leading-tight line-clamp-2" title={videoList[selectedVideoIdx].title}>
                {videoList[selectedVideoIdx].title}
              </div>
              
              {/* 시청 시간과 인증 정보를 한 줄로 */}
              <div className="flex flex-col gap-1 text-xs text-gray-600 mb-1 px-1">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium">
                    시청 시간: {Math.floor(watchSeconds / 60)}:{(watchSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-gray-500">
                    {videoList[selectedVideoIdx]?.duration ? 
                      `전체: ${Math.floor(videoList[selectedVideoIdx].duration / 60)}:${(videoList[selectedVideoIdx].duration % 60).toString().padStart(2, '0')}` 
                      : ''}
                  </span>
                </div>
                <div className="text-center text-blue-600 font-medium">
                  {(() => {
                    const currentVideo = videoList[selectedVideoIdx];
                    if (!currentVideo) return '';
                    
                    if (certificationSettings.mode === 'full') {
                      // 완주 기반: 모든 영상 끝까지 시청
                      return '영상을 끝까지 시청하면 인증 가능';
                    } else {
                      // 시간 기반: 영상 길이에 따라 다름
                      if (currentVideo.duration <= 180) {
                        // 3분 이하 영상: 끝까지 시청
                        return '짧은 영상 - 끝까지 시청하면 인증 가능';
                      } else {
                        // 3분 초과 영상: 3분 시청
                        const remainingSeconds = Math.max(0, 180 - watchSeconds);
                        return remainingSeconds > 0 
                          ? `3분 시청 시 인증 가능 (${remainingSeconds}초 남음)`
                          : '3분 시청 완료 - 인증 가능!';
                      }
                    }
                  })()}
                </div>
              </div>
              
              {/* 인증 버튼 */}
              <button
                className={`w-full py-2 mb-1 rounded-lg font-bold text-sm ${
                  certifiedVideoIds.includes(videoList[selectedVideoIdx]?.id)
                    ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                    : certAvailable && !certLoading
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!certifiedVideoIds.includes(videoList[selectedVideoIdx]?.id) && (!certAvailable || certLoading)}
                onClick={() => {
                  if (certifiedVideoIds.includes(videoList[selectedVideoIdx]?.id)) {
                    // 이미 인증된 영상인 경우
                    const isAutoEnabled = certificationSettings.enabled !== false;
                    
                    if (isAutoEnabled) {
                      // 자동 인증이 활성화되어 있으면 다음 영상으로 이동
                      moveToNextVideo();
                    } else {
                      // 자동 인증이 비활성화되어 있으면 다시 재생
                      if (playerRef.current && playerRef.current.seekTo) {
                        playerRef.current.seekTo(0);
                        setWatchSeconds(0);
                        setVideoEnded(false);
                        // 플레이어가 일시정지 상태라면 재생
                        if (playerRef.current.playVideo) {
                          playerRef.current.playVideo();
                        }
                      }
                    }
                  } else {
                    // 새로운 영상이면 인증 처리
                    handleCertify();
                  }
                }}
              >
                {certifiedVideoIds.includes(videoList[selectedVideoIdx]?.id)
                  ? certificationSettings.enabled !== false
                    ? "✅ 인증완료 (다음영상보기)"
                    : "✅ 인증완료 (다시보기)"
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
                  title="구독/좋아요 바로가기"
                >
                  ❤️ 구독/좋아요 바로가기
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
      )}

      {/* 사용자 프로필 모달 - 임시 주석 처리 */}
      {/* {showUserProfile && (
        <UserProfileModal 
          uid={showUserProfile} 
          onClose={() => setShowUserProfile(null)} 
          userNickMap={userNickMap}
        />
      )} */}

      {/* Hidden file input for React-style file upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept="*/*"
      />

      {/* --- Video List / Register Modal --- */}
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
              className="border rounded-lg p-2 bg-white shadow flex items-center gap-4 relative cursor-pointer hover:bg-blue-50"
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
                    className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600"
                    onClick={e => { 
                      e.stopPropagation(); 
                      setSelectedVideoIdx(idx); 
                      setShowVideoPanel(false); 
                    }}
                  >
                    ✅ 시청완료
                  </button>
                ) : (
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600"
                    onClick={e => { 
                      e.stopPropagation(); 
                      setSelectedVideoIdx(idx); 
                      setShowVideoPanel(false); 
                    }}
                  >
                    시청하기
                  </button>
                )}
            </div>
          ))}
        </div>
      </Modal>

      {/* ---------- 채팅방 정보 패널 ---------- */}
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
              <img src="https://picsum.photos/seed/chatroom/120/120" alt="방 프로필" className="w-20 h-20 rounded-full mb-2 border-2 border-blue-200" />
              <div className="font-bold text-lg mb-1 flex items-center gap-1">
                {roomName || "채팅방"}
                {isOwner && <span title="방장" className="ml-1 text-yellow-500 text-xl">👑</span>}
              </div>
              <div className="text-gray-500 text-sm">참여자 {participants.length}명</div>
            </div>

            {/* 메뉴 리스트 */}
            <div className="divide-y">
              <MenuItem icon="📢" label="공지" />
              <MenuItem icon="🗳️" label="투표" />
              <MenuItem icon="🤖" label="챗봇" />
              <MenuItem icon="🖼️" label="사진/동영상" />
              <MenuItem icon="🎬" label="시청하기" onClick={() => navigate(`/chat/${roomId}/videos`)} />
              <MenuItem icon="📁" label="파일" />
              <MenuItem icon="🔗" label="링크" />
              <MenuItem icon="📅" label="일정" />
              <MenuItem icon="👥" label="대화상대" />
            </div>

            {/* 방장 추가 버튼들 */}
            {isOwner && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-3 rounded hover:bg-blue-600 text-sm"
                  onClick={() => { setShowInfoPanel(false); setShowVideoPanel(true); }}
                >
                  시청리스트
                </button>
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-3 rounded hover:bg-blue-600 text-sm"
                  onClick={() => { setShowInfoPanel(false); navigate(`/chat/${roomId}/manage`); }}
                >
                  방 관리
                </button>
              </div>
            )}

            <div className="p-4">
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
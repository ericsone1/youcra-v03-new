import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
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
  runTransaction,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// import Picker from '@emoji-mart/react';
// import data from '@emoji-mart/data';
import Modal from "react-modal";
import LoadingSpinner from "./common/LoadingSpinner";
import ErrorMessage from "./common/ErrorMessage";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";
// import { MessageList } from './chat/MessageList'; // 임시 비활성화
import { useChat } from '../hooks/useChat';

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
    // ISO 8601: PT#H#M#S (시간-분-초) 모두 포착
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
  
  // VideoPlayerContext 사용
  const {
    initializePlayer,
    updateVideoList
  } = useVideoPlayer();
  
  // useChat hook 사용
  const {
    loading: chatLoading,
    error: chatError,
    roomInfo,
    messages,
    participants,
    myJoinedAt,
    sendMessage,
    joinRoom,
    leaveRoom
  } = useChat(roomId);

  // === 기본 채팅 관련 State ===
  const [newMsg, setNewMsg] = useState("");
  const [participantEmails, setParticipantEmails] = useState([]); // 이메일 목록 (기존 로직 호환용)
  const [participantUids, setParticipantUids] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userNickMap, setUserNickMap] = useState({});
  
  // === 채팅방 정보 관련 State === (roomInfo는 useChat에서 제공)
  const [roomLiked, setRoomLiked] = useState(false);
  const [roomLikesCount, setRoomLikesCount] = useState(0);
  
  // === 영상 관련 State (영상 등록용만 유지) ===
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");
  
  // 로컬 영상 리스트 (영상 등록 확인용)
  const [localVideoList, setLocalVideoList] = useState([]);
  
  // === 영상 인증 관련 State ===
  const [certifiedVideoIds, setCertifiedVideoIds] = useState([]);
  const [watchSettings, setWatchSettings] = useState({
    enabled: true,
    watchMode: 'partial'
  });
  
  // === 방장 기능 관련 State ===
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [showUserModal, setShowUserModal] = useState(null);
  
  // === 업로드 관련 State ===
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  
  // === 기타 State ===
  const [messageReadStatus, setMessageReadStatus] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로딩 여부
  const [messagesLoaded, setMessagesLoaded] = useState(false); // 메시지 로딩 완료 여부
  
  // === UI 관련 State ===
  const [showUserProfile, setShowUserProfile] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showImageModal, setShowImageModal] = useState(null); // 이미지 모달
  const [watching, setWatching] = useState(0); // 시청자 수
  
  // === Refs ===
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const longPressTimer = useRef(null);

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

  // useChat에서 roomInfo 받아서 roomName 설정
  useEffect(() => {
    if (roomInfo?.name) {
      setRoomName(roomInfo.name);
    }
  }, [roomInfo]);

  // useChat에서 error 받아서 error 설정
  useEffect(() => {
    if (chatError) {
      setError(chatError);
    }
  }, [chatError]);

  // 채팅방 입장 처리
  useEffect(() => {
    if (!loading && !chatLoading && auth.currentUser && roomId) {
      const handleJoinRoom = async () => {
        await joinRoom();
        
        // 입장 메시지는 생성하지 않음 (온라인 상태는 상단에 실시간 표시됨)
        // 최초 방 생성 시에만 환영 메시지가 필요하다면 별도 로직으로 처리
      };
      
      handleJoinRoom();
    }
  }, [loading, chatLoading, auth.currentUser, roomId, joinRoom]);

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

  // 메시지 로딩 완료 상태 관리
  useEffect(() => {
    if (messages.length > 0 && !messagesLoaded) {
      setTimeout(() => {
        setMessagesLoaded(true);
      }, 100);
    }
  }, [messages, messagesLoaded]);

  // 닉네임 매핑 - useChat에서 받은 메시지 기반
  useEffect(() => {
    if (!messages.length) return;
    
    const uids = Array.from(new Set(messages.map((m) => m.uid).filter(Boolean)));
    
    setUserNickMap((currentNickMap) => {
      const unMappedUids = uids.filter(uid => !currentNickMap[uid]);
      
      if (unMappedUids.length > 0) {
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
      
      return currentNickMap;
    });
  }, [messages]);

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

  // participantUids를 useChat의 participants로 동기화
  useEffect(() => {
    if (participants && participants.length > 0) {
      setParticipantUids(participants);
    }
  }, [participants]);

  // 영상 리스트 실시간 구독
  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, async (snapshot) => {
      const videos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // duration이 없는 영상들을 위해 다시 메타데이터 가져오기
      const videosWithDuration = await Promise.all(
        videos.map(async (video) => {
          // duration이 없거나 0인 모든 영상에 대해 다시 가져오기
          if ((!video.duration || video.duration === 0) && video.videoId) {
            try {
              const meta = await fetchYoutubeMeta(video.videoId);
              if (meta && meta.duration && meta.duration > 0) {
                // Firestore에 duration 업데이트
                await setDoc(doc(db, "chatRooms", roomId, "videos", video.id), {
                  ...video,
                  duration: meta.duration
                }, { merge: true });
                return { ...video, duration: meta.duration };
              }
            } catch (error) {
              console.error('duration 가져오기 오류:', error);
            }
          }
          return video;
        })
      );
      
      // 영상 길이 순으로 정렬 (짧은 것부터 긴 것 순)
      const sortedVideos = videosWithDuration.sort((a, b) => {
        const durationA = a.duration || 0;
        const durationB = b.duration || 0;
        
        // 시청리스트 순서: duration 기준 오름차순 (짧은 영상부터)
        return durationA - durationB;
      });
          
      // 로컬 상태는 영상 등록 확인용으로만 사용, GlobalVideoPlayer 컨텍스트 업데이트
      setLocalVideoList(sortedVideos);
      updateVideoList(sortedVideos);
      
      // URL 쿼리 파라미터에서 비디오 ID 확인하고 자동 선택
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('video');
      if (videoId && sortedVideos.length > 0) {
        const videoIndex = sortedVideos.findIndex(v => v.id === videoId);
        if (videoIndex !== -1) {
          // GlobalVideoPlayer 초기화 및 영상 선택
          initializePlayer(roomId, sortedVideos, videoIndex);
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
    if (localVideoList.length === 0) {
      setCertifiedVideoIds([]);
      return;
    }
    const unsubscribes = localVideoList.map((video) => {
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
  }, [roomId, localVideoList, auth.currentUser]);





  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [messages, loading, error]);

  // === 현재 영상의 사용자 인증 횟수 실시간 구독 (GlobalVideoPlayer에서 처리하므로 제거) ===
  // 이 기능은 이제 GlobalVideoPlayer에서 처리됩니다.

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
      // useChat의 sendMessage 사용
      await sendMessage(newMsg.trim());
      setNewMsg("");
      
      // 메시지 전송 후 스크롤 - 부드러운 처리
      setTimeout(() => {
        scrollToBottom.current();
      }, 50);
    } catch (err) {
      setError("메시지 전송 중 오류가 발생했습니다.");
    }
    setSending(false);
  };

  // 메시지 삭제(길게 눌러야)
  const handleDelete = async (msgId) => {
    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "messages", msgId));
    } catch (error) {
      console.error("메시지 삭제 오류:", error);
    }
  };

  // 방장 기능: 메시지 삭제
  const handleAdminDeleteMessage = async (msgId, msgUid) => {
    if (!isOwner) {
      alert("방장만 메시지를 삭제할 수 있습니다.");
      return;
    }

    if (!window.confirm("이 메시지를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "messages", msgId));
      console.log("방장이 메시지를 삭제했습니다:", msgId);
    } catch (error) {
      console.error("메시지 삭제 오류:", error);
      alert("메시지 삭제 중 오류가 발생했습니다.");
    }
  };

  // 방장 기능: 사용자 추방
  const handleKickUser = async (targetUid, targetEmail) => {
    if (!isOwner) {
      alert("방장만 사용자를 추방할 수 있습니다.");
      return;
    }

    if (targetUid === myUid) {
      alert("자신을 추방할 수 없습니다.");
      return;
    }

    if (!window.confirm(`정말로 ${targetEmail}님을 추방하시겠습니까?`)) {
      return;
    }

    try {
      // 참여자 목록에서 제거
      await deleteDoc(doc(db, "chatRooms", roomId, "participants", targetUid));
      console.log("사용자를 추방했습니다:", targetEmail);
      alert(`${targetEmail}님을 추방했습니다.`);
    } catch (error) {
      console.error("사용자 추방 오류:", error);
      alert("사용자 추방 중 오류가 발생했습니다.");
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
  const isOwner = roomInfo && myUid && (
    roomInfo.createdBy === myUid ||      // UID와 createdBy 비교 (핵심)
    roomInfo.ownerEmail === myEmail ||   // 이메일 기반 백업
    roomInfo.creatorEmail === myEmail    // 이메일 기반 백업
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
    
    // 이미지 파일인 경우 우선 Base64로 처리 (CORS 회피)
    if (type === 'image' && file.type.startsWith('image/')) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const dataURL = e.target.result;
            
            // Base64 데이터URL로 메시지 저장
            const messageRef = await addDoc(collection(db, "chatRooms", roomId, "messages"), {
              fileType: type,
              fileName: file.name,
              fileUrl: dataURL, // Base64 데이터URL 사용
              fileSize: file.size,
              email: auth.currentUser.email,
              createdAt: serverTimestamp(),
              uid: auth.currentUser.uid,
              photoURL: auth.currentUser.photoURL || "",
              uploadMethod: 'base64', // 업로드 방식 표시
            });
            
            // 읽음 처리
            await setDoc(doc(db, "chatRooms", roomId, "messages", messageRef.id, "readBy", auth.currentUser.uid), {
              uid: auth.currentUser.uid,
              readAt: serverTimestamp()
            });
            
            setUploading(false);
          } catch (dbError) {
            console.error('Firestore 저장 오류:', dbError);
            setUploading(false);
            alert('이미지 저장 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
          }
        };
        
        reader.onerror = () => {
          console.error('FileReader 오류');
          setUploading(false);
          alert('이미지 읽기 중 오류가 발생했습니다.');
        };
        
        reader.readAsDataURL(file);
        return; // 이미지는 여기서 처리 완료
        
      } catch (error) {
        console.error('Base64 변환 오류:', error);
        setUploading(false);
        alert('이미지 처리 중 오류가 발생했습니다.');
        return;
      }
    }
    
    // 비이미지 파일의 경우 Firebase Storage 시도
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `chatrooms/${roomId}/${fileName}`);
      
      // 업로드 타임아웃 설정 (15초로 단축)
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('업로드 타임아웃 (15초 초과)')), 15000)
      );
      
      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
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
        uploadMethod: 'firebase_storage',
      });
      
      // 읽음 처리
      await setDoc(doc(db, "chatRooms", roomId, "messages", messageRef.id, "readBy", auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        readAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('파일 업로드 오류:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      // CORS 또는 네트워크 오류 처리
      const isNetworkError = error.message.includes('CORS') || 
                            error.message.includes('blocked') || 
                            error.message.includes('타임아웃') ||
                            error.message.includes('network') ||
                            error.code === 'storage/unauthorized' ||
                            error.name === 'TypeError';
      
      if (isNetworkError) {
        alert('⚠️ 파일 업로드에 실패했습니다.\n\n가능한 원인:\n• 네트워크 연결 문제\n• 파일 크기가 너무 큼\n• Firebase 서버 일시적 오류\n\n잠시 후 다시 시도해주세요.');
      } else {
        alert(`파일 업로드 중 오류가 발생했습니다: ${error.message}`);
      }
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
                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowImageModal({ url: msg.fileUrl, name: msg.fileName || '이미지' })}
                title="클릭하여 크게 보기"
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
                preload="metadata"
                onError={(e) => {
                  console.error('비디오 로딩 오류:', e);
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="text-red-500 text-sm p-2 bg-red-50 rounded">비디오를 재생할 수 없습니다.</div>';
                }}
                onLoadStart={() => {
                  console.log('비디오 로딩 시작:', msg.fileUrl);
                }}
                onCanPlay={() => {
                  console.log('비디오 재생 준비 완료');
                }}
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
    } else if (msg.text) {
      // 텍스트 메시지 렌더링
      return <div className="text-lg leading-relaxed text-left whitespace-pre-wrap font-normal">{renderMessageWithPreview(msg.text)}</div>;
    } else {
      // 빈 메시지 처리
      return <div className="text-gray-400 text-sm italic">메시지 내용이 없습니다.</div>;
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
    // 모바일에서 키보드 올라올 때 화면 스크롤
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 300);
  };

  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
  }, []);

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
    if (videoId && localVideoList.length > 0) {
      const idx = localVideoList.findIndex(v => v.id === videoId);
      if (idx !== -1) {
        // GlobalVideoPlayer 초기화
        initializePlayer(roomId, localVideoList, idx);
      }
    }
  }, [location.search, localVideoList]);

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
      alert("로그인이 필요합니다.");
      return;
    }

    const roomRef = doc(db, "chatRooms", roomId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
          throw "Room does not exist!";
        }
        
        const data = roomDoc.data();
        const likedBy = data.likedBy || [];
        const isLiked = likedBy.includes(auth.currentUser.uid);
        
        let newLikes = data.likes || 0;
        let newLikedBy = [...likedBy];

        if (isLiked) {
          newLikes -= 1;
          newLikedBy = newLikedBy.filter(uid => uid !== auth.currentUser.uid);
        } else {
          newLikes += 1;
          newLikedBy.push(auth.currentUser.uid);
        }
        
        transaction.update(roomRef, { 
          likes: newLikes < 0 ? 0 : newLikes,
          likedBy: newLikedBy 
        });
      });
    } catch (e) {
      console.error("Error updating likes: ", e);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 스크롤 관리 - 부드러운 자동 스크롤
  const scrollToBottom = useRef(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // 부드럽게 맨 아래로 스크롤
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'auto'
      });
    }
  });

  // 메시지가 변경될 때 스크롤 - 최적화된 로직
  useLayoutEffect(() => {
    if (messagesLoaded && messages.length > 0) {
      // 초기 로드 시에만 약간의 지연으로 확실한 스크롤
      if (isInitialLoad) {
        setTimeout(() => {
          scrollToBottom.current();
        }, 100);
        setIsInitialLoad(false);
      } else {
        // 일반적인 경우 즉시 스크롤
        scrollToBottom.current();
      }
    }
  }, [messages, messagesLoaded, isInitialLoad]);

  // 붙여넣기 핸들러 (이미지/파일 클립보드 업로드)
  const handlePaste = (e) => {
    if (!e.clipboardData || !e.clipboardData.items) {
      return;
    }
    
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

  // 채팅방 데이터 실시간 구독 - 방 정보 + 좋아요 수 + 활성 사용자 수
  useEffect(() => {
    if (loading) return;

    const roomDocRef = doc(db, "chatRooms", roomId);
    const unsubRoom = onSnapshot(roomDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // roomInfo는 useChat에서 관리되므로 별도 설정 불필요
        setRoomLikesCount(data.likesCount || 0);
        setWatching(data.watching || 0);
        
        // 시청인증 설정 로딩
        if (data.watchSettings) {
          setWatchSettings({
            enabled: data.watchSettings.enabled ?? true,
            watchMode: data.watchSettings.watchMode ?? 'partial'
          });
        }
      }
    });

    return () => {
      unsubRoom && unsubRoom();
    };
  }, [roomId, loading]);

  // 채팅방 공유하기 기능
  const [showShareToast, setShowShareToast] = useState(false);
  
  const handleShareRoom = async () => {
    const shareUrl = `${window.location.origin}/chat/${roomId}`;
    try {
      if (navigator.share) {
        await navigator.share({
                  title: roomInfo?.name || '채팅방에 참여하세요',
        text: `${roomInfo?.name || '이 채팅방'}에 초대합니다.`,
          url: shareUrl,
        });
      } else {
        // Fallback for desktop or browsers that don't support Web Share API
        await navigator.clipboard.writeText(shareUrl);
        alert('채팅방 링크가 복사되었습니다!');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      // 사용자가 공유를 취소한 경우는 제외
      if (error.name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        alert('공유에 실패하여 링크를 복사했습니다.');
      }
    }
  };

  // ---------------------- return문 시작 ----------------------
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex-shrink-0 flex items-center justify-between px-4 py-3 border-b z-30 bg-rose-100" style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
        <div className="flex-1 text-center">
          <div className="font-bold text-lg truncate">{roomName}</div>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
            {/* 온라인 사용자 수 - 작고 깔끔하게 */}
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">{participants.length}</span>
            </div>
            
            {/* 좋아요 버튼 */}
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
        
        {/* 우측 버튼 그룹 */}
        <div className="flex items-center gap-2">
          {/* 공유하기 버튼 */}
          <button 
            onClick={handleShareRoom}
            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all duration-200 hover:scale-110" 
            aria-label="채팅방 공유하기"
            title="채팅방 공유하기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          
          {/* 메뉴 버튼 */}
          <button onClick={() => navigate(`/chat/${roomId}/info`)} className="text-4xl text-gray-600 hover:text-blue-600 p-2" aria-label="메뉴">≡</button>
        </div>
      </header>

      {/* 공유하기 토스트 메시지 */}
      {showShareToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="font-medium">채팅방 링크가 복사되었습니다!</span>
          </div>
        </div>
      )}

      {/* 채팅메시지 패널 */}
      <main 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 chat-room-scroll" 
        style={{
          background: 'linear-gradient(180deg, #FFFEF7 0%, #FEFDF6 50%, #FDF9F0 100%)',
          paddingBottom: 160, // 입력창 공간 + 여유 공간 (70px input + 64px footer + 26px 여유)
          paddingTop: 90, // 헤더 높이
          position: 'relative',
          zIndex: 10,
          height: '100vh', // 전체 화면 높이 사용
          maxHeight: '100vh',
          scrollBehavior: 'auto' // 부드러운 스크롤 비활성화 (성능 향상)
        }}
      >
        {/* 메시지 로딩 중 표시 */}
        {!messagesLoaded && (
          <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 240px)', minHeight: '300px' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mb-4"></div>
            <div className="text-gray-500 text-sm font-medium">메시지를 불러오는 중...</div>
          </div>
        )}
        
        {/* 메시지 목록 */}
        {messagesLoaded && messages.map((msg, idx) => {
          const isMine = msg.uid === auth.currentUser?.uid;
          const showDate = idx === 0 || (formatTime(msg.createdAt).slice(0, 10) !== formatTime(messages[idx - 1]?.createdAt).slice(0, 10));
          
          // 시스템 메시지 감지
          const isSystemMessage = msg.type === 'system' || 
                                 msg.isSystemMessage === true ||
                                 msg.systemType ||
                                 msg.system === true || // ChatRoomMenu에서 사용하는 필드
                                 msg.uid === 'system' ||
                                 !msg.uid || // uid가 없는 경우도 시스템 메시지로 처리
                                 (msg.text && (
                                   msg.text.includes('님이 입장했습니다') ||
                                   msg.text.includes('님이 퇴장했습니다') ||
                                   msg.text.includes('입장했습니다') ||
                                   msg.text.includes('퇴장했습니다') ||
                                   msg.text.includes('님이 퇴장하셨습니다')
                                 ));
          
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="text-center my-4">
                  <div className="inline-block text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mx-auto shadow-sm border border-gray-200 font-medium">
                    {formatTime(msg.createdAt).slice(0, 10)} {getDayOfWeek(msg.createdAt)}
                  </div>
                </div>
              )}
              
              {/* 시스템 메시지 렌더링 */}
              {isSystemMessage ? (
                <div className="flex justify-center my-3">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 text-xs rounded-full shadow-sm border border-gray-200">
                                         <svg className="w-3 h-3 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                    {msg.text}
                  </div>
                </div>
              ) : (
                /* 일반 메시지 렌더링 */
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
                        {/* 닉네임 + 방장 아이콘 */}
                        <div className="text-lg text-gray-600 font-medium mb-1 flex items-center gap-1 flex-wrap">
                          {userNickMap[msg.uid] || msg.email?.split('@')[0] || '익명'}
                          {/* 방장 아이콘 표시 */}
                          {roomInfo && msg.uid === roomInfo.createdBy && (
                            <span title="방장" className="text-yellow-500 text-lg">👑</span>
                          )}
                        </div>
                        {/* 말풍선+시간 */}
                        <div className={`flex items-end gap-2 max-w-[85%]`}>
                          <div className={`relative px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-bl-sm border border-gray-200 shadow-md word-break-keep-all`}
                               style={{ 
                                 wordBreak: 'keep-all',
                                 overflowWrap: 'break-word',
                                 hyphens: 'auto',
                                 minWidth: '200px',
                                 maxWidth: '100%'
                               }}>
                        <div className="absolute -left-2 bottom-3 w-0 h-0 border-r-8 border-r-white border-t-4 border-t-transparent border-b-4 border-b-transparent drop-shadow-sm"></div>
                      {msg.fileType ? (
                              <div className="text-left">{renderMessage(msg)}</div>
                      ) : (
                              <div className="text-base leading-relaxed text-left whitespace-pre-wrap font-normal"
                                   style={{ 
                                     wordBreak: 'keep-all',
                                     overflowWrap: 'break-word',
                                     lineHeight: '1.5'
                                   }}>
                                {renderMessageWithPreview(msg.text)}
                              </div>
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
                            <div className="text-sm text-gray-500 opacity-80 select-none whitespace-nowrap">{formatTimeOnly(msg.createdAt)}</div>
                          </div>
                    </div>
                  </div>
                    </div>
                  )}
                  {/* 내 메시지는 기존과 동일 */}
                  {isMine && (
                    <div className={`flex items-end gap-2 max-w-[85%] flex-row-reverse`}>
                      <div className={`relative px-4 py-3 rounded-2xl bg-yellow-300 text-gray-800 rounded-br-sm shadow-md word-break-keep-all`}
                           style={{ 
                             wordBreak: 'keep-all',
                             overflowWrap: 'break-word',
                             hyphens: 'auto',
                             minWidth: '200px',
                             maxWidth: '100%'
                           }}>
                        <div className="absolute -right-2 bottom-3 w-0 h-0 border-l-8 border-l-yellow-300 border-t-4 border-t-transparent border-b-4 border-b-transparent drop-shadow-sm"></div>
                        {msg.fileType ? (
                          <div className="text-left">{renderMessage(msg)}</div>
                        ) : (
                          <div className="text-base leading-relaxed text-left whitespace-pre-wrap font-normal"
                               style={{ 
                                 wordBreak: 'keep-all',
                                 overflowWrap: 'break-word',
                                 lineHeight: '1.5'
                               }}>
                            {renderMessageWithPreview(msg.text)}
                          </div>
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
                        <div className="text-sm text-gray-500 opacity-80 select-none whitespace-nowrap">{formatTimeOnly(msg.createdAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
        
        {/* 메시지가 없을 때 표시 */}
        {messagesLoaded && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 240px)', minHeight: '300px' }}>
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
      <form className="flex items-center px-4 py-4 border-t gap-3 w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-lg" style={{ minHeight: 70, position: 'fixed', bottom: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 50, boxSizing: 'border-box' }} onSubmit={handleSend}>
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

      {/* 하단 탭 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex justify-around py-2 z-20" style={{ height: '64px' }}>
        <button className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/')}>🏠<span>홈</span></button>
        <button className="flex flex-col items-center text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/chat')}>💬<span>채팅방</span></button>
        <button className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/board')}>📋<span>게시판</span></button>
        <button className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/my')}>👤<span>마이채널</span></button>
      </nav>
    </div>
  );
}

// 메뉴 아이템 컴포넌트 (더 이상 사용되지 않음)
// function MenuItem({ icon, label, onClick }) {
//   return (
//     <div className="flex items-center gap-3 px-6 py-4 hover:bg-blue-50 cursor-pointer" onClick={onClick}>
//       <span className="text-xl w-7 text-center">{icon}</span>
//       <span className="font-medium text-gray-700">{label}</span>
//     </div>
//   );
// }

// 날짜 요일 반환 함수 추가
function getDayOfWeek(ts) {
  if (!ts) return '';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()] + '요일';
}

export default ChatRoom;
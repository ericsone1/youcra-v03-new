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
  // 인증 횟수 상태 추가
  const [userCertCount, setUserCertCount] = useState(0);
  
  // === 방장 기능 관련 State ===
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [showUserModal, setShowUserModal] = useState(null);
  const [lastPlayerTime, setLastPlayerTime] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [endCountdown, setEndCountdown] = useState(0);
  // 채팅방 정보 패널은 별도 페이지(/chat/:roomId/info)로 이동함
  
  // === 시청인증 설정 State ===
  const [watchSettings, setWatchSettings] = useState({
    enabled: true,
    watchMode: 'partial'  // 'partial' | 'full'
  });
  
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
  const [showImageModal, setShowImageModal] = useState(null); // 이미지 모달
  
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
  
  // VideoPanel 관련 state 제거됨 - 별도 페이지로 이동

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
          
      setVideoList(sortedVideos);
      
      // URL 쿼리 파라미터에서 비디오 ID 확인하고 자동 선택
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('video');
      if (videoId && sortedVideos.length > 0) {
        const videoIndex = sortedVideos.findIndex(v => v.id === videoId);
        if (videoIndex !== -1) {
          setSelectedVideoIdx(videoIndex);
          // URL에서 쿼리 파라미터 제거 (깔끔하게)
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    });
    return () => unsub();
  }, [roomId]);

  // 시청 상태에 따른 영상 목록 정렬 (시청 안된 것 상단으로)
  useEffect(() => {
    if (videoList.length === 0) return;
    
    const sortedVideos = [...videoList].sort((a, b) => {
      const aWatched = certifiedVideoIds.includes(a.id);
      const bWatched = certifiedVideoIds.includes(b.id);
      
      // 1차 정렬: 시청 안된 것을 상단으로
      if (!aWatched && bWatched) return -1;
      if (aWatched && !bWatched) return 1;
      
      // 2차 정렬: 기존 duration 정렬 유지 (짧은 것부터)
      return (a.duration || 0) - (b.duration || 0);
    });
    
    // 정렬이 실제로 변경된 경우만 업데이트 (무한 루프 방지)
    const isOrderChanged = sortedVideos.some((video, index) => video.id !== videoList[index]?.id);
    if (isOrderChanged) {
      setVideoList(sortedVideos);
    }
  }, [certifiedVideoIds]); // videoList 의존성 제거하여 무한 루프 방지

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

  // ▶️ 선택된 영상이 바뀔 때마다 타이머와 관련 상태 초기화
  useEffect(() => {
    // watchSeconds, videoEnded 초기화
    setWatchSeconds(0);
    setVideoEnded(false);
    setIsCertified(false);

    // 기존 interval 정리 (재생 중이던 타이머 충돌 방지)
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
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
    // 드래그 중 하단 탭 네비게이션으로 이벤트가 전파되는 것을 방지
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    setDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragOffset.current = {
      x: clientX - popupPos.x,
      y: clientY - popupPos.y,
    };
  };
  
  const handleDrag = (e) => {
    // 탭 이동 방지
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

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
    // 탭 이동 방지
    // pointercancel 용도 포함하여 이벤트 정리
    if (event?.stopPropagation) event.stopPropagation();
    setDragging(false);
  };

  // 유튜브 플레이어 핸들러
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    // 상태 초기화 제거 - selectedVideoIdx 변경 시에만 초기화되도록 함
  };
  
  const handleYoutubeStateChange = (event) => {
    // 기존 interval 정리
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
    }

    // 재생 중일 때만 새로운 interval 생성
    if (event.data === 1) { // YT.PlayerState.PLAYING
      // 재생 시작 시 현재 시간으로 동기화
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = Math.floor(playerRef.current.getCurrentTime());
        setWatchSeconds(currentTime);
      }
      
      playerRef.current._interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = Math.floor(playerRef.current.getCurrentTime());
          setWatchSeconds(currentTime);
        } else {
          // 기본 카운터 (플레이어 API 접근 불가 시)
          setWatchSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
  };
  
  const handleYoutubeEnd = () => {
    // 영상 종료 시 videoEnded 상태 설정
    setVideoEnded(true);
    
    // 시청인증이 활성화되어 있다면 자동 인증 useEffect에서 처리하도록 함
    // 시청인증이 비활성화되어 있다면 바로 다음 영상으로 이동
    if (!watchSettings.enabled) {
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

  // certAvailable 선언 - 시청인증 설정에 따라 조건 변경
  let certAvailable = false;
  if (
    selectedVideoIdx !== null &&
    videoList[selectedVideoIdx] &&
    typeof videoList[selectedVideoIdx].duration === "number" &&
    watchSettings.enabled
  ) {
    if (watchSettings.watchMode === 'partial') {
      // 부분 시청 허용: 3분 이상 영상은 3분 시청, 3분 미만은 완시청
    certAvailable =
      videoList[selectedVideoIdx].duration >= 180
          ? watchSeconds >= 180
          : videoEnded;
    } else {
      // 전체 시청 필수: 1시간 초과 영상은 30분 시청, 1시간 이하는 30분 시청 또는 완시청, 30분 미만은 완시청
      const videoDuration = videoList[selectedVideoIdx].duration;
      if (videoDuration > 3600) {
        // 1시간 초과 영상: 30분(1800초) 시청으로 인증
        certAvailable = watchSeconds >= 1800;
      } else if (videoDuration > 1800) {
        // 30분~1시간 영상: 30분 시청 또는 완시청
        certAvailable = watchSeconds >= 1800 || videoEnded;
      } else {
        // 30분 미만 영상: 완시청 필요
        certAvailable = videoEnded;
      }
    }
  }

  // 시청인증 완료 시 자동 인증 및 다음 영상 이동 (5초 카운트다운)
  useEffect(() => {
    const currentVideo = videoList[selectedVideoIdx];
    const isAlreadyCertified = currentVideo && certifiedVideoIds.includes(currentVideo.id);
    
    // 시청인증이 활성화되고, 인증 가능하고, 아직 인증하지 않았고, 이미 인증된 영상이 아닐 때만 카운트다운 시작
    if (watchSettings.enabled && certAvailable && !isCertified && !certLoading && !isAlreadyCertified) {
      setCountdown(5);
      autoNextTimer.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(autoNextTimer.current);
            
            // 자동으로 인증 처리
            handleCertify();
            
            // 다음 영상이 있으면 이동, 없으면 플레이어 종료
            setTimeout(() => {
            if (selectedVideoIdx < videoList.length - 1) {
                // 다음 영상으로 이동
              setSelectedVideoIdx(selectedVideoIdx + 1);
              } else {
                // 마지막 영상이므로 플레이어 종료
                setSelectedVideoIdx(null);
                setMinimized(false);
                if (playerRef.current && playerRef.current._interval) {
                  clearInterval(playerRef.current._interval);
                  playerRef.current._interval = null;
                }
              }
            }, 1000); // 인증 완료 후 1초 뒤에 이동/종료
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (autoNextTimer.current) {
      clearInterval(autoNextTimer.current);
        autoNextTimer.current = null;
      }
      setCountdown(5);
    }
    
    return () => {
      if (autoNextTimer.current) {
        clearInterval(autoNextTimer.current);
        autoNextTimer.current = null;
      }
    };
  }, [watchSettings.enabled, certAvailable, isCertified, certLoading, selectedVideoIdx, videoList.length, certifiedVideoIds]);

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
  }, [autoNextTimer]);

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

  // 스크롤 관리 - 즉시 스크롤, 애니메이션 없음
  useLayoutEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        // messagesEndRef를 이용해 즉시 스크롤
        messagesEndRef.current.scrollIntoView({ block: 'end', behavior: 'auto' });
      } else if (messagesContainerRef.current) {
        // 백업: 컨테이너 직접 조작
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight;
      }
    };

    // 메시지가 로딩 완료되고 메시지가 있을 때만 스크롤
    if (messagesLoaded && messages.length > 0) {
      if (isInitialLoad) {
        // 초기 로딩 시 즉시 스크롤 (애니메이션 없음)
        scrollToBottom();
        setIsInitialLoad(false);
      } else {
        // 새 메시지 추가 시에도 즉시 스크롤
        scrollToBottom();
      }
    }
  }, [messages, isInitialLoad, messagesLoaded]);

  useEffect(() => {
    // inputRef.current?.focus(); // 키보드 자동 열림 방지
  }, [loading, messages, error]);

  // cleanup
  useEffect(() => {
    return () => {
      if (playerRef.current && playerRef.current._interval) {
        clearInterval(playerRef.current._interval);
        playerRef.current._interval = null;
      }
      if (endTimer.current) {
        clearInterval(endTimer.current);
        endTimer.current = null;
      }
      if (autoNextTimer.current) {
        clearInterval(autoNextTimer.current);
        autoNextTimer.current = null;
      }
    };
  }, []);

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
        setRoomData(data);
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
    try {
      const shareUrl = `${window.location.origin}/chat/${roomId}?shared=true`;
      
      if (navigator.share) {
        // 모바일에서 네이티브 공유 기능 사용
        await navigator.share({
          title: `${roomName} - YouCra 채팅방`,
          text: `YouCra에서 ${roomName} 채팅방에 참여해보세요!`,
          url: shareUrl
        });
      } else {
        // 데스크톱에서 클립보드 복사
        await navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }
    } catch (error) {
      console.error('공유하기 실패:', error);
      // 클립보드 API가 실패할 경우 폴백
      try {
        const shareUrl = `${window.location.origin}/chat/${roomId}?shared=true`;
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      } catch (fallbackError) {
        alert('공유 링크 복사에 실패했습니다.');
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
        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 hide-scrollbar" 
        style={{
          background: 'linear-gradient(180deg, #FFFEF7 0%, #FEFDF6 50%, #FDF9F0 100%)',
          paddingBottom: 176, // 입력창 공간을 적절히 확보 (80 + 96)
          paddingTop: 220, // 헤더 높이 + safe-area 고려하여 충분히 확보
          position: 'relative',
          zIndex: 10,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          visibility: isInitialLoad ? 'hidden' : 'visible',
          scrollBehavior: 'auto'
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
                      {/* 닉네임 + 방장 아이콘 */}
                      <div className="text-xl text-gray-600 font-medium max-w-20 truncate mb-1 flex items-center gap-1">
                        {userNickMap[msg.uid] || msg.email?.split('@')[0] || '익명'}
                        {/* 방장 아이콘 표시 */}
                        {roomData && msg.uid === roomData.createdBy && (
                          <span title="방장" className="text-yellow-500 text-xl">👑</span>
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
                            <div className="text-lg leading-relaxed text-left whitespace-pre-wrap font-normal"
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
                          <div className="text-base text-gray-500 opacity-80 select-none whitespace-nowrap">{formatTimeOnly(msg.createdAt)}</div>
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
                        <div className="text-lg leading-relaxed text-left whitespace-pre-wrap font-normal"
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
      <form className="flex items-center px-4 py-4 border-t gap-3 w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-lg rounded-t-2xl" style={{ minHeight: 70, position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 50, boxSizing: 'border-box' }} onSubmit={handleSend}>
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
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-around items-center border-t h-16 z-40 bg-white"
        style={{ pointerEvents: dragging ? 'none' : 'auto' }}
      >
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
            {videoList[selectedVideoIdx]?.videoId ? (
              <YouTube
                key={videoList[selectedVideoIdx].videoId}
                videoId={videoList[selectedVideoIdx].videoId}
                opts={{
                  width: '100%',
                  height: minimized ? '64' : '200',
                  playerVars: { 
                    autoplay: 1,
                    controls: 1,          // YouTube 기본 컨트롤바 활성화
                    rel: 0,               // 관련 영상 비활성화
                    fs: 1,                // 전체화면 버튼 활성화
                  }
                }}
                onReady={handleYoutubeReady}
                onStateChange={handleYoutubeStateChange}
                onEnd={handleYoutubeEnd}
                className="rounded"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                ⚠️ 영상 로딩 중...
              </div>
            )}
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
                  {/* 중앙 드래그 핸들 */}
                  <div className="flex-1 text-center text-xs text-gray-500 font-medium">
                    영상 플레이어 (드래그 가능)
                  </div>
                  
                  {/* 우측 버튼 그룹 */}
                  <div className="flex items-center gap-1">
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
                
                {/* 제목 - 2줄 제한 및 줄임표 표시 */}
                <div 
                  className="font-bold text-sm mb-2 px-1" 
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                  }}
                  title={videoList[selectedVideoIdx].title}
                >
                  {videoList[selectedVideoIdx].title}
                </div>
                
                {/* 시청 시간과 인증 정보를 한 줄로 */}
                <div className="flex flex-col gap-1 text-xs text-gray-600 mb-2 px-1">
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
                  
                  {/* 시청인증 설정 표시 */}
                  <div className="text-center">
                    {watchSettings.enabled ? (
                      <span className="text-purple-600 font-medium">
                        {watchSettings.watchMode === 'partial' ? '⚡ 부분시청' : '🎯 풀시청'} 모드
                      </span>
                    ) : (
                      <span className="text-gray-500">시청인증 비활성화</span>
                    )}
                  </div>
                </div>
                
                {/* 인증 버튼 */}
                <div className="px-1 mb-3">
                  {certifiedVideoIds.includes(videoList[selectedVideoIdx]?.id) ? (
                <button
                      className="w-full py-2.5 bg-green-500 text-white rounded-lg font-medium text-sm"
                      disabled
                    >
                      ✅ 이미 인증 완료
                    </button>
                  ) : certAvailable ? (
                    <div className="space-y-3">
                      <button
                        className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 text-sm transition-colors"
                        onClick={handleCertify}
                        disabled={certLoading}
                      >
                        {certLoading ? "인증 중..." : "🎯 시청 인증하기"}
                </button>
                      
                      {/* 시청인증 활성화 시 자동 다음 영상 카운트다운 */}
                      {watchSettings.enabled && countdown < 5 && (
                        <div className="text-center">
                          <div className={`px-3 py-2.5 rounded-lg border ${
                            selectedVideoIdx >= videoList.length - 1 
                              ? 'bg-red-100 text-red-800 border-red-200' 
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}>
                            <div className="font-medium text-sm">
                              {selectedVideoIdx >= videoList.length - 1 
                                ? '플레이어 자동 종료' 
                                : '다음 영상 자동 이동'}
                            </div>
                            <div className="text-xs mt-1">
                              {countdown}초 후 {selectedVideoIdx >= videoList.length - 1 
                                ? '자동으로 플레이어가 종료됩니다' 
                                : '자동으로 다음 영상으로 이동합니다'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className="w-full py-2.5 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed text-sm"
                      disabled
                    >
                      {watchSettings.enabled 
                        ? (watchSettings.watchMode === 'partial' 
                            ? (videoList[selectedVideoIdx]?.duration >= 180 
                                ? "3분 이상 시청 필요" 
                                : "영상 끝까지 시청 필요")
                            : "영상 끝까지 시청 필요")
                        : "시청인증이 비활성화됨"}
                    </button>
                  )}
                </div>
                
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

      {/* 이미지 모달 */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(null)}
        >
          <div 
            className="relative bg-white rounded-lg max-w-4xl max-h-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800 truncate">
                {showImageModal.name}
              </h3>
              <button
                onClick={() => setShowImageModal(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                title="닫기"
              >
                ×
              </button>
            </div>
            
            {/* 이미지 영역 */}
            <div className="p-4 max-h-[80vh] overflow-auto">
              <img
                src={showImageModal.url}
                alt={showImageModal.name}
                className="max-w-full h-auto mx-auto block rounded"
                style={{ maxHeight: '70vh' }}
              />
            </div>
            
            {/* 모달 푸터 */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  // Base64 이미지는 다운로드 링크를 생성
                  if (showImageModal.url.startsWith('data:')) {
                    const link = document.createElement('a');
                    link.href = showImageModal.url;
                    link.download = showImageModal.name || 'image.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    // Firebase Storage URL은 새 창에서 열기
                    window.open(showImageModal.url, '_blank');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                📥 다운로드
              </button>
              
              <button
                onClick={() => setShowImageModal(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for React-style file upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept="*/*"
      />

      {/* Video Panel Modal 제거됨 - 별도 페이지(/chat/:roomId/videos)로 이동 */}

      {/* 채팅방 정보 패널 제거됨 - 별도 페이지(/chat/:roomId/info)로 이동 */}
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

// === 사용자 인증 횟수 fetch ===
useEffect(() => {
  if (!auth.currentUser || selectedVideoIdx === null || !videoList[selectedVideoIdx] || !roomId) {
    setUserCertCount(0);
    return;
  }
  const fetchCount = async () => {
    try {
      const q = query(
        collection(db, "chatRooms", roomId, "videos", videoList[selectedVideoIdx].id, "certifications"),
        where("uid", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      setUserCertCount(snap.size);
    } catch (e) {
      console.error("cert count error", e);
    }
  };
  fetchCount();
}, [selectedVideoIdx, certifiedVideoIds, auth.currentUser, roomId, videoList]);

export default ChatRoom;
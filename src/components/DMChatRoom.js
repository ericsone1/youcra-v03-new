import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc 
} from "firebase/firestore";

// 유틸리티 함수들 (ChatRoom.js에서 가져옴)
function formatTime(timestamp) {
  if (!timestamp) return "";
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error("시간 포맷 오류:", error);
    return "";
  }
}

function formatTimeOnly(timestamp) {
  if (!timestamp) return "";
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error("시간 포맷 오류:", error);
    return "";
  }
}

function getDayOfWeek(timestamp) {
  if (!timestamp) return "";
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `(${days[date.getDay()]})`;
  } catch (error) {
    console.error("요일 포맷 오류:", error);
    return "";
  }
}

function DMChatRoom() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sending, setSending] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const currentUser = auth.currentUser;
  const MAX_LENGTH = 1000;

  // DM 방 ID 생성 (두 사용자 UID를 알파벳 순으로 정렬)
  const getDMRoomId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  };

  // 상대방 정보 가져오기
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          setOtherUser(userDoc.data());
        }
      } catch (error) {
        console.error("상대방 정보 로드 실패:", error);
      }
    };

    if (uid) {
      fetchOtherUser();
    }
  }, [uid]);

  // 메시지 실시간 구독
  useEffect(() => {
    if (!currentUser || !uid) return;

    const dmRoomId = getDMRoomId(currentUser.uid, uid);
    const messagesRef = collection(db, "directMessages", dmRoomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messageList.push({
          id: doc.id,
          ...data,
          uid: data.senderId // ChatRoom과 일관성 유지
        });
      });
      setMessages(messageList);
      setMessagesLoaded(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, uid]);

  // 메시지 전송
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !currentUser || sending) return;

    try {
      setSending(true);
      const dmRoomId = getDMRoomId(currentUser.uid, uid);
      const messagesRef = collection(db, "directMessages", dmRoomId, "messages");
      
      await addDoc(messagesRef, {
        text: newMsg.trim(),
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0],
        receiverId: uid,
        createdAt: serverTimestamp(),
        isRead: false
      });

      setNewMsg("");
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      alert("메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  // 엔터로 전송
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // 입력 변경 핸들러
  const handleChange = (e) => {
    setNewMsg(e.target.value);
  };

  // 파일 선택 핸들러
  const handleFileSelect = (type) => {
    const input = fileInputRef.current;
    if (!input) return;
    
    input.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : '*/*';
    input.click();
    setShowUploadMenu(false);
  };

  // 파일 입력 변경 핸들러
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert("1:1 채팅에서는 파일 업로드가 아직 지원되지 않습니다.");
    }
    e.target.value = '';
  };

  // 스크롤 관리 (ChatRoom과 동일)
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

    if (messagesLoaded && messages.length > 0) {
      if (isInitialLoad) {
        scrollToBottom(false);
        setIsInitialLoad(false);
      } else {
        setTimeout(() => {
          scrollToBottom(true);
        }, 50);
      }
    }
  }, [messages, isInitialLoad, messagesLoaded]);

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <div className="text-gray-500 text-sm font-medium">대화방을 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 헤더 - ChatRoom 스타일과 동일, 메뉴 버튼 제거 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex-shrink-0 flex items-center px-4 py-3 border-b z-30 bg-rose-100">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center ml-4">
          <div className="font-bold text-lg truncate">
            {otherUser?.displayName || otherUser?.email?.split('@')[0] || '1:1 채팅'}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <span>💬 1:1 채팅</span>
          </div>
        </div>
      </header>

      {/* 채팅메시지 패널 - ChatRoom 스타일 */}
      <main 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 hide-scrollbar" 
        style={{
          background: 'linear-gradient(180deg, #FFFEF7 0%, #FEFDF6 50%, #FDF9F0 100%)',
          paddingBottom: 160, // 입력창 공간 확보
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
                {/* 상대방 메시지 */}
                {!isMine && (
                  <div className="flex items-start mr-2 gap-2">
                    {/* 프로필 이미지 */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shadow border-2 border-white flex-shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                        {(otherUser?.displayName || otherUser?.email?.split('@')[0] || '상대').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    {/* 닉네임과 말풍선 */}
                    <div className="flex flex-col">
                      <div className="text-xs text-gray-600 font-medium max-w-20 truncate mb-1">
                        {otherUser?.displayName || otherUser?.email?.split('@')[0] || '상대방'}
                      </div>
                      <div className="flex items-end gap-2 max-w-[85%]">
                        <div className="relative px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-bl-sm border border-gray-200 shadow-md break-words">
                          <div className="absolute -left-2 bottom-3 w-0 h-0 border-r-8 border-r-white border-t-4 border-t-transparent border-b-4 border-b-transparent drop-shadow-sm"></div>
                          <div className="text-sm leading-relaxed text-left whitespace-pre-wrap font-normal">{msg.text}</div>
                        </div>
                        <div className="flex flex-col items-start gap-1 pb-1">
                          <div className="text-xs text-gray-500 opacity-80 select-none whitespace-nowrap">{formatTimeOnly(msg.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* 내 메시지 */}
                {isMine && (
                  <div className="flex items-end gap-2 max-w-[85%] flex-row-reverse">
                    <div className="relative px-4 py-3 rounded-2xl bg-yellow-300 text-gray-800 rounded-br-sm shadow-md break-words">
                      <div className="absolute -right-2 bottom-3 w-0 h-0 border-l-8 border-l-yellow-300 border-t-4 border-t-transparent border-b-4 border-b-transparent drop-shadow-sm"></div>
                      <div className="text-sm leading-relaxed text-left whitespace-pre-wrap font-normal">{msg.text}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 pb-1">
                      <div className="text-xs text-gray-500 opacity-80 select-none whitespace-nowrap">{formatTimeOnly(msg.createdAt)}</div>
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
      </main>

      {/* 메시지 입력창 - ChatRoom 스타일 */}
      <form 
        className="flex items-center px-4 py-4 border-t gap-3 w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-lg rounded-t-2xl" 
        style={{ 
          minHeight: 70, 
          position: 'fixed', 
          bottom: 72, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 50, 
          boxSizing: 'border-box' 
        }} 
        onSubmit={handleSend}
      >
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
          maxLength={MAX_LENGTH}
          placeholder="메시지를 입력하세요..."
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-xl"
          disabled={sending || !newMsg.trim()}
        >
          {sending ? "전송중..." : "전송"}
        </button>
      </form>

      {/* Hidden file input for React-style file upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept="*/*"
      />

      {/* 푸터(탭 네비게이터) - ChatRoom과 동일 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-around items-center border-t h-16 z-40 bg-white">
        <button className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/')}>🏠<span>홈</span></button>
        <button className="flex flex-col items-center text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/chat')}>💬<span>채팅방</span></button>
        <button className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/board')}>📋<span>게시판</span></button>
        <button className="flex flex-col items-center text-gray-500 hover:text-blue-500 text-sm font-bold focus:outline-none" onClick={() => navigate('/my')}>👤<span>마이채널</span></button>
      </nav>
    </div>
  );
}

export default DMChatRoom;
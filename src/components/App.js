import MyChannel from "./MyChannel";
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import Home from "./Home";
import ChatList from "./ChatList";
import AllChatRooms from "./AllChatRooms"; // 전체 채팅방 컴포넌트 추가
import ChatRoom from "./ChatRoom";
import Board from "./Board";
import LoginPage from "./LoginPage"; // 새로운 이메일 로그인 페이지
import UserProfile from "./UserProfile";
import DMChatRoom from "./DMChatRoom"; // 1:1 채팅방 컴포넌트 import
import VideoListPage from "./VideoListPage"; // 새로 만들 파일
import AddVideoPage from "./AddVideoPage"; // 새 파일
import SearchResult from "./SearchResult";
import ChatRoomManage from "./ChatRoomManage";
import ChatRoomHost from "./ChatRoomHost";
import ChatRoomCreate from "./ChatRoomCreate";
import ProductDetail from "./ProductDetail";
import AdminPage from "./AdminPage";
import ChatRoomInfo from "./ChatRoomInfo";
import CertificationSettings from "./CertificationSettings";
import ChatRoomMenu from "./ChatRoomMenu";
import MyVideosPage from "./MyVideosPage";
import ChatRoomProfile from "./ChatRoomProfile";
import SettingsPage from "./SettingsPage";
import { ToastProvider } from "../contexts/ToastContext";
import ToastContainer from "./common/ToastContainer";
import { AnimatePresence } from 'framer-motion';
import PageWrapper from './common/PageWrapper';
import { VideoPlayerProvider, useVideoPlayer } from "../contexts/VideoPlayerContext";
import GlobalVideoPlayer from "./GlobalVideoPlayer";
import MyPointsPage from "./MyPointsPage";
import MyFeedViewersPage from "./MyFeedViewersPage";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, orderBy, updateDoc } from "firebase/firestore";
import useNotification from "../hooks/useNotification";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useNotification();

  // 탭 순서 정의
  const tabs = [
    { path: '/', name: '홈' },
    { path: '/chat', name: '채팅방' },
    { path: '/board', name: '게시판' },
    { path: '/my', name: '마이채널' }
  ];

  // 터치 이벤트 상태
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  // 디버깅 상태 (개발 모드에서만)
  const [debugInfo, setDebugInfo] = useState({
    touching: false,
    startX: 0,
    currentX: 0,
    distance: 0,
    lastEvent: ''
  });
  const isDev = process.env.NODE_ENV === 'development';

  // 현재 탭 인덱스 찾기
  const getCurrentTabIndex = () => {
    const currentPath = location.pathname;
    const index = tabs.findIndex(tab => {
      if (tab.path === '/') {
        return currentPath === '/';
      }
      return currentPath.startsWith(tab.path);
    });
    return index >= 0 ? index : 0;
  };

  // 스와이프 핸들러
  const handleSwipe = (direction) => {
    const currentIndex = getCurrentTabIndex();
    let newIndex;

    if (direction === 'left') {
      // 왼쪽 스와이프 = 다음 탭
      newIndex = (currentIndex + 1) % tabs.length;
    } else if (direction === 'right') {
      // 오른쪽 스와이프 = 이전 탭
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else {
      return;
    }

    navigate(tabs[newIndex].path);
  };

  // 터치 시작
  const handleTouchStart = (e) => {
    const startX = e.touches[0].clientX;
    setTouchEnd(null);
    setTouchStart(startX);
    
    // 디버깅 정보 업데이트
    setDebugInfo({
      touching: true,
      startX: startX,
      currentX: startX,
      distance: 0,
      lastEvent: 'touchStart'
    });
  };

  // 터치 이동 
  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const currentX = e.touches[0].clientX;
    const distance = touchStart - currentX; // 부호 포함 거리
    const absDistance = Math.abs(distance);
    
    // 디버깅 정보 업데이트
    setDebugInfo(prev => ({
      ...prev,
      currentX: currentX,
      distance: distance,
      lastEvent: 'touchMove'
    }));
    
    // 가로 스와이프가 감지되면 세로 스크롤 방지
    if (absDistance > 20 && e.cancelable) {
      e.preventDefault();
    }
    
    setTouchEnd(currentX);
  };

  // 터치 종료
  const handleTouchEnd = (e) => {
    const finalDistance = touchStart && touchEnd ? touchStart - touchEnd : 0;
    
    // 디버깅 정보 업데이트
    setDebugInfo(prev => ({
      ...prev,
      touching: false,
      distance: finalDistance,
      lastEvent: `touchEnd (${finalDistance > 60 ? 'LEFT' : finalDistance < -60 ? 'RIGHT' : 'NONE'})`
    }));
    
    if (!touchStart || !touchEnd) {
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 60; // 임계값 증가
    const isRightSwipe = distance < -60;

    // 스와이프 감지시 기본 동작 방지
    if ((isLeftSwipe || isRightSwipe) && e.cancelable) {
      e.preventDefault();
      
      if (isLeftSwipe) {
        setSwipeDirection('left');
        setTimeout(() => setSwipeDirection(null), 500);
        handleSwipe('left'); // 왼쪽으로 스와이프 = 다음 탭
      } else if (isRightSwipe) {
        setSwipeDirection('right');
        setTimeout(() => setSwipeDirection(null), 500);
        handleSwipe('right'); // 오른쪽으로 스와이프 = 이전 탭
      }
    }
    
    // 상태 초기화
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "subscribeRequests"),
      where("toUid", "==", auth.currentUser.uid),
      where("notified", "==", false),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          // 알림 표시
          notify("구독 요청", {
            body: `${data.fromName || '사용자'}님이 당신의 채널 구독을 요청했습니다`,
            icon: "/favicon.ico",
          });
          // notified true
          try {
            await updateDoc(change.doc.ref, { notified: true });
          } catch (err) {
            console.error("알림 플래그 업데이트 실패", err);
          }
        }
      });
    });

    return () => unsub();
  }, [auth.currentUser?.uid]);

  return (
    <AuthProvider>
      <ToastProvider>
      <div 
        className="bg-blue-100 min-h-screen pb-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          touchAction: 'pan-y', // 세로 스크롤만 허용
          userSelect: 'none', // 텍스트 선택 방지
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/chat" element={<PageWrapper><ChatList /></PageWrapper>} />
              <Route path="/board" element={<PageWrapper><Board /></PageWrapper>} />
              <Route path="/my" element={<PageWrapper><MyChannel /></PageWrapper>} />
          <Route path="/chats" element={<AllChatRooms />} />
          <Route path="/Chats" element={<AllChatRooms />} />
          <Route path="/chat/create" element={<ChatRoomCreate />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} />
          <Route path="/chat/:roomId/info" element={<ChatRoomInfo />} />
          <Route path="/chat/:roomId/profile" element={<ChatRoomProfile />} />
          <Route path="/chat/:roomId/manage" element={<ChatRoomHost />} />
          <Route path="/chat/:roomId/videos" element={<VideoListPage />} />
          <Route path="/chat/:roomId/certification-settings" element={<CertificationSettings />} />
          <Route path="/chat/:roomId/menu" element={<ChatRoomMenu />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile/:roomId/:uid" element={<UserProfile />} />
          <Route path="/dm/:uid" element={<DMChatRoom />} />
          <Route path="/videos" element={<VideoListPage />} />
          <Route path="/add-video" element={<AddVideoPage />} />
          <Route path="/search" element={<SearchResult />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/my/videos" element={<MyVideosPage />} />
              <Route path="/my/settings" element={<SettingsPage />} />
          <Route path="/my/points" element={<MyPointsPage />} />
          <Route path="/my/viewers" element={<MyFeedViewersPage />} />
          <Route path="/my/feed-viewers" element={<MyFeedViewersPage />} />
        </Routes>
          </AnimatePresence>
        
        {/* 스와이프 피드백 */}
        {swipeDirection && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg z-[9999] pointer-events-none">
            {swipeDirection === 'left' ? '➡️ 다음 탭' : '⬅️ 이전 탭'}
          </div>
        )}
        {/* 하단 네비게이션 바 */}
        <footer className="fixed bottom-0 inset-x-0 bg-white rounded-t-2xl shadow-lg border-t grid grid-cols-4 h-16 z-50">
          <NavLink to="/" className={({isActive}) => `flex flex-col items-center justify-center touch-area ${isActive ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
            <span className="text-xs">홈</span>
          </NavLink>
          <NavLink to="/chat" className={({isActive}) => `flex flex-col items-center justify-center touch-area ${isActive ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m10 0V6a4 4 0 00-8 0v2" /></svg>
            <span className="text-xs">채팅방</span>
          </NavLink>
          <NavLink to="/board" className={({isActive}) => `flex flex-col items-center justify-center touch-area ${isActive ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-xs">게시판</span>
          </NavLink>
          <NavLink to="/my" className={({isActive}) => `flex flex-col items-center justify-center touch-area ${isActive ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-xs">마이채널</span>
          </NavLink>
        </footer>
      </div>
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}

function AppWrapperContent() {
  const { selectedVideoIdx } = useVideoPlayer();
  

  
  return (
    <Router>
      <App />
      {/* 전역 비디오 플레이어 - selectedVideoIdx가 있을 때만 렌더링 */}
      {selectedVideoIdx !== null && (
        <GlobalVideoPlayer />
      )}
    </Router>
  );
}

export default function AppWrapper() {
  return (
    <VideoPlayerProvider>
      <AppWrapperContent />
    </VideoPlayerProvider>
  );
}
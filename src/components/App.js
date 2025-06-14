import MyChannel from "./MyChannel";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
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
import ChatRoomCreate from "./ChatRoomCreate";
import ProductDetail from "./ProductDetail";
import AdminPage from "./AdminPage";
import ChatRoomInfo from "./ChatRoomInfo";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

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
    
    console.log('🔍 TouchStart:', startX);
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
    if (absDistance > 20) {
      e.preventDefault();
    }
    
    setTouchEnd(currentX);
    console.log('🔍 TouchMove:', currentX, 'Distance:', distance);
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
    
    console.log('🔍 TouchEnd:', {
      touchStart,
      touchEnd, 
      distance: finalDistance,
      leftSwipe: finalDistance > 60,
      rightSwipe: finalDistance < -60
    });
    
    if (!touchStart || !touchEnd) {
      console.log('❌ No start/end coordinates');
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 60; // 임계값 증가
    const isRightSwipe = distance < -60;

    // 스와이프 감지시 기본 동작 방지
    if (isLeftSwipe || isRightSwipe) {
      e.preventDefault();
      console.log('✅ Swipe detected!', isLeftSwipe ? 'LEFT' : 'RIGHT');
      
      if (isLeftSwipe) {
        setSwipeDirection('left');
        setTimeout(() => setSwipeDirection(null), 500);
        handleSwipe('left'); // 왼쪽으로 스와이프 = 다음 탭
      } else if (isRightSwipe) {
        setSwipeDirection('right');
        setTimeout(() => setSwipeDirection(null), 500);
        handleSwipe('right'); // 오른쪽으로 스와이프 = 이전 탭
      }
    } else {
      console.log('❌ Swipe distance too small:', distance);
    }
    
    // 상태 초기화
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <AuthProvider>
      <div 
        className="bg-blue-100 min-h-screen pb-safe"
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
        <Routes>
          <Route path="/my" element={<MyChannel />} />
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chats" element={<AllChatRooms />} />
          <Route path="/Chats" element={<AllChatRooms />} />
          <Route path="/chat/create" element={<ChatRoomCreate />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} />
          <Route path="/chat/:roomId/info" element={<ChatRoomInfo />} />
          <Route path="/chat/:roomId/manage" element={<ChatRoomManage />} />
          <Route path="/chat/:roomId/videos" element={<VideoListPage />} />
          <Route path="/board" element={<Board />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile/:roomId/:uid" element={<UserProfile />} />
          <Route path="/dm/:uid" element={<DMChatRoom />} />
          <Route path="/videos" element={<VideoListPage />} />
          <Route path="/add-video" element={<AddVideoPage />} />
          <Route path="/search" element={<SearchResult />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        
        {/* 디버깅 정보 패널 (개발 모드에서만) */}
        {isDev && (
          <div className="fixed top-4 left-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg z-[9999] pointer-events-none font-mono">
            <div>🔍 <strong>터치 디버깅</strong></div>
            <div>상태: {debugInfo.touching ? '🟢 터치중' : '🔴 대기'}</div>
            <div>시작X: {debugInfo.startX.toFixed(0)}</div>
            <div>현재X: {debugInfo.currentX.toFixed(0)}</div>
            <div>거리: {debugInfo.distance.toFixed(0)}px</div>
            <div>마지막: {debugInfo.lastEvent}</div>
            <div>임계값: ±60px</div>
          </div>
        )}

        {/* 스와이프 피드백 */}
        {swipeDirection && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg z-[9999] pointer-events-none">
            {swipeDirection === 'left' ? '➡️ 다음 탭' : '⬅️ 이전 탭'}
          </div>
        )}
        {/* 하단 네비게이션 바 */}
        <footer className="fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-lg border-t flex justify-around items-center h-16 z-50 pb-safe">
          <Link to="/" className={`flex flex-col items-center touch-area ${location.pathname === "/" ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
            <span className="text-xs">홈</span>
          </Link>
          <Link to="/chat" className={`flex flex-col items-center touch-area ${location.pathname.startsWith("/chat") ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m10 0V6a4 4 0 00-8 0v2" /></svg>
            <span className="text-xs">채팅방</span>
          </Link>
          <Link to="/board" className={`flex flex-col items-center touch-area ${location.pathname === "/board" ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-xs">게시판</span>
          </Link>
          <Link to="/my" className={`flex flex-col items-center touch-area ${location.pathname === "/my" ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-xs">마이채널</span>
          </Link>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
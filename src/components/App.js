import MyChannel from "./MyChannel";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthProvider } from "../contexts/AuthContext";
import Home from "./Home";
import ChatList from "./ChatList";
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

  // 드래그 종료 핸들러
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 100; // 스와이프 감도 조절
    const velocity = Math.abs(info.velocity.x);
    const offset = info.offset.x;

    // 충분한 거리나 속도로 스와이프했을 때만 동작
    if (Math.abs(offset) > swipeThreshold || velocity > 500) {
      if (offset > 0) {
        handleSwipe('right'); // 오른쪽으로 드래그 = 이전 탭
      } else {
        handleSwipe('left'); // 왼쪽으로 드래그 = 다음 탭
      }
    }
  };

  return (
    <AuthProvider>
      <motion.div 
        className="bg-blue-100 min-h-screen pb-24"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.98 }}
      >
        <Routes>
          <Route path="/my" element={<MyChannel />} />
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} />
          <Route path="/chat/:roomId/manage" element={<ChatRoomManage />} />
          <Route path="/chat/:roomId/info" element={<ChatRoomInfo />} />
          <Route path="/chat/:roomId/videos" element={<VideoListPage />} />
          <Route path="/chat/:roomId/add-video" element={<AddVideoPage />} />
          <Route path="/board" element={<Board />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile/:roomId/:uid" element={<UserProfile />} />
          <Route path="/dm/:uid" element={<DMChatRoom />} />
          <Route path="/videos" element={<VideoListPage />} />
          <Route path="/add-video" element={<AddVideoPage />} />
          <Route path="/search" element={<SearchResult />} />
          <Route path="/chat/create" element={<ChatRoomCreate />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        {/* 하단 네비게이션 바 */}
        <footer className="fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-lg border-t flex justify-around items-center h-16 z-50">
          <Link to="/" className={`flex flex-col items-center ${location.pathname === "/" ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
            <span className="text-xs">홈</span>
          </Link>
          <Link to="/chat" className={`flex flex-col items-center ${location.pathname.startsWith("/chat") ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m10 0V6a4 4 0 00-8 0v2" /></svg>
            <span className="text-xs">채팅방</span>
          </Link>
          <Link to="/board" className={`flex flex-col items-center ${location.pathname === "/board" ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-xs">게시판</span>
          </Link>
          <Link to="/my" className={`flex flex-col items-center ${location.pathname === "/my" ? "text-blue-500 font-bold" : "text-gray-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-xs">마이채널</span>
          </Link>
        </footer>
      </motion.div>
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
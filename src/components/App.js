import MyChannel from "./MyChannel";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./Home";
import ChatList from "./ChatList";
import ChatRoom from "./ChatRoom";
import Report from "./Report";
import AuthForm from "./AuthForm";
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
  return (
    <div className="bg-blue-100 min-h-screen pb-24">
      <Routes>
        <Route path="/my" element={<MyChannel />} />
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
        <Route path="/chat/:roomId/manage" element={<ChatRoomManage />} />
        <Route path="/chat/:roomId/info" element={<ChatRoomInfo />} />
        <Route path="/chat/:roomId/videos" element={<VideoListPage />} />
        <Route path="/chat/:roomId/add-video" element={<AddVideoPage />} />
        <Route path="/report" element={<Report />} />
        <Route path="/login" element={<AuthForm />} />
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
        <Link to="/report" className={`flex flex-col items-center ${location.pathname === "/report" ? "text-blue-500 font-bold" : "text-gray-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A1 1 0 007.5 17h9a1 1 0 00.85-1.53L17 13M7 13V6a1 1 0 011-1h5a1 1 0 011 1v7" /></svg>
          <span className="text-xs">UCRA공구</span>
        </Link>
        <Link to="/my" className={`flex flex-col items-center ${location.pathname === "/my" ? "text-blue-500 font-bold" : "text-gray-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-xs">마이채널</span>
        </Link>
      </footer>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
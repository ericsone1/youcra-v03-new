import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import SettingsPage from "./components/SettingsPage";
import { useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ToastContainer from './components/ToastContainer';
import { AuthProvider } from "./contexts/AuthContext";
import { VideoPlayerProvider } from "./contexts/VideoPlayerContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import Navigation from "./components/common/Navigation";
import PerformanceMonitor from "./components/common/PerformanceMonitor";
import { WatchedVideosProvider } from './contexts/WatchedVideosContext';

// 공유 링크 처리 컴포넌트
const SharedLinkHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isShared = urlParams.get('shared') === 'true';
    
    if (isShared && location.pathname.includes('/chat/')) {
      // URL에서 방 ID 추출
      const roomId = location.pathname.split('/chat/')[1];
      if (roomId) {
        // 공유된 방 정보를 localStorage에 저장
        localStorage.setItem('sharedRoomId', roomId);
        
        // 로그인하지 않은 상태라면 로그인 페이지로 이동
        const isLoggedIn = localStorage.getItem('tempUser') || localStorage.getItem('isLoggedOut') !== 'true';
        if (!isLoggedIn) {
          navigate('/login?from=shared');
        }
      }
    }
  }, [location, navigate]);
  
  return null;
};

// 현재 위치를 표시하는 디버그 컴포넌트
const LocationDisplay = () => {
  const location = useLocation();

  return null;
};

// 컴포넌트 지연 로딩
import Home from "./components/Home";
// const Home = React.lazy(() => import("./components/Home"));
const Login = React.lazy(() => import("./components/Login"));
const MyChannel = React.lazy(() => import("./components/MyChannel"));
const MyBlog = React.lazy(() => import("./components/MyBlog"));
const TestBlog = React.lazy(() => import("./components/TestBlog"));
const MyChannelMenu = React.lazy(() => import("./components/MyChannel/MyChannelMenu"));
const MyVideosPage = React.lazy(() => import("./components/MyVideosPage"));
const TestVideos = React.lazy(() => import("./components/TestVideos"));
const ChatList = React.lazy(() => import("./components/ChatList"));
const ChatRoom = React.lazy(() => import("./components/ChatRoom"));
const ChatRoomInfo = React.lazy(() => import("./components/ChatRoomInfo"));
const ChatRoomHost = React.lazy(() => import("./components/ChatRoomHost"));
const VideoListPage = React.lazy(() => import("./components/VideoListPage"));
const ChatRoomCreate = React.lazy(() => import("./components/ChatRoomCreate"));
const ChatRoomMenu = React.lazy(() => import("./components/ChatRoomMenu"));
const ChatRoomVote = React.lazy(() => import("./components/ChatRoomVote"));

const UserProfile = React.lazy(() => import("./components/UserProfile"));
const TestProfile = React.lazy(() => import("./components/TestProfile"));
const Board = React.lazy(() => import("./components/Board"));
const DMChatRoom = React.lazy(() => import("./components/DMChatRoom"));
const AllChatRooms = React.lazy(() => import("./components/AllChatRooms"));
const ChatRoomNotice = React.lazy(() => import("./components/ChatRoomNotice"));
const ChatRoomParticipants = React.lazy(() => import("./components/ChatRoomParticipants"));
const ChatRoomContacts = React.lazy(() => import("./components/ChatRoomContacts"));
const YouTubeChannelManager = React.lazy(() => import("./components/MyChannel/YouTubeChannelManager"));
const ChatRoomProfile = React.lazy(() => import("./components/ChatRoomProfile"));
const MyPointsPage = React.lazy(() => import("./components/MyPointsPage"));
const MyViewersPage = React.lazy(() => import("./components/MyFeedViewersPage"));
const MyFeedViewersPage = React.lazy(() => import("./components/MyFeedViewersPage"));

// Fallback 컴포넌트만 유지

// 존재하지 않는 컴포넌트들을 위한 fallback 컴포넌트
const FallbackComponent = ({ componentName }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">개발 중</h2>
      <p className="text-gray-600">{componentName} 컴포넌트가 준비 중입니다.</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <WatchedVideosProvider>
        <VideoPlayerProvider>
          <ToastProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
                {/* 배경 장식 요소 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 blur-3xl"></div>
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full opacity-10 blur-3xl"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400 to-cyan-400 rounded-full opacity-5 blur-3xl"></div>
                </div>

                <ToastContainer />

                {/* 메인 콘텐츠 */}
                <div className="relative z-10 pb-24">
                  <LocationDisplay />
                  <SharedLinkHandler />
                  <Suspense 
                    fallback={
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="spinner"></div>
                          <div className="text-gray-600 font-medium">로딩 중...</div>
                          <div className="text-sm text-gray-400">멋진 경험을 준비하고 있어요 ✨</div>
                        </div>
                      </div>
                    }
                  >
                    <Routes>
                      {/* 공개 라우트 */}
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/test" element={<div style={{padding: '50px', textAlign: 'center', background: 'red', color: 'white', fontSize: '20px'}}>🎉 테스트 성공! 라우팅 작동 중!</div>} />
                      
                      {/* 보호된 라우트 */}
                      <Route
                        path="/my"
                        element={
                          <ProtectedRoute>
                            <MyChannel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/videos"
                        element={
                          <ProtectedRoute>
                            <MyVideosPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/menu"
                        element={
                          <ProtectedRoute>
                            <MyChannelMenu />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/blog"
                        element={
                          <ProtectedRoute>
                            <TestBlog />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/chatrooms"
                        element={
                          <ProtectedRoute>
                            <FallbackComponent componentName="내 채팅방" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/stats"
                        element={
                          <ProtectedRoute>
                            <FallbackComponent componentName="통계" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/channels"
                        element={
                          <ProtectedRoute>
                            <FallbackComponent componentName="채널관리" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/settings"
                        element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/youtube-channel"
                        element={
                          <ProtectedRoute>
                            <YouTubeChannelManager />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat"
                        element={
                          <ProtectedRoute>
                            <ChatList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/create"
                        element={
                          <ProtectedRoute>
                            <ChatRoomCreate />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId"
                        element={
                          <ProtectedRoute>
                            <ChatRoom />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId/info"
                        element={
                          <ProtectedRoute>
                            <ChatRoomInfo />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId/profile"
                        element={
                          <ProtectedRoute>
                            <ChatRoomProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId/manage"
                        element={
                          <ProtectedRoute>
                            <ChatRoomHost />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId/videos"
                        element={
                          <ProtectedRoute>
                            <VideoListPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId/menu"
                        element={
                          <ProtectedRoute>
                            <ChatRoomMenu />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId/vote"
                        element={
                          <ProtectedRoute>
                            <ChatRoomVote />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId/contacts"
                        element={
                          <ProtectedRoute>
                            <ChatRoomContacts />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/board"
                        element={
                          <ProtectedRoute>
                            <Board />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dm/:uid"
                        element={
                          <ProtectedRoute>
                            <DMChatRoom />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/:roomId/:uid"
                        element={
                          <ProtectedRoute>
                            <UserProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/report"
                        element={
                          <ProtectedRoute>
                            <FallbackComponent componentName="Report" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chats"
                        element={
                          <ProtectedRoute>
                            <AllChatRooms />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId/notice"
                        element={
                          <ProtectedRoute>
                            <ChatRoomNotice />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat/:roomId/participants"
                        element={
                          <ProtectedRoute>
                            <ChatRoomParticipants />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/points"
                        element={
                          <ProtectedRoute>
                            <MyPointsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/viewers"
                        element={
                          <ProtectedRoute>
                            <MyFeedViewersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my/feed-viewers"
                        element={
                          <ProtectedRoute>
                            <MyFeedViewersPage />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </Suspense>
                </div>
                
                {/* 하단 네비게이션 바 */}
                <Navigation />
                
                {/* 성능 모니터 (개발 모드에서만) */}
                <PerformanceMonitor 
                  enabled={process.env.NODE_ENV === 'development'}
                  position="bottom-left"
                  minimized={true}
                />
              </div>
            </Router>
          </ToastProvider>
        </VideoPlayerProvider>
      </WatchedVideosProvider>
    </AuthProvider>
  );
}

export default App;
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import Navigation from "./components/common/Navigation";

// 컴포넌트 지연 로딩
const Home = React.lazy(() => import("./components/Home"));
const ChatList = React.lazy(() => import("./components/chat/ChatList"));
const ChatRoom = React.lazy(() => import("./components/chat/ChatRoom"));
const Report = React.lazy(() => import("./components/Report"));
const AuthForm = React.lazy(() => import("./components/auth/AuthForm"));
const MyChannel = React.lazy(() => import("./components/MyChannel"));
const UserProfile = React.lazy(() => import("./components/UserProfile"));
const DMChatRoom = React.lazy(() => import("./components/chat/DMChatRoom"));
const VideoListPage = React.lazy(() => import("./components/video/VideoListPage"));
const AddVideoPage = React.lazy(() => import("./components/video/AddVideoPage"));
const ChatRoomManage = React.lazy(() => import("./components/ChatRoomManage"));
const ChatRoomCreate = React.lazy(() => import("./components/ChatRoomCreate"));
const ChatRoomInfo = React.lazy(() => import("./components/ChatRoomInfo"));

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400 to-cyan-400 rounded-full opacity-5 blur-3xl"></div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 pb-20">
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
            <Route path="/login" element={<AuthForm />} />

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
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatList />
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
              path="/chat/:roomId/manage"
              element={
                <ProtectedRoute>
                  <ChatRoomManage />
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
              path="/chat/:roomId/videos"
              element={
                <ProtectedRoute>
                  <VideoListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <Report />
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
              path="/dm/:uid"
              element={
                <ProtectedRoute>
                  <DMChatRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/videos"
              element={
                <ProtectedRoute>
                  <VideoListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-video"
              element={
                <ProtectedRoute>
                  <AddVideoPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>

      {/* 하단 네비게이션 */}
      <Navigation />
    </div>
  );
}

export default App;
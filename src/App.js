import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import Home from "./components/Home";
import ChatList from "./components/chat/ChatList";
import ChatRoom from "./components/chat/ChatRoom";
import Report from "./components/Report";
import AuthForm from "./components/auth/AuthForm";
import MyChannel from "./components/MyChannel";
import UserProfile from "./components/UserProfile";
import DMChatRoom from "./components/chat/DMChatRoom";
import VideoListPage from "./components/video/VideoListPage";
import AddVideoPage from "./components/video/AddVideoPage";
import Navigation from "./components/common/Navigation";
import ChatRoomManage from "./components/ChatRoomManage";
import ChatRoomCreate from "./components/ChatRoomCreate";
import ChatRoomInfo from "./components/ChatRoomInfo";

function App() {
  return (
    <div className="bg-blue-100 min-h-screen pb-24">
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
      <Navigation />
    </div>
  );
}

export default App;
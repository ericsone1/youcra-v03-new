import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import ChatList from "./components/ChatList";
import ChatRoom from "./components/ChatRoom";
import Report from "./components/Report";
import AuthForm from "./components/AuthForm";

function App() {
  return (
    <Router>
      <div className="bg-blue-100 min-h-screen">
        <nav className="flex gap-4 p-4 bg-white shadow">
          <Link to="/">홈</Link>
          <Link to="/chat">채팅방</Link>
          <Link to="/report">인기 리포트</Link>
          <Link to="/login">로그인</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} />
          <Route path="/report" element={<Report />} />
          <Route path="/login" element={<AuthForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
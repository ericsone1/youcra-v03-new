import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import Navigation from "./components/common/Navigation";

// 컴포넌트 지연 로딩 (존재하는 파일들만)
const Home = React.lazy(() => import("./components/Home"));
const AuthForm = React.lazy(() => import("./components/AuthForm"));

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
      <Router>
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

                {/* 보호된 라우트 - 임시로 fallback 컴포넌트 사용 */}
                <Route
                  path="/my"
                  element={
                    <ProtectedRoute>
                      <FallbackComponent componentName="MyChannel" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <FallbackComponent componentName="ChatList" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:roomId"
                  element={
                    <ProtectedRoute>
                      <FallbackComponent componentName="ChatRoom" />
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
              </Routes>
            </Suspense>
          </div>

          {/* 하단 네비게이션 */}
          <Navigation />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
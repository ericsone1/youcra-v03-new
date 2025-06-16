import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import BottomTabBar from './MyChannel/BottomTabBar';
import YouTubeChannelManager from './MyChannel/YouTubeChannelManager';

function MyVideosPage() {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const user = currentUser;
  const navigate = useNavigate();

  // 로딩 중 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center pb-20 max-w-md mx-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
        <BottomTabBar />
      </div>
    );
  }

  // 로그인이 필요한 화면
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4 sm:p-6 pb-20 max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-100 flex items-center justify-center text-xl sm:text-2xl mx-auto mb-3 sm:mb-4">
            📺
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
            내 유튜브
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            내 유튜브를 관리하려면 로그인이 필요합니다
          </p>

          {/* 로그인 버튼 */}
          <div className="space-y-3 sm:space-y-4">
            <Link
              to="/login"
              className="block w-full bg-red-500 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base hover:bg-red-600 active:bg-red-700 transition-all duration-200 shadow-md"
            >
              📧 로그인하기
            </Link>
          </div>
        </div>

        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-32 max-w-md mx-auto">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my')}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">내 유튜브</h1>
              <p className="text-sm text-gray-500">유튜브 채널 관리</p>
            </div>
          </div>
        </div>
      </div>

      {/* 환영 메시지 */}
      <div className="bg-white mx-4 mt-4 p-6 rounded-xl shadow-sm">
        <div className="text-center">
          <div className="text-4xl mb-3">📺</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">내 유튜브 채널</h2>
          <p className="text-sm text-gray-600">
            안녕하세요, {user?.displayName || user?.email || '사용자'}님!<br/>
            유튜브 채널을 등록하고 관리해보세요.
          </p>
        </div>
      </div>

      {/* YouTube 채널 관리 */}
      <div className="mx-4 mt-4">
        <YouTubeChannelManager />
      </div>

      {/* 메뉴 버튼들 */}
      <div className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">빠른 메뉴</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/my/youtube-channel')}
            className="flex flex-col items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <div className="text-2xl mb-2">🔗</div>
            <span className="text-sm font-medium text-gray-700">채널 등록</span>
          </button>
          
          <button 
            onClick={() => navigate('/chat')}
            className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <div className="text-2xl mb-2">💬</div>
            <span className="text-sm font-medium text-gray-700">채팅방</span>
          </button>
          
          <button 
            onClick={() => navigate('/videos')}
            className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="text-2xl mb-2">🎬</div>
            <span className="text-sm font-medium text-gray-700">영상 목록</span>
          </button>
          
          <button 
            onClick={() => navigate('/my')}
            className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
          >
            <div className="text-2xl mb-2">🏠</div>
            <span className="text-sm font-medium text-gray-700">마이채널</span>
          </button>
        </div>
      </div>

      {/* 하단 탭바 */}
      <BottomTabBar />
    </div>
  );
}

export default MyVideosPage; 
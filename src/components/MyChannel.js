import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './MyChannel/hooks/useProfile';
import CoverImageSection from './MyChannel/CoverImageSection';
import ProfileSection from './MyChannel/ProfileSection';
import VideoListSection from './MyChannel/VideoListSection';
import BottomTabBar from './MyChannel/BottomTabBar';
import YouTubeChannelManager from './MyChannel/YouTubeChannelManager';

function MyChannel() {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const user = currentUser;
  const navigate = useNavigate();

  // 커스텀 훅 사용
  const profileData = useProfile(user);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await logout();
    // 마이채널 페이지에 머물러서 다른 계정으로 로그인 가능하도록 함
  };

  // 시간 포맷 (혹시 필요한 경우를 위해 남겨둠)
  function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return (
      String(date.getFullYear()) +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0") +
      " " +
      String(date.getHours()).padStart(2, "0") +
      ":" +
      String(date.getMinutes()).padStart(2, "0")
    );
  }

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

  // 로그인이 필요한 화면 - 모바일 최적화
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4 sm:p-6 pb-20 max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl sm:text-2xl mx-auto mb-3 sm:mb-4">
            🔒
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
            마이채널
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            마이채널을 이용하려면 로그인이 필요합니다
          </p>

          {/* 로그인 / 회원가입 버튼 */}
          <div className="space-y-3 sm:space-y-4">
            <Link
              to="/login"
              className="block w-full bg-blue-500 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 shadow-md"
            >
              📧 이메일로 로그인
            </Link>

            <Link
              to="/login?mode=signup"
              className="block w-full bg-green-500 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base hover:bg-green-600 active:bg-green-700 transition-all duration-200 shadow-md"
            >
              ✨ 회원가입
            </Link>
          </div>
        </div>

        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-32 max-w-md mx-auto">
      {/* 커버이미지 섹션 (카카오톡 스타일) */}
      <div className="relative">
        {/* 커버이미지 */}
        <CoverImageSection 
          {...profileData}
          user={user}
          isKakaoStyle={true}
        />
        
        {/* 프로필 정보 오버레이 */}
        <div className="absolute inset-0 bg-black bg-opacity-30">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <ProfileSection
              {...profileData}
              user={user}
              handleLogout={handleLogout}
              isKakaoOverlay={true}
            />
          </div>
        </div>
      </div>

      {/* 6개 메뉴 버튼 섹션 (커버이미지 바로 아래) */}
      <div className="bg-white px-4 py-6">
        <div className="grid grid-cols-3 gap-4">
          {/* 첫 번째 줄 */}
          <button 
            onClick={() => navigate('/my/videos')}
            className="flex flex-col items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <div className="text-2xl mb-2">📺</div>
            <span className="text-xs font-medium text-gray-700">내 유튜브</span>
          </button>
          
          <button 
            onClick={() => navigate('/my/blog')}
            className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="text-2xl mb-2">📝</div>
            <span className="text-xs font-medium text-gray-700">내 블로그</span>
          </button>
          
          <button 
            onClick={() => navigate('/chat')}
            className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <div className="text-2xl mb-2">💬</div>
            <span className="text-xs font-medium text-gray-700">내 채팅방</span>
          </button>
          
          {/* 두 번째 줄 */}
          <button 
            onClick={() => navigate('/my/stats')}
            className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <span className="text-xs font-medium text-gray-700">통계</span>
          </button>
          
          <button 
            onClick={() => navigate('/my/youtube-channel')}
            className="flex flex-col items-center p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
          >
            <div className="text-2xl mb-2">🔗</div>
            <span className="text-xs font-medium text-gray-700">채널관리</span>
          </button>
          
          <button 
            onClick={() => navigate('/my/settings')}
            className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <span className="text-xs font-medium text-gray-700">설정</span>
          </button>
        </div>
      </div>

      {/* 영상 리스트 섹션 */}
      <div className="bg-white mt-2 pb-8">
      <VideoListSection />
      </div>

      {/* 하단 탭바 */}
      <BottomTabBar />
    </div>
  );
}

export default MyChannel; 
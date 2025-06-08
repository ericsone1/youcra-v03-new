import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './MyChannel/hooks/useProfile';
import ProfileSection from './MyChannel/ProfileSection';
import BottomTabBar from './MyChannel/BottomTabBar';

function MyChannel() {
  const { currentUser, logout, tempLogin, loading, isAuthenticated } = useAuth();
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
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center pb-24 max-w-md mx-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
        <BottomTabBar />
      </div>
    );
  }

  // 로그인이 필요한 화면 - 모바일 최적화
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4 sm:p-6 pb-24 max-w-md mx-auto">
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

          {/* 임시 로그인 카드 - 모바일 최적화 */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="text-yellow-600 text-xl sm:text-2xl mb-2 sm:mb-3">⚡</div>
            <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">빠른 체험하기</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              임시 계정으로 유크라의 모든 기능을 체험해보세요
            </p>
            <button
              onClick={tempLogin}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base hover:from-yellow-600 hover:to-orange-600 active:from-yellow-700 active:to-orange-700 transition-all duration-200 shadow-md"
            >
              💨 임시 로그인으로 시작하기
            </button>
          </div>

          {/* 구분선 - 모바일 최적화 */}
          <div className="flex items-center my-4 sm:my-6">
            <hr className="flex-1 border-gray-300" />
            <span className="px-2 sm:px-3 text-gray-400 text-xs sm:text-sm">또는</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* 정식 로그인 - 모바일 최적화 */}
          <Link
            to="/login"
            className="block w-full bg-blue-500 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 shadow-md"
          >
            📧 이메일로 로그인
          </Link>
        </div>

        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col pb-24 max-w-md mx-auto">
      {/* 프로필 섹션 - 모바일 최적화 */}
      <ProfileSection
        {...profileData}
        user={user}
        handleLogout={handleLogout}
      />



      {/* 하단 탭바 */}
      <BottomTabBar />
    </div>
  );
}

export default MyChannel; 
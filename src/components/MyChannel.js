import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './MyChannel/hooks/useProfile';
import CoverImageSection from './MyChannel/CoverImageSection';
import ProfileSection from './MyChannel/ProfileSection';
import VideoListSection from './MyChannel/VideoListSection';
import YouTubeChannelManager from './MyChannel/YouTubeChannelManager';
import ProfileEditModal from './MyChannel/ProfileEditModal';

function MyChannel() {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const user = currentUser;
  const navigate = useNavigate();
  
  // 프로필 편집 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 커스텀 훅 사용
  const profileData = useProfile(user);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await logout();
    // 마이채널 페이지에 머물러서 다른 계정으로 로그인 가능하도록 함
  };

  // 프로필 업데이트 핸들러
  const handleProfileUpdate = (updatedProfile) => {
    // 프로필 상태 업데이트
    if (profileData.setProfile) {
      profileData.setProfile(updatedProfile);
    }
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
              onEditProfile={() => setIsEditModalOpen(true)}
              isKakaoOverlay={true}
            />
          </div>
        </div>
        

      </div>

      {/* 3개 메뉴 버튼 섹션 (커버이미지 바로 아래) */}
      <div className="bg-white px-4 py-6">
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => {
              console.log('📺 내 유튜브 버튼 클릭!');
              console.log('이동할 경로: /my/videos');
              navigate('/my/videos');
            }}
            className="flex flex-col items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <div className="text-2xl mb-2">📺</div>
            <span className="text-xs font-medium text-gray-700">내 유튜브</span>
          </button>
          
          <button 
            onClick={() => {
              alert('📝 블로그 기능 구현 예정입니다!\n\n곧 멋진 블로그 기능을 만나보실 수 있습니다. 😊');
            }}
            className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="text-2xl mb-2">📝</div>
            <span className="text-xs font-medium text-gray-700">내 블로그</span>
          </button>
          
          <button 
            onClick={() => navigate('/my/settings')}
            className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <span className="text-xs font-medium text-gray-700">설정</span>
          </button>

          {/* 두 번째 줄 */}
          <button 
            onClick={() => navigate('/my/points')}
            className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
          >
            <div className="text-2xl mb-2">💎</div>
            <span className="text-xs font-medium text-gray-700">내 포인트</span>
          </button>

          <button 
            onClick={() => navigate('/my/viewers')}
            className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <div className="text-2xl mb-2">👥</div>
            <span className="text-xs font-medium text-gray-700">내 시청자</span>
          </button>
        </div>
      </div>

      {/* 영상 리스트 섹션 - 임시 숨김 처리 */}
      {/* <div className="bg-white mt-2 pb-8">
      <VideoListSection />
      </div> */}

      {/* 로그아웃 버튼 */}
      <div className="mt-6 px-4 pb-6">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white py-4 px-6 rounded-xl font-bold text-base transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
        >
          <span className="text-xl">🚪</span>
          <span>로그아웃</span>
        </button>
        <p className="text-center text-xs text-gray-500 mt-2">
          로그아웃 후 다른 계정으로 로그인할 수 있습니다
        </p>
      </div>

      {/* 프로필 편집 모달 */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        profile={profileData.profile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}

export default MyChannel; 
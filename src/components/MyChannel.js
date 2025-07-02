import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './MyChannel/hooks/useProfile';
import CoverImageSection from './MyChannel/CoverImageSection';
import ProfileSection from './MyChannel/ProfileSection';
import VideoListSection from './MyChannel/VideoListSection';
import YouTubeChannelManager from './MyChannel/YouTubeChannelManager';
import ProfileEditModal from './MyChannel/ProfileEditModal';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

function MyChannel() {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const user = currentUser;
  const navigate = useNavigate();
  
  // 프로필 편집 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 커스텀 훅 사용
  const profileData = useProfile(user);

  // 구글 로그인 관련 훅은 항상 최상단에서 선언!
  const [loadingGoogle, setLoadingGoogle] = React.useState(false);
  const [googleError, setGoogleError] = React.useState('');

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

  // 로그인이 필요한 화면 - 모바일 최적화
  if (!isAuthenticated || !user) {
    const handleGoogleLogin = async () => {
      setGoogleError('');
      setLoadingGoogle(true);
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        // Firestore에 사용자 정보 저장/업데이트
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: 'google',
          createdAt: new Date(),
        }, { merge: true });
        window.location.reload(); // 로그인 후 새로고침
      } catch (err) {
        setGoogleError('구글 로그인 실패: ' + err.message);
      } finally {
        setLoadingGoogle(false);
      }
    };
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

          {/* 에러 메시지 */}
          {googleError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{googleError}</p>
            </div>
          )}

          {/* 로그인 / 회원가입 / 구글 로그인 버튼 */}
          <div className="space-y-3 sm:space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="block w-full bg-red-500 hover:bg-red-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5"><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.1 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.18 5.59C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.99 16.1 0 19.94 0 24c0 4.06.99 7.9 2.69 11.9l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.18-5.59c-2.01 1.35-4.59 2.15-8.72 2.15-6.38 0-11.87-3.63-14.33-8.89l-7.98 6.2C6.71 42.9 14.82 48 24 48z"/></svg>
              <span>Google로 로그인</span>
            </button>
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
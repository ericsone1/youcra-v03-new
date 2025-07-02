import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from './hooks/useProfile';
import { useMyVideos } from './hooks/useMyVideos';
import YouTubeChannelManager from './YouTubeChannelManager';
import ProfileSection from './ProfileSection';
import VideoStatus from './VideoStatus';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

import BottomTabBar from './BottomTabBar';

function MyChannel() {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const user = currentUser;
  const navigate = useNavigate();

  // 커스텀 훅들 사용
  const profileData = useProfile(user);
  const videoData = useMyVideos(user, profileData.profile);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await logout();
    navigate("/");
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

  // 로그인이 필요한 화면
  if (!isAuthenticated || !user) {
    // 구글 로그인 핸들러
    const [loadingGoogle, setLoadingGoogle] = React.useState(false);
    const [googleError, setGoogleError] = React.useState('');
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
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 pb-24">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            마이채널
          </h2>
          <p className="text-gray-600 mb-6">
            마이채널을 이용하려면 로그인이 필요합니다
          </p>

          {/* 에러 메시지 */}
          {googleError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{googleError}</p>
            </div>
          )}

          {/* 로그인 / 회원가입 / 구글 로그인 버튼 */}
          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-600 transition-all duration-200 shadow-md"
            >
              📧 이메일로 로그인
            </Link>

            <Link
              to="/login?mode=signup"
              className="block w-full bg-green-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-600 transition-all duration-200 shadow-md"
            >
              ✨ 회원가입
            </Link>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="block w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 text-base transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5"><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.1 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.18 5.59C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.99 16.1 0 19.94 0 24c0 4.06.99 7.9 2.69 11.9l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.18-5.59c-2.01 1.35-4.59 2.15-8.72 2.15-6.38 0-11.87-3.63-14.33-8.89l-7.98 6.2C6.71 42.9 14.82 48 24 48z"/></svg>
              <span>Google로 로그인</span>
            </button>
          </div>
        </div>

        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col pb-24">
      {/* 프로필 섹션 */}
      <ProfileSection
        {...profileData}
        user={user}
        handleLogout={handleLogout}
      />

      {/* YouTube 채널 관리 */}
      <div className="mx-4 mt-6">
        <YouTubeChannelManager />
      </div>

      {/* 영상 현황 */}
      <VideoStatus myVideosData={videoData.myVideosData} />

      {/* 하단 탭바 */}
      <BottomTabBar />
    </div>
  );
}

export default MyChannel; 
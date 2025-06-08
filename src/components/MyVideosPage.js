import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './MyChannel/hooks/useProfile';
import { useMyVideos } from './MyChannel/hooks/useMyVideos';
import YouTubeChannelManager from './MyChannel/YouTubeChannelManager';
import VideoStatus from './MyChannel/VideoStatus';
import BottomTabBar from './MyChannel/BottomTabBar';

function MyVideosPage() {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const user = currentUser;
  const navigate = useNavigate();

  // 커스텀 훅들 사용
  const profileData = useProfile(user);
  const videoData = useMyVideos(user, profileData.profile);

  // 프로필 데이터에서 필요한 값들 추출
  const {
    profile,
    previewUrl,
    newNickname,
    setNewNickname,
    newChannelLink,
    setNewChannelLink,
    saving,
    isEditingNickname,
    setIsEditingNickname,
    fileInputRef,
    nicknameInputRef,
    handleImageChange,
    handleSave,
    handleSaveChannelLink,
    handleNicknameSubmit,
    handleNicknameKeyDown
  } = profileData;

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

  // 로그인이 필요한 화면
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 pb-24 max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="12" fill="white" stroke="#fee2e2" strokeWidth="1"/>
              <path d="M8 6.5v11l8-5.5-8-5.5z" fill="#ef4444"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">내 유튜브</h2>
          <p className="text-gray-600 mb-6">유튜브를 관리하려면 로그인이 필요합니다</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-red-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-red-600 transition"
          >
            로그인하기
          </button>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col pb-24 max-w-md mx-auto">
      {/* 헤더 - 모바일 최적화 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/my')}
              className="text-gray-400 hover:text-gray-600 transition p-1 sm:p-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">내 유튜브</h1>
              <p className="text-xs sm:text-sm text-gray-500">유튜브 채널 관리</p>
            </div>
          </div>
        </div>
      </div>

      {/* 
      ==========================================
      💾 내 채널 등록하기 섹션 - 나중에 사용하기 위해 임시 숨김  
      ==========================================
      
      {/* 내 채널 등록하기 섹션 - 모바일 최적화 */}
      {/*
      {(!profile.channelLink || profile.channelLink === "") && (
        <div className="mx-3 sm:mx-4 mt-4 sm:mt-6">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">내 채널 등록하기</h3>
            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                value={newChannelLink}
                onChange={(e) => setNewChannelLink(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="유튜브/블로그 등 내 채널 링크"
              />
              <button
                onClick={handleSaveChannelLink}
                disabled={saving}
                className="w-full bg-green-500 text-white py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base hover:bg-green-600 active:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
      */}

      {/* YouTube 채널 관리 - 모바일 최적화 */}
      <div className="mx-3 sm:mx-4">
        <YouTubeChannelManager />
      </div>

      {/* 영상 현황 - 모바일 최적화 */}
      <div className="mx-3 sm:mx-4">
        <VideoStatus myVideosData={videoData.myVideosData} />
      </div>

      {/* 하단 탭바 */}
      <BottomTabBar />
    </div>
  );
}

export default MyVideosPage; 
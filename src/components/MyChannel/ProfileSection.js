import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileSection = ({
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
  user,
  handleImageChange,
  handleSave,
  handleSaveChannelLink,
  handleNicknameSubmit,
  handleNicknameKeyDown,
  handleLogout,
  hasBlog,
  blogLoading,
  onEditProfile,
  isOverlay = false,
  isKakaoOverlay = false
}) => {
  const navigate = useNavigate();

  if (isKakaoOverlay) {
    return (
      <div className="flex items-center space-x-4">
        {/* 프로필 이미지 */}
        <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 border-2 border-white flex items-center justify-center text-2xl font-bold text-white overflow-hidden flex-shrink-0">
          {previewUrl ? (
            <img src={previewUrl} alt="프로필" className="w-full h-full object-cover" />
          ) : (
            profile.nickname?.slice(0, 2) || "CH"
          )}
        </div>
        
        {/* 프로필 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-white text-lg font-bold">
              {profile.nickname || user?.displayName || "닉네임 없음"}
            </div>
            {/* 편집 버튼 */}
            <button
              onClick={onEditProfile}
              className="text-white text-opacity-80 hover:text-opacity-100 transition-opacity p-1"
              title="프로필 편집"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div className="text-white text-opacity-80 text-sm">
            {profile.email || user?.email}
          </div>
          {/* 자기소개 표시 */}
          {profile.introduction && (
            <div className="text-white text-opacity-70 text-sm mt-1 line-clamp-2">
              {profile.introduction}
            </div>
          )}
          {profile.point && (
            <div className="text-white text-opacity-70 text-sm mt-1">
              포인트: {profile.point}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* 프로필 이미지 - 모바일 최적화 */}
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${isOverlay ? 'bg-white bg-opacity-20 border-2 border-white' : 'bg-blue-100'} flex items-center justify-center text-2xl sm:text-3xl font-bold ${isOverlay ? 'text-white' : 'text-blue-500'} mb-2 overflow-hidden`}>
        {previewUrl ? (
          <img src={previewUrl} alt="프로필" className="w-full h-full object-cover" />
        ) : (
          profile.nickname?.slice(0, 2) || "CH"
        )}
      </div>
      
      {/* 파일 입력 */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageChange}
      />
      
      {/* 사진 변경 버튼 */}
      <button
        className={`text-xs ${isOverlay ? 'text-white' : 'text-blue-500'} underline mb-2`}
        onClick={() => fileInputRef.current.click()}
      >
        사진 변경
      </button>
      
      {/* 닉네임 섹션 - 모바일 최적화 */}
      <div className="text-base sm:text-lg font-bold mb-1 flex items-center justify-center gap-2">
        {isEditingNickname ? (
          <input
            ref={nicknameInputRef}
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            onKeyDown={handleNicknameKeyDown}
            onBlur={handleNicknameSubmit}
            className="text-base sm:text-lg font-bold text-center bg-transparent border-b-2 border-blue-500 outline-none px-2 py-1 min-w-0"
            placeholder="닉네임 입력"
            maxLength={20}
            autoFocus
          />
        ) : (
          <span className={isOverlay ? 'text-white' : 'text-gray-900'}>{profile.nickname || user?.displayName || "닉네임 없음"}</span>
        )}
        <button
          onClick={() => {
            if (!isEditingNickname) {
              setIsEditingNickname(true);
              setTimeout(() => {
                nicknameInputRef.current?.focus();
                nicknameInputRef.current?.select();
              }, 0);
            }
          }}
          className={`${isOverlay ? 'text-white hover:text-gray-200' : 'text-gray-400 hover:text-blue-500'} transition-colors p-1`}
          title="닉네임 수정"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-4 h-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
            />
          </svg>
        </button>
      </div>
      
      {/* 이메일 정보 - 모바일 최적화 */}
      <div className={`${isOverlay ? 'text-white text-opacity-90' : 'text-gray-500'} text-xs sm:text-sm mb-2 text-center`}>
        <div className="break-all">{profile.email || user?.email}</div>
        <div className="mt-1">
          {user?.isTemporaryUser && (
            <span className={`text-xs px-2 py-1 rounded-full ${isOverlay ? 'bg-yellow-500 bg-opacity-20 text-yellow-200' : 'bg-yellow-100 text-yellow-700'}`}>
              임시 계정
            </span>
          )}
          {user?.isEmailUser && (
            <span className={`text-xs px-2 py-1 rounded-full ${isOverlay ? 'bg-green-500 bg-opacity-20 text-green-200' : 'bg-green-100 text-green-700'}`}>
              인증된 계정
            </span>
          )}
        </div>
      </div>
      
      {/* 자기소개 - 모바일 최적화 */}
      {profile.introduction && (
        <div className={`${isOverlay ? 'text-white text-opacity-80' : 'text-gray-600'} text-xs sm:text-sm mb-3 text-center px-2`}>
          <div className="line-clamp-3 break-words">
            {profile.introduction}
          </div>
        </div>
      )}
      
      {/* 포인트 정보 - 모바일 최적화 */}
      <div className="flex gap-4 text-center mb-3 sm:mb-4">
        <div>
          <div className={`font-bold text-base sm:text-lg ${isOverlay ? 'text-white' : 'text-blue-600'}`}>{profile.point || 0}</div>
          <div className={`text-xs ${isOverlay ? 'text-white text-opacity-70' : 'text-gray-400'}`}>포인트</div>
        </div>
      </div>
      
      {/* 프로필 저장 버튼 - 모바일 최적화 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base transition mb-2 ${
          isOverlay 
            ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 active:bg-opacity-40 border border-white border-opacity-30' 
            : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
        }`}
      >
        {saving ? "저장 중..." : "프로필 저장"}
      </button>
      
      {/* 로그아웃 버튼 - 모바일 최적화 */}
      <button
        onClick={handleLogout}
        className={`w-full py-2.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 mb-6 ${
          isOverlay 
            ? 'bg-red-500 bg-opacity-20 text-red-200 hover:bg-opacity-30 active:bg-opacity-40 border border-red-300 border-opacity-50' 
            : 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 border border-red-200'
        }`}
      >
        🚪 로그아웃
      </button>

      {/* 6개 기능 버튼 그리드 (3x2) - 모바일 최적화 */}
      <div className="w-full mb-8">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* 첫 번째 줄 */}
          {/* 1번: 내 유튜브 */}
          <button
            onClick={() => navigate('/my/videos')}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center min-h-[65px] sm:min-h-[75px] ${
              isOverlay 
                ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white border-opacity-30' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="mb-0.5 sm:mb-1">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <path d="M8 6.5v11l8-5.5-8-5.5z" fill="#ef4444"/>
              </svg>
            </div>
            <div className="text-xs text-center leading-tight font-medium">내 유튜브</div>
          </button>
          
          {/* 2번: 내 블로그 */}
          <button
            onClick={() => navigate('/my/blog')}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center min-h-[65px] sm:min-h-[75px] ${
              isOverlay 
                ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white border-opacity-30' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">📝</div>
            <div className="text-xs text-center leading-tight font-medium">내 블로그</div>
          </button>
          
          {/* 3번: 내 채팅방 */}
          <button
            onClick={() => navigate('/my/chatrooms')}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center min-h-[65px] sm:min-h-[75px] ${
              isOverlay 
                ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white border-opacity-30' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">💬</div>
            <div className="text-xs text-center leading-tight font-medium">채팅방</div>
          </button>

          {/* 두 번째 줄 */}
          {/* 4번: 통계 */}
          <button
            onClick={() => navigate('/my/stats')}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center min-h-[65px] sm:min-h-[75px] ${
              isOverlay 
                ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white border-opacity-30' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">📊</div>
            <div className="text-xs text-center leading-tight font-medium">통계</div>
          </button>
          
          {/* 5번: 채널관리 */}
          <button
            onClick={() => navigate('/my/channels')}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center min-h-[65px] sm:min-h-[75px] ${
              isOverlay 
                ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white border-opacity-30' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">🔗</div>
            <div className="text-xs text-center leading-tight font-medium">채널관리</div>
          </button>
          
          {/* 6번: 설정 */}
          <button
            onClick={() => navigate('/my/settings')}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center min-h-[65px] sm:min-h-[75px] ${
              isOverlay 
                ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white border-opacity-30' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">⚙️</div>
            <div className="text-xs text-center leading-tight font-medium">설정</div>
          </button>
        </div>
      </div>
      
      {/* 채널 바로가기 - 모바일 최적화 */}
      {profile.channelLink && (
        <a
          href={profile.channelLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-3 sm:mt-4 w-full bg-blue-100 text-blue-700 text-center py-2.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base hover:bg-blue-200 active:bg-blue-300 transition"
        >
          내 채널 바로가기
        </a>
      )}
      
      {/* 내 채널 등록 섹션 - 모바일 최적화 */}
      <div className="w-full mt-3 sm:mt-4">
        <div className="mb-2">
          <span className="text-xs sm:text-sm font-semibold text-gray-700">내 채널 등록하기</span>
        </div>
        <input
          type="text"
          value={newChannelLink}
          onChange={(e) => setNewChannelLink(e.target.value)}
          className="w-full border rounded px-2.5 sm:px-3 py-2 text-xs sm:text-sm mb-2"
          placeholder="유튜브/블로그 등 내 채널 링크"
        />
        <button
          onClick={handleSaveChannelLink}
          className="w-full bg-green-500 text-white py-2.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm hover:bg-green-600 active:bg-green-700 transition"
        >
          등록
        </button>
        
        {/* 유튜브 채널 관리 바로가기 */}
        <button
          onClick={() => navigate('/my/youtube-channel')}
          className="w-full bg-red-500 text-white py-2.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm hover:bg-red-600 active:bg-red-700 transition mt-2"
        >
          🎥 유튜브 채널 관리
        </button>
      </div>
    </div>
  );
};

export default ProfileSection; 
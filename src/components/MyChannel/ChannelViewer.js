import React, { useState } from 'react';
import YouTubeChannelManager from './YouTubeChannelManager';
import InstagramCard from './PlatformCards/InstagramCard';
import TikTokCard from './PlatformCards/TikTokCard';

const ChannelViewer = ({ registeredChannels, onShowManagement }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'management'

  // 채널 카드 렌더링 함수
  const renderChannelCard = (channel) => {
    if (channel.platformType === 'youtube') {
      return <YouTubeChannelManager />;
    } else if (channel.platformType === 'instagram') {
      return <InstagramCard channel={channel} />;
    } else if (channel.platformType === 'tiktok') {
      return <TikTokCard channel={channel} />;
    } else {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{channel.platformMeta.icon}</div>
              <div>
                <h3 className="font-bold text-gray-800">{channel.platformMeta.name}</h3>
                <p className="text-sm text-gray-600 truncate max-w-xs">{channel.url}</p>
                <p className="text-xs text-gray-400">
                  {new Date(channel.registeredAt).toLocaleDateString('ko-KR')} 등록
                </p>
              </div>
            </div>
            <a
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition flex-shrink-0"
            >
              바로가기
            </a>
          </div>
        </div>
      );
    }
  };

  // 채널이 없는 경우
  if (!registeredChannels || registeredChannels.length === 0) {
    return <YouTubeChannelManager />;
  }

  // 채널이 하나만 있는 경우
  if (registeredChannels.length === 1) {
    const channel = registeredChannels[0];
    return (
      <div>
        {renderChannelCard(channel)}
      </div>
    );
  }

  // 관리 모드인 경우 (전체 목록 보기)
  if (viewMode === 'management') {
    return (
      <div>
        {/* 관리 모드 헤더 */}
        <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-gray-800">등록된 채널 관리</h3>
          <button
            onClick={() => setViewMode('single')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            돌아가기
          </button>
        </div>

        {/* 전체 채널 목록 */}
        <div className="space-y-4">
          {registeredChannels.map((channel, index) => (
            <div key={channel.id} className="relative">
              {/* 채널 선택 버튼 */}
              <div 
                className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition"
                onClick={() => {
                  setCurrentIndex(index);
                  setViewMode('single');
                }}
                title="이 채널로 이동"
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              {renderChannelCard(channel)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 페이지네이션 모드 (단일 뷰)
  const currentChannel = registeredChannels[currentIndex];
  const totalChannels = registeredChannels.length;

  return (
    <div>
      {/* 페이지네이션 헤더 */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-800">내 채널</h3>
          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {currentIndex + 1} / {totalChannels}
          </span>
        </div>
        
        <button
          onClick={() => setViewMode('management')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          전체 관리
        </button>
      </div>

      {/* 현재 채널 카드 */}
      <div className="relative">
        {renderChannelCard(currentChannel)}
      </div>

      {/* 페이지네이션 컨트롤 */}
      <div className="flex items-center justify-center mt-6 gap-4">
        {/* 이전 버튼 */}
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className={`p-2 rounded-full transition ${
            currentIndex === 0 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 페이지 인디케이터 */}
        <div className="flex gap-2">
          {registeredChannels.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentIndex 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={() => setCurrentIndex(Math.min(totalChannels - 1, currentIndex + 1))}
          disabled={currentIndex === totalChannels - 1}
          className={`p-2 rounded-full transition ${
            currentIndex === totalChannels - 1 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 채널 정보 */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {currentChannel.platformMeta.name} • {new Date(currentChannel.registeredAt).toLocaleDateString('ko-KR')} 등록
        </p>
      </div>
    </div>
  );
};

export default ChannelViewer;
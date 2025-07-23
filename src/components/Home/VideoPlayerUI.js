// 🎨 비디오 플레이어 UI 컴포넌트
// 원본: HomeVideoPlayer.js에서 추출

import React from 'react';
import { createPortal } from 'react-dom';
import { FaBolt, FaYoutube, FaHeart, FaTimes, FaCompress, FaExpand, FaPlay, FaBackward, FaForward, FaFire, FaMinus } from 'react-icons/fa';
import { MdPictureInPicture, MdFullscreen, MdFullscreenExit, MdClose } from 'react-icons/md';
import YouTubePlayerSection from './YouTubePlayerSection';
import PlayerControlsSection from './PlayerControlsSection';
import { formatTime } from './VideoPlayerUtils';

// 최소화된 플레이어 UI
export const MinimizedPlayerUI = ({
  currentVideo,
  video,
  position,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  onClose,
  onRestore,
  handleNextVideo,
  handlePrevVideo,
  videoQueue,
  currentIndex,
  watchSeconds,
  videoDuration,
  certStage,
  fanCertified,
  timer
}) => (
  <div
    className={`fixed z-50 cursor-move transition-all duration-200 ${
      isDragging ? 'scale-105 shadow-2xl' : 'shadow-lg'
    }`}
    style={{
      left: position.x,
      top: position.y,
      width: '100px',
      height: '100px',
      touchAction: 'manipulation'
    }}
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 w-full h-full">
      {/* 최소화된 YouTube 플레이어 */}
      <div className="youtube-player w-full h-full">
        <YouTubePlayerSection
          videoId={currentVideo?.videoId || video.videoId}
          minimized={true}
          onReady={() => {}}
          onStateChange={() => {}}
          onEnd={() => {}}
        />
      </div>
      
      {/* 최소화된 컨트롤 */}
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevVideo();
            }}
            className="p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
            title="이전 영상"
          >
            <FaBackward size={8} className="text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestore && onRestore();
            }}
            className="p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
            title="복원"
          >
            <FaExpand size={8} className="text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextVideo();
            }}
            className="p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
            title="다음 영상"
          >
            <FaForward size={8} className="text-gray-700" />
          </button>
        </div>
      </div>
      
      {/* 닫기 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose && onClose();
        }}
        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        style={{ touchAction: 'manipulation' }}
        title="플레이어 닫기"
      >
        <MdClose size={14} />
      </button>
    </div>
  </div>
);

// 확장된 플레이어 UI
export const ExpandedPlayerUI = ({
  currentVideo,
  video,
  position,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  onClose,
  onMinimize,
  handleNextVideo,
  handlePrevVideo,
  videoQueue,
  currentIndex,
  watchSeconds,
  videoDuration,
  certStage,
  fanCertified,
  timer,
  handleReady,
  handleStateChange,
  handleYoutubeEnd
}) => (
  <div
    className={`fixed z-50 cursor-move transition-all duration-200 ${
      isDragging ? 'scale-105 shadow-2xl' : 'shadow-lg'
    }`}
    style={{
      left: position.x,
      top: position.y,
      width: '400px',
      touchAction: 'manipulation'
    }}
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      {/* 상단 헤더 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-600 ml-2">영상 플레이어</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize && onMinimize(true);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            title="최소화"
          >
            <FaMinus className="text-gray-500 text-sm" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose && onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
            title="닫기"
          >
            <MdClose className="text-gray-500 text-sm hover:text-red-500" />
          </button>
        </div>
      </div>
      
      {/* YouTube 플레이어 */}
      <div className="youtube-player">
        <YouTubePlayerSection
          videoId={currentVideo?.videoId || video.videoId}
          minimized={false}
          onReady={handleReady}
          onStateChange={handleStateChange}
          onEnd={handleYoutubeEnd}
        />
      </div>
      
      {/* 영상 정보 섹션 */}
      <div className="p-3 space-y-3">
        {/* 제목과 채널 */}
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
            <FaFire className="text-white text-xs" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight text-gray-900 mb-1" title={video.title}>
              {video.title}
            </h3>
            <p className="text-xs text-gray-600 font-medium">
              {video.channelTitle || video.channel || '채널명'}
            </p>
          </div>
        </div>
        
        {/* 시청 진행률 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-blue-600 font-bold text-sm">{formatTime(watchSeconds)}</div>
                <div className="text-xs text-blue-500">시청</div>
              </div>
              <div className="w-px h-6 bg-blue-200"></div>
              <div className="text-center">
                <div className="text-gray-700 font-bold text-sm">{formatTime(videoDuration)}</div>
                <div className="text-xs text-gray-500">전체</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-yellow-600 font-bold text-xs bg-yellow-100 px-2 py-1 rounded-full border border-yellow-200">
              <FaBolt size={10}/> 
              <span>풀시청</span>
            </div>
          </div>
          
          {/* 진행률 바 */}
          <div className="w-full bg-blue-200 rounded-full h-1.5 mb-1">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${videoDuration > 0 ? (watchSeconds / videoDuration) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="text-xs text-blue-600 text-center">
            {videoDuration > 0 ? Math.round((watchSeconds / videoDuration) * 100) : 0}% 완료
          </div>
        </div>
        
        {/* 상태 카드 */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{currentIndex + 1}</span>
            </div>
            <div>
              <div className="font-bold text-purple-700 text-sm">
                {certStage === 'countdown' || fanCertified
                  ? '시청 완료 ✨'
                  : `${currentIndex + 1}번째 영상 시청 중`}
              </div>
              <div className="text-purple-600 text-xs">
                {certStage === 'countdown'
                  ? `${timer}초 후 다음 영상으로 이동합니다`
                  : fanCertified
                    ? '인증이 완료되었습니다!'
                    : '90% 시청하면 자동 인증 후 다음 영상으로 이동'}
              </div>
            </div>
          </div>
          
          {videoQueue.length > 1 && (
            <div className="text-purple-600 text-xs bg-purple-100 px-2 py-1 rounded-full text-center border border-purple-200">
              📋 마지막 영상 후 처음부터 반복 재생
            </div>
          )}
        </div>
        
        {/* 유튜브 바로가기 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const videoId = currentVideo?.videoId || video.videoId;
              if (videoId) {
                const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
                window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
              } else {
                console.error('비디오 ID를 찾을 수 없습니다.');
                alert('비디오 ID를 찾을 수 없습니다.');
              }
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold rounded-full px-4 py-2 text-xs shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <FaYoutube size={14} />
            <span>구독/좋아요 바로가기</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

// 메인 비디오 플레이어 UI 컴포넌트
export const VideoPlayerUI = ({
  video,
  minimized,
  position,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  onClose,
  onMinimize,
  onRestore,
  handleNextVideo,
  handlePrevVideo,
  videoQueue,
  currentIndex,
  watchSeconds,
  videoDuration,
  certStage,
  fanCertified,
  timer,
  handleReady,
  handleStateChange,
  handleYoutubeEnd,
  currentVideo
}) => {
  if (!video) {
    console.log('[VideoPlayerUI] video가 없어서 return null');
    return null;
  }

  return createPortal(
    <div>
      {minimized ? (
        <MinimizedPlayerUI
          currentVideo={currentVideo}
          video={video}
          position={position}
          isDragging={isDragging}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          onClose={onClose}
          onRestore={onRestore}
          handleNextVideo={handleNextVideo}
          handlePrevVideo={handlePrevVideo}
          videoQueue={videoQueue}
          currentIndex={currentIndex}
          watchSeconds={watchSeconds}
          videoDuration={videoDuration}
          certStage={certStage}
          fanCertified={fanCertified}
          timer={timer}
        />
      ) : (
        <ExpandedPlayerUI
          currentVideo={currentVideo}
          video={video}
          position={position}
          isDragging={isDragging}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          onClose={onClose}
          onMinimize={onMinimize}
          handleNextVideo={handleNextVideo}
          handlePrevVideo={handlePrevVideo}
          videoQueue={videoQueue}
          currentIndex={currentIndex}
          watchSeconds={watchSeconds}
          videoDuration={videoDuration}
          certStage={certStage}
          fanCertified={fanCertified}
          timer={timer}
          handleReady={handleReady}
          handleStateChange={handleStateChange}
          handleYoutubeEnd={handleYoutubeEnd}
        />
      )}
    </div>,
    document.body
  );
}; 
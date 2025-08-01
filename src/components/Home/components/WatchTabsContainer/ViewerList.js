import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMyVideoViewers } from '../../hooks/useMyVideoViewers';
import { useVideoPlayer } from '../../../../contexts/VideoPlayerContext';
import { useWatchedVideos } from '../../../../contexts/WatchedVideosContext';

export default function ViewerList() {
  const { loading, viewers } = useMyVideoViewers();
  const { handleVideoSelect, updateVideoList, initializePlayer } = useVideoPlayer();
  const { upsertWatched, watchedMap, canRewatch, getWatchInfo } = useWatchedVideos();
  const [selectedViewer, setSelectedViewer] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // watchedMap이 변경될 때마다 컴포넌트를 리렌더링
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [watchedMap]);





  // 시청 상태 확인
  const getVideoWatchStatus = (videoId) => {
    const watchInfo = getWatchInfo(videoId);
    if (!watchInfo.hasWatched) {
      return { status: 'unwatched', label: '시청하기', className: 'bg-blue-500 hover:bg-blue-600' };
    } else if (canRewatch(videoId)) {
      return { status: 'can-rewatch', label: '재시청하기', className: 'bg-green-500 hover:bg-green-600' };
    } else {
      return { status: 'watched', label: '시청완료', className: 'bg-gray-400 cursor-not-allowed' };
    }
  };

  const handleVideoPlay = async (playerVideo, allVideos) => {
    try {
      console.log('🎬 [ViewerList] 영상 재생 시작:', {
        selectedVideo: playerVideo.title,
        videoId: playerVideo.videoId,
        allVideosCount: allVideos?.length || 1
      });
      
      // 영상 리스트와 현재 영상 인덱스로 플레이어 초기화
      const videoList = allVideos || [playerVideo];
      const currentIndex = allVideos 
        ? allVideos.findIndex(v => (v.videoId || v.id) === playerVideo.videoId)
        : 0;
      
      console.log('🎯 [ViewerList] initializePlayer 호출:', {
        roomId: 'viewer-videos',
        videoListLength: videoList.length,
        currentIndex
      });
      
      // 시청 시작 기록 (재시청 가능한 경우에만)
      const watchInfo = getWatchInfo(playerVideo.videoId);
      if (!watchInfo.hasWatched || canRewatch(playerVideo.videoId)) {
        console.log('📝 [ViewerList] 시청 시작 기록:', playerVideo.videoId);
        upsertWatched(playerVideo.videoId, {
          startedAt: new Date().toISOString(),
          context: 'viewer-list'
        });
      }
      
      // initializePlayer를 사용하여 자동재생 리스트 설정
      initializePlayer('viewer-videos', videoList, currentIndex);

    } catch (error) {
      console.error('❌ [ViewerList] 영상 재생 오류:', error);
    }
  };

  // 로딩 중이거나 시청자가 없을 때는 계속 로딩 표시
  if (loading || viewers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-800">시청자 정보를 불러오는 중...</p>
          <p className="text-sm text-gray-500 mt-1">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  // 시청자 리스트 표시
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 p-4"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">내 영상 시청자</h2>
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          총 {viewers.length}명
        </span>
      </div>

      {viewers.map((viewer, index) => (
        <div key={viewer.user.uid} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* 시청자 정보 헤더 */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={viewer.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewer.user.displayName || viewer.user.email || 'User')}&background=random`}
                    alt={viewer.user.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewer.user.displayName || viewer.user.email || 'User')}&background=random`;
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {viewer.user.displayName || viewer.user.email || '익명 사용자'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      내 영상 {viewer.watchedMyVideos?.length || 0}회 시청
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* YouTube 채널 바로가기 버튼 */}
                  {viewer.user.youtubeChannel?.channelId && (
                    <button
                      onClick={() => {
                        // YouTube 채널로 이동
                        window.open(`https://www.youtube.com/channel/${viewer.user.youtubeChannel.channelId}`, '_blank');
                      }}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors flex items-center space-x-1"
                      title="YouTube 채널 바로가기"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span>YouTube</span>
                    </button>
                  )}
                  
                  {/* 펼치기/접기 버튼 */}
                  <button
                    onClick={() => setSelectedViewer(selectedViewer === viewer.user.uid ? null : viewer.user.uid)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${selectedViewer === viewer.user.uid ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
          </div>

          {/* 상세 정보 (펼쳐진 상태) */}
          {selectedViewer === viewer.user.uid && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 space-y-4"
            >



            </motion.div>
          )}
        </div>
      ))}
    </motion.div>
  );
} 
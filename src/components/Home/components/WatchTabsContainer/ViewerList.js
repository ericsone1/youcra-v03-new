import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMyVideoViewers } from '../../hooks/useMyVideoViewers';
import { useVideoPlayer } from '../../../../contexts/VideoPlayerContext';
import { useWatchedVideos } from '../../../../contexts/WatchedVideosContext';
import { useUcraVideos } from '../../hooks/useUcraVideos';

export default function ViewerList() {
  const { loading, viewers } = useMyVideoViewers();
  const { handleVideoSelect, updateVideoList, initializePlayer } = useVideoPlayer();
  const { upsertWatched, watchedMap, canRewatch, getWatchInfo } = useWatchedVideos();
  const { ucraVideos } = useUcraVideos(); // "내가 시청할 영상" 데이터 추가
  const [selectedViewer, setSelectedViewer] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // watchedMap이 변경될 때마다 컴포넌트를 리렌더링
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [watchedMap]);

  // 시청자의 영상 중에서 "내가 시청할 영상" 리스트에 있는 것들만 필터링
  const getFilteredViewerVideos = (viewerVideos) => {
    return viewerVideos.filter(viewerVideo => 
      ucraVideos.some(ucraVideo => 
        ucraVideo.videoId === viewerVideo.videoId || ucraVideo.id === viewerVideo.videoId
      )
    );
  };



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
                    내 영상 {viewer.watchedMyVideos?.length || 0}개 시청
                  </p>
                </div>
              </div>
              
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

          {/* 상세 정보 (펼쳐진 상태) */}
          {selectedViewer === viewer.user.uid && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 space-y-4"
            >


              {/* 시청자가 업로드한 영상들 (내가 시청할 영상 리스트에 있는 것만) */}
              {(() => {
                const filteredVideos = getFilteredViewerVideos(viewer.uploadedVideos || []);
                
                if (filteredVideos.length === 0) {
                  return (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">이 시청자의 영상 중 시청 가능한 영상이 없습니다.</p>
                      <p className="text-xs mt-1">전체 영상: {viewer.uploadedVideos?.length || 0}개</p>
                    </div>
                  );
                }
                
                return (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">
                      {viewer.user.displayName || '이 사용자'}가 업로드한 영상 
                      <span className="text-sm text-blue-600 font-normal">
                        (시청 가능: {filteredVideos.length}개 / 전체: {viewer.uploadedVideos?.length || 0}개)
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {filteredVideos.map((video, idx) => {
                      const watchStatus = getVideoWatchStatus(video.videoId);
                      const playerVideo = {
                        videoId: video.videoId,
                        id: video.videoId, // id 속성 추가 (VideoPlayerContext에서 필요)
                        title: video.title,
                        channel: video.channel || '채널명 없음',
                        channelTitle: video.channelTitle || viewer.user.displayName || '채널명 없음',
                        duration: video.durationDisplay || video.duration,
                        durationDisplay: video.durationDisplay || video.duration,
                        thumbnail: `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`,
                        description: video.description || '',
                        ucraViewCount: video.ucraViewCount || 0
                      };

                      return (
                        <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-20 h-15 object-cover rounded"
                            onError={(e) => {
                              e.target.src = `https://img.youtube.com/vi/${video.videoId}/default.jpg`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{video.title}</p>
                            <p className="text-xs text-gray-500">
                              {video.durationDisplay || video.duration} • 
                              유크라 조회수 {video.ucraViewCount || 0}회
                              {getWatchInfo(video.videoId).watchCount > 0 && ` • 내가 ${getWatchInfo(video.videoId).watchCount}회 시청`}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              // 시청 가능한 영상들만 playerVideo 형태로 변환
                              const allFilteredVideos = getFilteredViewerVideos(viewer.uploadedVideos || []).map(v => ({
                                videoId: v.videoId,
                                id: v.videoId, // id 속성 추가 (중요!)
                                title: v.title,
                                channelTitle: v.channelTitle || viewer.user.displayName,
                                channel: v.channel || '채널명 없음',
                                duration: v.duration,
                                durationDisplay: v.durationDisplay,
                                thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
                                description: v.description || '',
                                ucraViewCount: v.ucraViewCount || 0
                              }));
                              
                              console.log('🎬 [ViewerList] 시청하기 클릭 (필터링됨):', {
                                selectedVideo: playerVideo.title,
                                selectedVideoId: playerVideo.videoId,
                                totalVideos: viewer.uploadedVideos?.length || 0,
                                filteredVideosCount: allFilteredVideos.length,
                                filteredVideos: allFilteredVideos
                              });
                              
                              handleVideoPlay(playerVideo, allFilteredVideos);
                            }}
                            disabled={watchStatus.status === 'watched'}
                            className={`px-3 py-1 text-xs text-white rounded-full transition-colors ${watchStatus.className}`}
                          >
                            {watchStatus.label}
                          </button>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </div>
      ))}
    </motion.div>
  );
} 
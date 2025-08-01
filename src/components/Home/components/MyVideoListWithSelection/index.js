import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoList } from './VideoList';
import { SelectedVideos } from './SelectedVideos';
import { API_KEY } from '../../utils/constants';
import { db } from '../../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const MyVideoListWithSelection = ({ channelInfo, selectedVideos, onVideosChange, collapsed, onExpand, onComplete = () => {}, currentUser, onRequireLogin = () => {} }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('MyVideoListWithSelection props:', { channelInfo, selectedVideos, collapsed });

  // 영상 시간을 초를 분:초 형식으로 변환
  const formatDuration = (duration) => {
    if (!duration) return '0:00';
    
    // ISO 8601 duration format (PT4M13S) 파싱
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // 조회수 포맷팅
  const formatViewCount = (count) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // 실제 YouTube API로 채널 영상 가져오기
  const fetchChannelVideos = async (channelId) => {
    console.log('API_KEY 확인:', API_KEY ? 'API 키 설정됨' : 'API 키 없음');
    if (!API_KEY) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    try {
      // 1. 채널의 업로드 플레이리스트 ID 가져오기
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
      );
      const channelData = await channelResponse.json();
      
      if (channelData.error) {
        throw new Error(channelData.error.message);
      }
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('채널을 찾을 수 없습니다.');
      }
      
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
      
      // 2. 업로드 플레이리스트에서 영상 목록 가져오기
      const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}`
      );
      const playlistData = await playlistResponse.json();
      
      if (playlistData.error) {
        throw new Error(playlistData.error.message);
      }
      
      if (!playlistData.items || playlistData.items.length === 0) {
        return [];
      }
      
      // 3. 영상 ID 목록 추출
      const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');
      
      // 4. 영상 상세 정보 가져오기 (통계, 시간 등)
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
      );
      const videosData = await videosResponse.json();
      
      if (videosData.error) {
        throw new Error(videosData.error.message);
      }
      
      // 5. 데이터 변환
      return videosData.items.map(video => {
        const duration = formatDuration(video.contentDetails.duration);
        const isShort = video.contentDetails.duration && 
          (parseInt(video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)?.[1] || 0) === 0 && 
           parseInt(video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)?.[2] || 0) <= 60) ||
          (parseInt(video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)?.[1] || 0) === 1 && 
           parseInt(video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)?.[2] || 0) === 0);
        
        return {
          id: video.id,
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
          duration: duration,
          publishedAt: video.snippet.publishedAt,
          views: formatViewCount(video.statistics.viewCount || '0') + ' 조회',
          type: isShort ? 'short' : 'long'
        };
      });
      
    } catch (error) {
      console.error('YouTube API 오류:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchVideos = async () => {
      console.log('fetchVideos 호출됨:', { channelInfo });
      
      if (!channelInfo || !channelInfo.id) {
        console.log('채널 정보 없음:', { channelInfo });
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('YouTube API 호출 시작:', channelInfo.id);
        const channelVideos = await fetchChannelVideos(channelInfo.id);
        console.log('가져온 영상 목록:', channelVideos);
        setVideos(channelVideos);
      } catch (err) {
        console.error('영상 목록 로드 오류:', err);
        setError(err.message || '영상 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [channelInfo]);

  const handleVideoSelect = (video) => {
    if (selectedVideos.some(v => v.id === video.id)) {
      onVideosChange(selectedVideos.filter(v => v.id !== video.id));
    } else if (selectedVideos.length < 3) {
      onVideosChange([...selectedVideos, video]);
    }
  };

  // 선택 완료 시 videos 컬렉션에 저장
  const handleComplete = async () => {
    console.log('🎯 MyVideoListWithSelection - 선택 완료 버튼 클릭');
    console.log('📹 선택된 영상들:', selectedVideos);
    
    // 선택 완료되었으므로 항상 onComplete 콜백 호출
    if (onComplete) {
      console.log('📞 onComplete 콜백 호출 중...');
      onComplete(selectedVideos);
    }
    
    if (!currentUser) {
      console.log('🔐 로그인 필요 - onRequireLogin 호출');
      if (onRequireLogin) onRequireLogin();
      return;
    }
    
    // 로그인된 상태라면 Firestore에 저장
    console.log('💾 Firestore에 영상 저장 중...');
    try {
      for (const video of selectedVideos) {
        // 루트 videos 컬렉션에 저장
        const videoDoc = await addDoc(collection(db, "videos"), {
          ...video,
          registeredBy: currentUser.uid,
          uploaderUid: currentUser.uid,
          uploaderName: currentUser.displayName || "익명",
          uploaderEmail: currentUser.email || "",
          registeredAt: serverTimestamp(),
        });
        
        // 사용자의 개인 myVideos 컬렉션에도 저장
        try {
          await addDoc(collection(db, "users", currentUser.uid, "myVideos"), {
            ...video,
            videoId: video.videoId,
            registeredBy: currentUser.uid,
            uploaderUid: currentUser.uid,
            uploaderName: currentUser.displayName || "익명",
            uploaderEmail: currentUser.email || "",
            registeredAt: serverTimestamp(),
            // 루트 videos 컬렉션의 문서 ID도 저장
            rootVideoId: videoDoc.id
          });
        } catch (error) {
          console.warn("⚠️ 사용자 myVideos 컬렉션 저장 실패:", error);
        }
      }
      console.log('✅ Firestore 저장 완료');
    } catch (error) {
      console.error('❌ Firestore 저장 실패:', error);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">영상 목록 불러오는 중...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="text-center text-red-500 py-8">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </motion.div>
    );
  }

  if (collapsed) {
    return (
      <motion.div 
        className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.span 
          className="text-base font-bold text-gray-900"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          📺 내 채널 영상
        </motion.span>
        <div className="flex items-center gap-2 ml-auto">
          {selectedVideos.slice(0, 5).map((video, idx) => (
            <img
              key={video.id}
              src={video.thumbnail || video.thumbnailUrl}
              alt={video.title}
              className="w-8 h-8 object-cover rounded border border-gray-200 shadow-sm"
              style={{ marginLeft: idx === 0 ? 0 : -8, zIndex: 10 - idx }}
              onError={e => { e.target.src = 'https://img.youtube.com/vi/' + (video.videoId || video.id) + '/mqdefault.jpg'; }}
            />
          ))}
          <span className="ml-2 text-xs text-gray-500 font-semibold">{selectedVideos.length}/5</span>
          <motion.button 
            onClick={onExpand} 
            className="ml-4 px-3 py-1 text-blue-600 hover:underline text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            수정
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          📺 내 채널 영상
        </h2>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500">
          최대 3개의 영상을 선택할 수 있습니다. ({selectedVideos.length}/3)
        </p>
      </div>

      {/* 선택된 영상 미리보기 */}
      {selectedVideos.length > 0 && (
        <SelectedVideos
          selectedVideos={selectedVideos}
          onVideoRemove={handleVideoSelect}
        />
      )}

      {/* 영상 목록 */}
      <AnimatePresence>
        {!collapsed && (
          <>
            {videos.length > 0 ? (
              <VideoList
                videos={videos}
                selectedVideos={selectedVideos}
                onVideoSelect={handleVideoSelect}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-lg p-8 text-center"
              >
                <div className="text-gray-400 text-4xl mb-3">📺</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  영상을 불러올 수 없습니다
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {!channelInfo || !channelInfo.id 
                    ? '채널 정보가 없습니다. 채널을 먼저 등록해주세요.' 
                    : '채널에 공개된 영상이 없거나 API 오류가 발생했습니다.'
                  }
                </p>
                {channelInfo && channelInfo.id && (
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    다시 시도
                  </button>
                )}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* 선택 완료 버튼: compact가 아닐 때, 1개 이상 선택 시 항상 노출 */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4"
        >
          <button
            onClick={handleComplete}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              selectedVideos.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            disabled={selectedVideos.length === 0}
          >
            {selectedVideos.length === 0 ? '영상을 선택해주세요' : '선택 완료'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}; 
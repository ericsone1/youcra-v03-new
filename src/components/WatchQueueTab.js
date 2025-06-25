import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaThumbsUp, FaHeart } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { parseDuration } from './Home/utils/videoUtils';

const WatchQueueTab = ({ filter, onFilterChange, handleImageError, handleWatchVideo }) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState('recent'); // recent | views | duration | watch

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    async function fetchVideos() {
      const roomsQuery = query(collection(db, "chatRooms"));
      const roomsSnapshot = await getDocs(roomsQuery);
      const allVideos = [];
      const videoIdSet = new Set();
      for (const roomDoc of roomsSnapshot.docs) {
        const videosQuery = query(
          collection(db, "chatRooms", roomDoc.id, "videos"),
          orderBy("registeredAt", "desc")
        );
        const videosSnapshot = await getDocs(videosQuery);
        videosSnapshot.forEach(videoDoc => {
          const videoData = videoDoc.data();
          if (
            videoData.registeredBy !== user.uid &&
            videoData.registeredBy !== user.email
          ) {
            // videoId 보정: Firestore 문서 id가 11자리면 videoId로 간주, 아니면 videoData.videoId 사용
            let videoId = videoData.videoId;
            if ((!videoId || typeof videoId !== 'string' || videoId.length !== 11) && videoDoc.id && videoDoc.id.length === 11) {
              videoId = videoDoc.id;
            }
            // videoId가 11자리 문자열이 아니면 제외
            if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) return;
            // duration 파싱 (숏폼/롱폼 분류용)
            let durationSec = 0;
            if (typeof videoData.duration === 'string') {
              durationSec = parseDuration(videoData.duration);
            } else if (typeof videoData.duration === 'number') {
              durationSec = videoData.duration;
            }
            if (videoIdSet.has(videoId)) return; // deduplicate
            videoIdSet.add(videoId);
            allVideos.push({
              ...videoData,
              id: videoDoc.id,
              videoId, // 반드시 포함
              roomId: roomDoc.id,
              roomName: roomDoc.data().name || '제목 없음',
              durationSec,
              type: durationSec <= 180 ? 'short' : 'long',
              thumbnailUrl: videoData.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              channelName: videoData.channelTitle || videoData.channel || '',
              views: videoData.views || 0,
              watchCount: videoData.watchCount || 0,
            });
          }
        });
      }
      console.log('시청 리스트', allVideos); // 디버깅용
      setVideos(allVideos);
      setLoading(false);
    }
    fetchVideos();
  }, [user]);

  // 필터링
  const filteredVideos = videos.filter(video => {
    if (filter === 'all') return true;
    return video.type === filter;
  });

  // 정렬
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortKey) {
      case 'views':
        return b.views - a.views;
      case 'duration':
        return a.durationSec - b.durationSec; // 짧은 영상 먼저
      case 'watch':
        return b.watchCount - a.watchCount;
      default: // recent
        return 0;
    }
  });

  // 페이지네이션
  const VIDEOS_PER_PAGE = 5;
  const displayedVideos = sortedVideos.slice(0, (page + 1) * VIDEOS_PER_PAGE);

  // 정렬, 필터, 영상 목록이 바뀌면 페이지 초기화
  useEffect(() => {
    setPage(0);
  }, [filter, sortKey, videos]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 mx-4"
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'all' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => onFilterChange('all')}
        >전체</button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'short' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => onFilterChange('short')}
        >숏폼</button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'long' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => onFilterChange('long')}
        >롱폼</button>
        <select
          value={sortKey}
          onChange={(e)=>setSortKey(e.target.value)}
          className="ml-auto px-3 py-2 rounded-lg border text-sm"
        >
          <option value="recent">최신순</option>
          <option value="watch">시청순</option>
          <option value="duration">영상길이순</option>
          <option value="views">조회수순</option>
        </select>
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-500">영상 목록을 불러오는 중...</div>
      ) : sortedVideos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaPlay className="text-4xl mx-auto mb-2 opacity-30" />
          <p>시청할 영상이 없습니다</p>
          <p className="text-sm">다른 사용자가 영상을 등록하면 나타납니다</p>
        </div>
      ) : (
        displayedVideos.map((video, index) => (
          <motion.div
            key={video.id}
            className="bg-white rounded-2xl p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex gap-3">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-20 h-14 rounded-lg object-cover"
                onError={handleImageError}
              />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{video.title}</h4>
                <p className="text-xs text-gray-500 mb-2">{video.channelName}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{typeof video.duration === 'number' ? `${Math.floor(video.duration/60)}:${(video.duration%60).toString().padStart(2,'0')}` : video.duration}</span>
                  <span>•</span>
                  <span>조회수 {video.views?.toLocaleString?.() || 0}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    video.type === 'short' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {video.type === 'short' ? '숏폼' : '롱폼'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleWatchVideo(video, sortedVideos)}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <FaPlay className="inline mr-1" />
                시청하기
              </button>
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <FaThumbsUp className="text-gray-600" />
              </button>
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <FaHeart className="text-gray-600" />
              </button>
            </div>
          </motion.div>
        ))
      )}

      {/* 더보기 버튼 */}
      {displayedVideos.length < sortedVideos.length && (
        <div className="text-center mt-4">
          <button
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-600"
            onClick={() => setPage(prev => prev + 1)}
          >
            더보기
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(WatchQueueTab); 
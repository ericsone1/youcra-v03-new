import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WatchVideoList } from './WatchVideoList';
import ViewerList from './ViewerList';
import { TabButtons } from './TabButtons';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useVideoPlayer } from '../../../../contexts/VideoPlayerContext';
import { useUcraVideos } from '../../hooks/useUcraVideos';
import { computeUniqueVideos } from '../../utils/videoUtils';
import { VideoListRenderer } from './WatchVideoList';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../../../firebase';
import { doc, setDoc } from 'firebase/firestore';

// 재시청 리스트 컴포넌트
const WatchRewatchList = () => {
  const { certifiedVideoIds, initializePlayer } = useVideoPlayer();
  const { ucraVideos, loadingUcraVideos } = useUcraVideos();
  const { currentUser } = useAuth();
  
  // 내 영상 제외 (강화된 필터링)
  const filteredVideos = ucraVideos.filter(video => {
    if (!currentUser) return true;
    
    const isMyVideo = 
      video.registeredBy === currentUser.uid ||
      video.registeredBy === currentUser.email ||
      video.uploaderUid === currentUser.uid ||
      video.channelId === currentUser.uid ||
      video.channelTitle === currentUser.displayName ||
      (video.uploader && video.uploader === currentUser.displayName) ||
      (video.channel && video.channel === currentUser.displayName) ||
      (video.registeredByEmail && video.registeredByEmail === currentUser.email) ||
      (video.registeredByUid && video.registeredByUid === currentUser.uid) ||
      (video.channelUrl && video.channelUrl.includes(currentUser.uid)) ||
      (currentUser.displayName && video.title && 
       video.title.toLowerCase().includes(currentUser.displayName.toLowerCase()));
    
    return !isMyVideo;
  });
  
  // 중복 제거
  const uniqueVideos = computeUniqueVideos(filteredVideos);
  // 시청 완료된 영상만 필터링 (전체/숏폼/롱폼 구분 제거)
  let displayVideos = uniqueVideos.filter(v => certifiedVideoIds.includes(v.videoId));
  
  // 정렬(기본: 최신순)
  displayVideos = [...displayVideos].sort((a, b) => {
    const aTime = a.registeredAt?.seconds || 0;
    const bTime = b.registeredAt?.seconds || 0;
    return bTime - aTime;
  });
  return (
    <VideoListRenderer
      videos={displayVideos}
      onWatchClick={(video, idx) => {
        initializePlayer('watchqueue', displayVideos, idx);
      }}
    />
  );
};

export const WatchTabsContainer = (props) => {
  const {
    activeTab,
    onTabChange,
    videoFilter,
    onFilterChange,
    onTokenEarned,
    onWatchClick,
    getWatchCount,
    selectedCategories,
    selectedVideos,
    onWatchComplete = () => {} // 시청 완료 콜백 추가
  } = props;
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState('latest');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      {/* 메인 탭 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <TabButtons
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </motion.div>

      {/* 필터 + 정렬 옵션 */}
      {activeTab === 'watch' && (
        <div className="flex flex-wrap gap-2 px-4 pt-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-full text-sm border ${videoFilter === 'all' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
              onClick={() => onFilterChange('all')}
            >전체</button>
            <button
              className={`px-3 py-1 rounded-full text-sm border ${videoFilter === 'short' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
              onClick={() => onFilterChange('short')}
            >숏폼</button>
            <button
              className={`px-3 py-1 rounded-full text-sm border ${videoFilter === 'long' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
              onClick={() => onFilterChange('long')}
            >롱폼</button>
          </div>
          <div>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              className="px-3 py-1 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="duration">영상 길이순</option>
              <option value="latest">최신순</option>
              <option value="views">조회수순</option>
            </select>
          </div>
        </div>
      )}

      {/* 컨텐츠 영역 */}
      <motion.div 
        className="p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'watch' ? (
            <motion.div
              key="watch"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WatchVideoList
                key="watch"
                videoFilter={videoFilter}
                sortKey={sortKey}
                onTokenEarned={onTokenEarned}
                onWatchClick={onWatchClick}
                selectedCategories={selectedCategories}
                selectedVideos={selectedVideos}
                getWatchCount={getWatchCount}
                onWatchComplete={onWatchComplete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="viewers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ViewerList />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default WatchTabsContainer; 
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WatchVideoList } from './WatchVideoList';
import { ViewerList } from './ViewerList';
import { TabButtons } from './TabButtons';
import { FilterButtons } from './FilterButtons';
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
const WatchRewatchList = ({ videoFilter }) => {
  const { certifiedVideoIds, initializePlayer } = useVideoPlayer();
  const { ucraVideos, loadingUcraVideos } = useUcraVideos();
  // 내 영상 제외
  const currentUser = JSON.parse(localStorage.getItem('ucra_currentUser') || '{}');
  const filteredVideos = ucraVideos.filter(
    v => v.registeredBy !== currentUser?.uid && v.registeredBy !== currentUser?.email
  );
  // 중복 제거
  const uniqueVideos = computeUniqueVideos(filteredVideos);
  // 시청 완료된 영상만 필터링
  let displayVideos = uniqueVideos.filter(v => certifiedVideoIds.includes(v.videoId));
  // 숏폼/롱폼 필터
  if (videoFilter === 'short') {
    displayVideos = displayVideos.filter(
      v => typeof v.duration === 'number' && v.duration > 0 && v.duration <= 180
    );
  } else if (videoFilter === 'long') {
    displayVideos = displayVideos.filter(
      v => typeof v.duration === 'number' && v.duration > 180
    );
  }
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
    selectedVideos,
    onTokenEarned,
    onWatchClick,
    watchVideos,
    getWatchCount
  } = props;
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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
      // 로그인 후 상태 갱신은 context/provider 또는 상위 상태에서 처리
    } catch (err) {
      setGoogleError('구글 로그인 실패: ' + err.message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  // 로그인 안내 메시지
  if (!currentUser) {
    return null; // 로그인 안내/버튼을 렌더링하지 않음
  }

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

      {/* 필터 탭 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
      <FilterButtons
        videoFilter={videoFilter}
        onFilterChange={onFilterChange}
      />
      </motion.div>

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
                onTokenEarned={onTokenEarned}
                onWatchClick={onWatchClick}
                selectedCategories={[]}
                watchVideos={watchVideos} // Home에서 전달받은 YouTube API 데이터
                getWatchCount={getWatchCount}
              />
            </motion.div>
          ) : activeTab === 'rewatch' ? (
            <motion.div
              key="rewatch"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WatchRewatchList
              videoFilter={videoFilter}
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
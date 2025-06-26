import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlay } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, where, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { parseDuration } from './Home/utils/videoUtils';

const WatchQueueTab = ({ filter, onFilterChange, handleImageError, handleWatchVideo, myChannelId, watchedCounts = {}, selectedCategories = [] }) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [priorityVideos, setPriorityVideos] = useState([]); // 내 영상을 시청해준 사람들의 영상
  const [otherVideos, setOtherVideos] = useState([]); // 일반 영상
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState('duration');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    async function fetchVideosAndMutuals() {
      // 1. 내 영상 시청자 uid 추출
      const myViewerUids = new Set();
      const roomsQuery = query(collection(db, "chatRooms"));
      const roomsSnapshot = await getDocs(roomsQuery);
      // 내 영상 찾기
      for (const roomDoc of roomsSnapshot.docs) {
        const videosQuery = query(
          collection(db, "chatRooms", roomDoc.id, "videos"),
          where("registeredBy", "==", user.uid)
        );
        const myVideosSnapshot = await getDocs(videosQuery);
        for (const myVideoDoc of myVideosSnapshot.docs) {
          // 인증자 서브컬렉션
          const certsCol = collection(db, "chatRooms", roomDoc.id, "videos", myVideoDoc.id, "certifications");
          const certsSnap = await getDocs(certsCol);
          certsSnap.forEach(certDoc => {
            const certData = certDoc.data();
            if (certData.uid && certData.uid !== user.uid) {
              myViewerUids.add(certData.uid);
            }
          });
        }
      }
      // 2. 전체 영상 불러오기
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
            videoData.registeredBy !== user.email &&
            (!myChannelId || videoData.channelId !== myChannelId)
          ) {
            let videoId = videoData.videoId;
            if ((!videoId || typeof videoId !== 'string' || videoId.length !== 11) && videoDoc.id && videoDoc.id.length === 11) {
              videoId = videoDoc.id;
            }
            if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) return;
            let durationSec = 0;
            if (typeof videoData.duration === 'string') {
              durationSec = parseDuration(videoData.duration);
            } else if (typeof videoData.duration === 'number') {
              durationSec = videoData.duration;
            }
            if (videoIdSet.has(videoId)) return;
            videoIdSet.add(videoId);
            allVideos.push({
              ...videoData,
              id: videoDoc.id,
              videoId,
              roomId: roomDoc.id,
              roomName: roomDoc.data().name || '제목 없음',
              durationSec,
              type: durationSec <= 180 ? 'short' : 'long',
              thumbnailUrl: videoData.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              channelId: videoData.channelId || videoData.channelId || '',
              channelName: videoData.channelTitle || videoData.channel || '',
              views: videoData.views || 0,
              watchCount: videoData.watchCount || 0,
              registeredBy: videoData.registeredBy,
            });
          }
        });
      }
      // 3. priority/other 분리 및 구독여부 확인
      const priority = [];
      const others = [];
      // 구독여부 병렬 fetch
      const subscribeChecks = [];
      allVideos.forEach(v => {
        if (myViewerUids.has(v.registeredBy)) {
          subscribeChecks.push(
            (async () => {
              let isSubscribed = false;
              if (myChannelId) {
                const subDocId = `${v.registeredBy}_${myChannelId}`;
                const subDocRef = doc(db, 'subscriptions', subDocId);
                const subDocSnap = await getDocs(query(collection(db, 'subscriptions'), where('subscriberUid', '==', v.registeredBy), where('channelId', '==', myChannelId)));
                isSubscribed = !subDocSnap.empty;
              }
              priority.push({ ...v, isMutual: true, isSubscribed });
            })()
          );
        } else {
          others.push(v);
        }
      });
      await Promise.all(subscribeChecks);
      setVideos(allVideos);
      setPriorityVideos(priority);
      setOtherVideos(others);
      setLoading(false);
    }
    fetchVideosAndMutuals();
  }, [user, myChannelId]);

  // 필터링/정렬
  const isTypeFilter = (filter === 'short' || filter === 'long');

  const matchesCategory = (video) => {
    if (!selectedCategories || selectedCategories.length === 0) return true;
    const videoCats = Array.isArray(video.categories) ? video.categories : (video.category ? [video.category] : []);
    if (videoCats.length === 0) return false;
    return videoCats.some((cat) => selectedCategories.includes(cat));
  };

  const filteredPriority = priorityVideos.filter(video => {
    if (filter !== 'rewatch' && !matchesCategory(video)) return false;
    if (!isTypeFilter) return true; // 'all' 또는 'rewatch' 탭이면 타입 필터링 없음
    return video.type === filter;
  });

  const filteredOthers = otherVideos.filter(video => {
    if (filter !== 'rewatch' && !matchesCategory(video)) return false;
    if (!isTypeFilter) return true;
    return video.type === filter;
  });
  const sortFn = (a, b) => {
    switch (sortKey) {
      case 'views': return b.views - a.views;
      case 'duration': return a.durationSec - b.durationSec;
      case 'watch': return b.watchCount - a.watchCount;
      default: return 0;
    }
  };
  const sortedPriority = [...filteredPriority].sort(sortFn);
  const sortedOthers = [...filteredOthers].sort(sortFn);

  // 미시청/재시청 분리
  const unwatchedPriority = sortedPriority.filter(video => !(watchedCounts[video.videoId] || watchedCounts[video.id]));
  const unwatchedOthers = sortedOthers.filter(video => !(watchedCounts[video.videoId] || watchedCounts[video.id]));
  const rewatchList = [...sortedPriority, ...sortedOthers].filter(video => (watchedCounts[video.videoId] || watchedCounts[video.id]));

  // 페이지네이션 (미시청만 적용)
  const VIDEOS_PER_PAGE = 5;
  const displayedUnwatchedOthers = unwatchedOthers.slice(0, Math.max(0, (page + 1) * VIDEOS_PER_PAGE - unwatchedPriority.length));

  useEffect(() => {
    setPage(0);
  }, [filter, sortKey, videos]);

  // 구독요청 핸들러
  const handleSubscribeRequest = async (toUid) => {
    if (!user) return;
    try {
      const reqRef = doc(collection(db, 'subscribeRequests'));
      await setDoc(reqRef, {
        fromUid: user.uid,
        toUid,
        createdAt: serverTimestamp(),
      });
      alert('구독 요청이 전송되었습니다!');
    } catch (e) {
      alert('구독 요청 전송 실패: ' + e.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 mx-4"
    >
      {/* 기존 필터/정렬 UI */}
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
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'rewatch' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => onFilterChange('rewatch')}
        >재시청</button>
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
      ) : filter === 'rewatch' ? (
        rewatchList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaPlay className="text-4xl mx-auto mb-2 opacity-30" />
            <p>재시청할 영상이 없습니다</p>
          </div>
        ) : (
          <>
            {rewatchList.map((video, index) => (
              <motion.div
                key={video.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-2 border-blue-300"
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
                      {video.isMutual ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600 font-bold">상호시청</span>
                      ) : (
                        <>
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 font-bold">내채널 미구독자</span>
                          <button
                            className="ml-2 px-2 py-1 rounded bg-yellow-400 text-white text-xs font-bold hover:bg-yellow-500 transition"
                            onClick={() => handleSubscribeRequest(video.registeredBy)}
                          >구독요청</button>
                        </>
                      )}
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
                    onClick={() => handleWatchVideo(video, [...sortedPriority, ...sortedOthers])}
                    className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition-colors ${(watchedCounts[video.videoId] || watchedCounts[video.id]) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {(watchedCounts[video.videoId] || watchedCounts[video.id]) ? (
                      `${watchedCounts[video.videoId] || watchedCounts[video.id]}회 시청완료 (재시청하기)`
                    ) : (
                      <><FaPlay className="inline mr-1" />시청하기</>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const url = video.channelId
                        ? `https://www.youtube.com/channel/${video.channelId}?sub_confirmation=1`
                        : `https://www.youtube.com/watch?v=${video.videoId}`;
                      window.open(url, '_blank');
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    구독하기
                  </button>
                </div>
              </motion.div>
            ))}
          </>
        )
      ) : (
        (unwatchedPriority.length + unwatchedOthers.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            <FaPlay className="text-4xl mx-auto mb-2 opacity-30" />
            <p>시청할 영상이 없습니다</p>
            <p className="text-sm">다른 사용자가 영상을 등록하면 나타납니다</p>
          </div>
        ) : (
          <>
            {/* 미시청 우선순위(상호시청) 영상 */}
            {unwatchedPriority.map((video, index) => (
              <motion.div
                key={video.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-2 border-blue-300"
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
                      {video.isSubscribed ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600 font-bold">내 구독자 영상</span>
                      ) : (
                        <>
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 font-bold">내채널 미구독자</span>
                          <button
                            className="ml-2 px-2 py-1 rounded bg-yellow-400 text-white text-xs font-bold hover:bg-yellow-500 transition"
                            onClick={() => handleSubscribeRequest(video.registeredBy)}
                          >구독요청</button>
                        </>
                      )}
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
                    onClick={() => handleWatchVideo(video, [...sortedPriority, ...sortedOthers])}
                    className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition-colors ${(watchedCounts[video.videoId] || watchedCounts[video.id]) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {(watchedCounts[video.videoId] || watchedCounts[video.id]) ? (
                      `${watchedCounts[video.videoId] || watchedCounts[video.id]}회 시청완료 (재시청하기)`
                    ) : (
                      <><FaPlay className="inline mr-1" />시청하기</>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const url = video.channelId
                        ? `https://www.youtube.com/channel/${video.channelId}?sub_confirmation=1`
                        : `https://www.youtube.com/watch?v=${video.videoId}`;
                      window.open(url, '_blank');
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    구독하기
                  </button>
                </div>
              </motion.div>
            ))}
            {/* 미시청 일반 영상 */}
            {displayedUnwatchedOthers.map((video, index) => (
              <motion.div
                key={video.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + unwatchedPriority.length) }}
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
                    onClick={() => handleWatchVideo(video, [...sortedPriority, ...sortedOthers])}
                    className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition-colors ${(watchedCounts[video.videoId] || watchedCounts[video.id]) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {(watchedCounts[video.videoId] || watchedCounts[video.id]) ? (
                      `${watchedCounts[video.videoId] || watchedCounts[video.id]}회 시청완료 (재시청하기)`
                    ) : (
                      <><FaPlay className="inline mr-1" />시청하기</>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const url = video.channelId
                        ? `https://www.youtube.com/channel/${video.channelId}?sub_confirmation=1`
                        : `https://www.youtube.com/watch?v=${video.videoId}`;
                      window.open(url, '_blank');
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    구독하기
                  </button>
                </div>
              </motion.div>
            ))}
            {/* 더보기 버튼 */}
            {displayedUnwatchedOthers.length < unwatchedOthers.length && (
              <div className="text-center mt-4">
                <button
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-600"
                  onClick={() => setPage(prev => prev + 1)}
                >
                  더보기
                </button>
              </div>
            )}
          </>
        )
      )}
    </motion.div>
  );
};

export default React.memo(WatchQueueTab); 
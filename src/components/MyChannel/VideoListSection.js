import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const VideoListSection = () => {
  const [activeTab, setActiveTab] = useState('registered'); // 'registered' | 'watched'
  const [registeredVideos, setRegisteredVideos] = useState([]);
  const [watchedVideos, setWatchedVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 등록한 영상 목록 가져오기
  const fetchRegisteredVideos = async () => {
    if (!auth.currentUser) return;
    
    try {
      // chatRooms의 모든 videos 서브컬렉션에서 내가 등록한 영상 찾기
      const chatRoomsRef = collection(db, 'chatRooms');
      const chatRoomsSnap = await getDocs(chatRoomsRef);
      
      const allVideos = [];
      
      for (const chatRoomDoc of chatRoomsSnap.docs) {
        const videosQuery = query(
          collection(db, 'chatRooms', chatRoomDoc.id, 'videos'),
          where('registeredBy', '==', auth.currentUser.uid),
          orderBy('registeredAt', 'desc'),
          limit(10)
        );
        
        const videosSnap = await getDocs(videosQuery);
        videosSnap.forEach(doc => {
          allVideos.push({
            id: doc.id,
            roomId: chatRoomDoc.id,
            roomName: chatRoomDoc.data().name,
            ...doc.data()
          });
        });
      }
      
      // 시간순으로 정렬
      allVideos.sort((a, b) => {
        const aTime = a.registeredAt?.seconds || 0;
        const bTime = b.registeredAt?.seconds || 0;
        return bTime - aTime;
      });
      
      setRegisteredVideos(allVideos.slice(0, 20)); // 최대 20개
    } catch (error) {
      console.error('등록한 영상 목록 조회 실패:', error);
    }
  };

  // 시청한 영상 목록 가져오기 (로컬스토리지 기반)
  const fetchWatchedVideos = () => {
    try {
      const watchedData = localStorage.getItem(`watchedVideos_${auth.currentUser?.uid}`);
      if (watchedData) {
        const videos = JSON.parse(watchedData);
        // 최근 시청순으로 정렬
        const sortedVideos = videos.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
        setWatchedVideos(sortedVideos.slice(0, 20)); // 최대 20개
      }
    } catch (error) {
      console.error('시청한 영상 목록 조회 실패:', error);
    }
  };

  useEffect(() => {
    const loadVideoLists = async () => {
      setLoading(true);
      await Promise.all([
        fetchRegisteredVideos(),
        fetchWatchedVideos()
      ]);
      setLoading(false);
    };

    if (auth.currentUser) {
      loadVideoLists();
    }
  }, []);

  // 영상 썸네일 URL 생성
  const getThumbnailUrl = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  // 영상 클릭 핸들러
  const handleVideoClick = (video) => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    window.open(videoUrl, '_blank');
    
    // 시청 기록 업데이트
    updateWatchHistory(video);
  };

  // 시청 기록 업데이트
  const updateWatchHistory = (video) => {
    if (!auth.currentUser) return;
    
    try {
      const storageKey = `watchedVideos_${auth.currentUser.uid}`;
      const existingData = localStorage.getItem(storageKey);
      let watchedList = existingData ? JSON.parse(existingData) : [];
      
      // 중복 제거
      watchedList = watchedList.filter(v => v.videoId !== video.videoId);
      
      // 새 시청 기록 추가
      watchedList.unshift({
        ...video,
        watchedAt: new Date().toISOString()
      });
      
      // 최대 50개까지만 저장
      if (watchedList.length > 50) {
        watchedList = watchedList.slice(0, 50);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(watchedList));
      
      // 시청한 영상 탭이 활성화되어 있으면 새로고침
      if (activeTab === 'watched') {
        fetchWatchedVideos();
      }
    } catch (error) {
      console.error('시청 기록 업데이트 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-b-2xl shadow mx-3 sm:mx-4 p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">영상 목록 로딩 중...</span>
        </div>
      </div>
    );
  }

  const currentVideos = activeTab === 'registered' ? registeredVideos : watchedVideos;

  return (
    <div className="bg-white rounded-b-2xl shadow mx-3 sm:mx-4 mb-4">
      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('registered')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'registered'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📹 등록한 영상 ({registeredVideos.length})
        </button>
        <button
          onClick={() => setActiveTab('watched')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'watched'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👀 시청한 영상 ({watchedVideos.length})
        </button>
      </div>

      {/* 영상 리스트 */}
      <div className="p-4">
        {currentVideos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-3">
              {activeTab === 'registered' ? '📹' : '👀'}
            </div>
            <div className="text-sm">
              {activeTab === 'registered' 
                ? '아직 등록한 영상이 없습니다.' 
                : '아직 시청한 영상이 없습니다.'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {activeTab === 'registered' 
                ? '채팅방에서 YouTube 영상을 공유해보세요!' 
                : 'YouTube 영상을 시청하면 여기에 기록됩니다.'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {currentVideos.map((video, index) => (
              <div
                key={`${video.videoId}_${index}`}
                onClick={() => handleVideoClick(video)}
                className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
              >
                {/* 썸네일 */}
                <div className="flex-shrink-0 w-20 h-15 sm:w-24 sm:h-18 rounded-lg overflow-hidden bg-gray-200">
                  <img
                    src={getThumbnailUrl(video.videoId)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDYuNVYxNy41TDE2IDEyTDggNi41WiIgZmlsbD0iI0Q1RDVENSIvPgo8L3N2Zz4K';
                    }}
                  />
                </div>

                {/* 영상 정보 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {video.title}
                  </h4>
                  
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {video.channelTitle && (
                      <div className="truncate">📺 {video.channelTitle}</div>
                    )}
                    
                    {activeTab === 'registered' && video.roomName && (
                      <div className="truncate">💬 {video.roomName}</div>
                    )}
                    
                    <div>
                      {activeTab === 'registered' 
                        ? `등록 ${formatTime(video.registeredAt)}`
                        : `시청 ${formatTime(video.watchedAt)}`
                      }
                    </div>
                  </div>
                </div>

                {/* 재생 아이콘 */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 bg-opacity-10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 6.5v11l8-5.5-8-5.5z"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoListSection; 
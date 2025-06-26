import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaYoutube, FaPlay, FaUsers, FaThumbsUp, FaHeart, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import { extractChannelId, fetchYouTubeChannelInfo, fetchChannelVideos } from '../services/videoService';
import ChannelConnectionStep from './ChannelConnectionStep';
import VideoSelectionStep from './VideoSelectionStep';
import MainPlatformStep from './MainPlatformStep';
import WatchQueueTab from './WatchQueueTab';
import MyVideosTab from './MyVideosTab';
import { useVideoPlayer } from '../contexts/VideoPlayerContext';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { ChannelRegisterCard } from './Home/components/ChannelRegisterCard';
import { CategoryInputBox } from './Home/components/CategoryInputBox';

const Home = () => {
  const { initializePlayer } = useVideoPlayer();
  // 인증 완료 감지
  const { isCertified: playerCertified, roomId: playerRoomId } = useVideoPlayer();

  // 단계별 진행 상태
  const [completedSteps, setCompletedSteps] = useState([]);
  const [channelConnected, setChannelConnected] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('watch'); // watch, myVideos
  const [watchFilter, setWatchFilter] = useState('all');
  // 카드 열림/닫힘 상태를 localStorage에서 불러오도록 초기화
  const [videoSelectionCollapsed, setVideoSelectionCollapsed] = useState(() => {
    const saved = localStorage.getItem('videoSelectionCollapsed');
    return saved === 'true';
  });
  
  // 데이터 상태
  const [channelInfo, setChannelInfo] = useState(null);
  const [channelUrl, setChannelUrl] = useState('');
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState('');
  const [myVideos, setMyVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [watchedCount, setWatchedCount] = useState(0);
  const [earnedViews, setEarnedViews] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryInputCollapsed, setCategoryInputCollapsed] = useState(false);

  // 기본 이미지 URL들 - useMemo로 메모이제이션
  const defaultImages = useMemo(() => ({
    channelAvatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE1IiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0yMCA3NUMyMCA2NS41IDI5LjUgNTggNDEgNThINTlDNzAuNSA1OCA4MCA2NS41IDgwIDc1VjgwSDIwVjc1WiIgZmlsbD0iIzlCOUJBMyIvPgo8L3N2Zz4K',
    videoThumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIzMCIgZmlsbD0iI0VGNDQ0NCIvPgo8cGF0aCBkPSJNMTUwIDc1TDE3NSA5MEwxNTAgMTA1Vjc1WiIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K'
  }), []);

  // Mock 데이터 제거 - 실제 사용자 데이터만 사용

  // 단계 완료 처리 - useCallback으로 메모이제이션
  const completeStep = useCallback((stepNumber) => {
    setCompletedSteps(prev => {
      if (!prev.includes(stepNumber)) {
        return [...prev, stepNumber];
      }
      return prev;
    });
  }, []);

  // 이미지 에러 핸들링 - useCallback으로 메모이제이션
  const handleImageError = useCallback((e) => {
    e.target.src = defaultImages.videoThumbnail;
  }, [defaultImages.videoThumbnail]);

  const handleAvatarError = useCallback((e) => {
    e.target.src = defaultImages.channelAvatar;
  }, [defaultImages.channelAvatar]);

  // 페이지네이션 상수 및 로직 - 실제 myVideos만 사용
  const VIDEOS_PER_PAGE = 7;
  const totalVideos = myVideos;
  const totalPages = Math.ceil(totalVideos.length / VIDEOS_PER_PAGE);
  const startIndex = currentPage * VIDEOS_PER_PAGE;
  const endIndex = startIndex + VIDEOS_PER_PAGE;
  const currentVideos = totalVideos.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((pageIndex) => {
    setCurrentPage(pageIndex);
  }, []);

  // 영상 선택 시 페이지 초기화
  const resetPagination = useCallback(() => {
    setCurrentPage(0);
  }, []);

  // 최초 마운트 시 사용자 프로필에서 채널 정보 로드
  const { currentUser } = useAuth();

  React.useEffect(() => {
    async function loadProfile() {
      if (!currentUser) return;
      const profile = await getUserProfile(currentUser.uid);
      if (profile && profile.channelInfo) {
        setChannelInfo(profile.channelInfo);
        setChannelConnected(true);
        setCompletedSteps(prev => (prev.includes(1) ? prev : [...prev, 1]));

        // 선택한 영상 불러오기 (localStorage 우선, 없으면 Firestore)
        const localSelected = localStorage.getItem('selectedVideos');
        if (localSelected) {
          setSelectedVideos(JSON.parse(localSelected));
        } else if (profile.selectedVideos) {
          setSelectedVideos(profile.selectedVideos);
        }

        // 내 영상이 시청된 수 불러오기 (localStorage 우선, 없으면 Firestore)
        const localEarned = localStorage.getItem('earnedViews');
        if (localEarned) {
          setEarnedViews(Number(localEarned));
        } else if (profile.earnedViews !== undefined) {
          setEarnedViews(profile.earnedViews);
        }

        // 카테고리 불러오기 (localStorage 우선, 없으면 Firestore)
        const localCategories = localStorage.getItem('selectedCategories');
        if (localCategories) {
          setSelectedCategories(JSON.parse(localCategories));
        } else if (profile.selectedCategories) {
          setSelectedCategories(profile.selectedCategories);
        }

        // 채널 실영상 가져오기
        try {
          setVideosLoading(true);
          const videos = await fetchChannelVideos(profile.channelInfo.channelId, 10);
          if (videos && videos.length > 0) {
            setMyVideos(videos);
            resetPagination();
          }
        } catch(e) {
          console.error('채널 영상 로드 실패', e);
        } finally {
          setVideosLoading(false);
        }
      }
    }
    loadProfile();
  }, [currentUser]);

  // 채널 연동 핸들러
  const handleChannelConnect = useCallback(async () => {
    if (!channelUrl.trim()) {
      setChannelError('채널 URL을 입력해주세요.');
      return;
    }

    setChannelLoading(true);
    setChannelError('');

    try {
      // 1. URL에서 채널 정보 추출
      const channelData = extractChannelId(channelUrl);
      if (!channelData) {
        throw new Error('유효한 유튜브 채널 URL이 아닙니다.');
      }

      // 2. YouTube API로 채널 정보 조회
      console.log('🔍 채널 정보 조회 시작:', channelData);
      const channelInfo = await fetchYouTubeChannelInfo(channelData);
      
      if (!channelInfo) {
        throw new Error('채널 정보를 불러올 수 없습니다.');
      }

      // 3. 채널 정보 저장
      const fetchedInfo = {
        name: channelInfo.channelTitle,
        subscribers: formatSubscriberCount(channelInfo.subscriberCount),
        avatar: channelInfo.channelThumbnail || defaultImages.channelAvatar,
        channelId: channelInfo.channelId,
        videoCount: channelInfo.videoCount,
        viewCount: channelInfo.viewCount,
        description: channelInfo.channelDescription,
      };
      setChannelInfo(fetchedInfo);

      // 사용자 프로필에 저장
      if (auth.currentUser) {
        updateUserProfile(auth.currentUser.uid, { channelInfo: {
          ...fetchedInfo
        }}).catch(console.error);
      }

      // 4. 채널의 실제 영상 목록 가져오기
      setVideosLoading(true);
      console.log('🔍 채널 영상 목록 조회 시작...');
      
      try {
        const videos = await fetchChannelVideos(channelInfo.channelId, 10); // 최신 10개 영상
        
        if (videos && videos.length > 0) {
          setMyVideos(videos);
          resetPagination(); // 새 영상 로드 시 첫 페이지로 이동
          console.log(`✅ 실제 영상 ${videos.length}개 로드 완료`);
          console.log('📊 숏폼/롱폼 분포:', {
            shorts: videos.filter(v => v.type === 'short').length,
            longs: videos.filter(v => v.type === 'long').length
          });
        } else {
          console.warn('⚠️ 영상이 없음');
          setMyVideos([]);
          resetPagination();
        }
      } catch (videoError) {
        console.error('❌ 영상 목록 로드 실패:', videoError);
        setMyVideos([]);
        resetPagination();
      } finally {
        setVideosLoading(false);
      }

      setChannelConnected(true);
      completeStep(1);
      setCategoryInputCollapsed(false); // 채널 연동 후 카테고리 입력 폼 자동 오픈
      console.log('✅ 채널 연동 완료:', channelInfo.channelTitle);
    } catch (error) {
      console.error('❌ 채널 연동 실패:', error);
      setChannelError(error.message || '채널 연동에 실패했습니다.');
    } finally {
      setChannelLoading(false);
    }
  }, [channelUrl, defaultImages.channelAvatar, completeStep, resetPagination]);

  // 구독자 수 포맷팅 함수
  const formatSubscriberCount = useCallback((count) => {
    if (!count) return '0';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    } else {
      return count.toString();
    }
  }, []);

  // 조회수 포맷팅 함수
  const formatViewCount = useCallback((count) => {
    if (!count) return '0';
    if (count >= 1000000000) {
      return (count / 1000000000).toFixed(1) + 'B';
    } else if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    } else {
      return count.toLocaleString();
    }
  }, []);

  // 영상 선택 핸들러
  const handleVideoSelect = useCallback((videoId) => {
    setSelectedVideos(prev => {
      let newSelection;
      if (prev.includes(videoId)) {
        newSelection = prev.filter(id => id !== videoId);
      } else if (prev.length < 3) {
        newSelection = [...prev, videoId];
      } else {
        newSelection = prev;
      }
      // Firestore에 저장
      if (currentUser) {
        updateUserProfile(currentUser.uid, { selectedVideos: newSelection });
      }
      // localStorage에도 저장
      localStorage.setItem('selectedVideos', JSON.stringify(newSelection));
      return newSelection;
    });
  }, [currentUser]);

  // 시청하기 핸들러 (자동재생)
  const handleWatchVideo = useCallback((video, videoList) => {
    if (!videoList || videoList.length === 0) return;
    // id, videoId 모두 비교
    const idx = videoList.findIndex(
      v => v.id === video.id || v.videoId === video.videoId
    );
    initializePlayer('watchqueue', videoList, idx >= 0 ? idx : 0);
  }, [initializePlayer]);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  function parseDuration(durationStr) {
    if (!durationStr) return 0;
    const [min, sec] = durationStr.split(':').map(Number);
    return min * 60 + sec;
  }

  // 시청 대기열은 실제 데이터에서 가져올 예정 - 현재는 빈 배열
  const filteredWatchQueue = [];

  // 내 영상이 시청된 수 증가 (인증/시청 발생 시 호출)
  const handleEarnedView = useCallback(() => {
    setEarnedViews(prev => {
      const newCount = prev + 1;
      // Firestore, localStorage 모두 저장
      if (currentUser) {
        updateUserProfile(currentUser.uid, { earnedViews: newCount });
      }
      localStorage.setItem('earnedViews', String(newCount));
      return newCount;
    });
  }, [currentUser]);

  // 인증 완료 감지 (내 영상이 시청된 경우 handleEarnedView 호출)
  React.useEffect(() => {
    if (playerRoomId === 'watchqueue' && playerCertified) {
      setWatchedCount((prev) => prev + 1);
      handleEarnedView();
    }
  }, [playerCertified, playerRoomId, handleEarnedView]);

  // 카테고리 변경 핸들러
  const handleCategoriesChange = useCallback((categories) => {
    setSelectedCategories(categories);
    // Firestore에 저장
    if (currentUser) {
      updateUserProfile(currentUser.uid, { selectedCategories: categories });
    }
    // localStorage에도 저장
    localStorage.setItem('selectedCategories', JSON.stringify(categories));
  }, [currentUser]);

  // 채널 수정 (리셋)
  const handleChannelEdit = useCallback(async () => {
    setChannelConnected(false);
    setChannelInfo(null);
    setCompletedSteps([]); // 모든 단계 초기화
    setSelectedVideos([]); // 선택된 영상 초기화
    setMyVideos([]); // 내 영상 목록 초기화
    setVideoSelectionCollapsed(false); // 영상 선택 카드 펼치기
    setCurrentPage(0); // 페이지네이션 초기화
    setSelectedCategories([]); // 카테고리 초기화
    // 프로필에서 채널 관련 정보 제거
    try {
      if (currentUser) {
        await updateUserProfile(currentUser.uid, { 
          channelInfo: null,
          selectedVideos: [],
          selectedCategories: []
        });
      }
    } catch(e){console.error(e);} 
    // localStorage도 초기화
    localStorage.removeItem('selectedVideos');
    localStorage.removeItem('videoSelectionCollapsed');
    localStorage.removeItem('selectedCategories');
  }, [currentUser]);

  // 카드 열림/닫힘 토글 핸들러 (localStorage에도 저장)
  const handleToggleCard = useCallback(() => {
    setVideoSelectionCollapsed(prev => {
      localStorage.setItem('videoSelectionCollapsed', String(!prev));
      return !prev;
    });
  }, []);

  const handleToggleCategoryCard = useCallback(() => {
    setCategoryInputCollapsed(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold gradient-text mb-1">UCRA</h1>
            <p className="text-gray-600 text-sm">유튜브 크리에이터들의 공간</p>
          </div>
          
          {/* 진행 상황 표시 */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${completedSteps.includes(1) ? 'text-green-600' : 'text-blue-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                completedSteps.includes(1) ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                1
              </div>
              <span className="text-sm">채널 연동</span>
            </div>
            <div className={`w-8 h-0.5 ${completedSteps.includes(1) ? 'bg-green-300' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center space-x-2 ${completedSteps.includes(2) ? 'text-green-600' : completedSteps.includes(1) ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                completedSteps.includes(2) ? 'bg-green-100' : completedSteps.includes(1) ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                2
              </div>
              <span className="text-sm">영상 선택</span>
            </div>
            <div className={`w-8 h-0.5 ${completedSteps.includes(2) ? 'bg-green-300' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center space-x-2 ${completedSteps.includes(2) ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                completedSteps.includes(2) ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                3
              </div>
              <span className="text-sm">메인 플랫폼</span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="py-6">
        {/* 단계별 진행 - 순차적 확장 방식 */}
        <ChannelConnectionStep
          channelConnected={channelConnected}
          channelUrl={channelUrl}
          setChannelUrl={setChannelUrl}
          channelLoading={channelLoading}
          channelError={channelError}
          handleChannelConnect={handleChannelConnect}
          channelInfo={channelInfo}
          handleAvatarError={handleAvatarError}
          formatViewCount={formatViewCount}
          handleChannelEdit={handleChannelEdit}
          selectedCategories={selectedCategories}
          onCategoriesChange={handleCategoriesChange}
          categoryInputCollapsed={categoryInputCollapsed}
          handleToggleCategoryCard={handleToggleCategoryCard}
          handleToggleCard={handleToggleCard}
        />
        <VideoSelectionStep
          completedSteps={completedSteps}
          videoSelectionCollapsed={videoSelectionCollapsed}
          setVideoSelectionCollapsed={setVideoSelectionCollapsed}
          videosLoading={videosLoading}
          currentVideos={currentVideos}
          selectedVideos={selectedVideos}
          handleVideoSelect={handleVideoSelect}
          handleImageError={handleImageError}
          totalPages={totalPages}
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          completeStep={completeStep}
          setVideoSelectionCollapsedTrue={() => setVideoSelectionCollapsed(true)}
        />
        <MainPlatformStep
          completedSteps={completedSteps}
          watchedCount={watchedCount}
          earnedViews={earnedViews}
          activeTab={activeTab}
          handleTabChange={setActiveTab}
          earnedViewsLabel="내 영상이 시청된 수"
        >
          {activeTab === 'watch' ? (
            <WatchQueueTab
              filter={watchFilter}
              onFilterChange={setWatchFilter}
              handleImageError={handleImageError}
              handleWatchVideo={handleWatchVideo}
              myChannelId={channelInfo?.channelId}
            />
          ) : (
            <MyVideosTab
              selectedVideos={selectedVideos}
              myVideos={myVideos}
              handleImageError={handleImageError}
            />
          )}
        </MainPlatformStep>
      </main>
    </div>
  );
};

export default Home;
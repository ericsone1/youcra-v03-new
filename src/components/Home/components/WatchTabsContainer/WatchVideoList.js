import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FaPlay, FaCheck, FaClock } from 'react-icons/fa';
import { useAuth } from '../../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUcraVideos } from '../../hooks/useUcraVideos';
import { useWatchedVideos } from '../../../../contexts/WatchedVideosContext';
import { 
  getRecommendedCategories, 
  filterVideosByRecommendedCategories, 
  computeUniqueVideos 
} from '../../utils/dataProcessing';
import ChannelNameWithBadge from '../../../ChannelNameWithBadge';
import { useVideoPlayer } from '../../../../contexts/VideoPlayerContext';

// 영상 길이 포맷팅 함수
function formatDuration(duration) {
  if (!duration) return '시간 미확인';
  
  // YouTube 형식 (PT1M30S)을 초 단위로 변환
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  }
  
  return '시간 미확인';
}

// 날짜 포맷팅 함수
function formatDate(date) {
  if (!date) return '날짜 미확인';
  
  try {
    let dateObj;
    
    // Firestore Timestamp 객체인 경우
    if (date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    }
    // 일반 Date 객체인 경우
    else if (date instanceof Date) {
      dateObj = date;
    }
    // 문자열인 경우
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // 숫자인 경우 (timestamp)
    else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    else {
      return '날짜 미확인';
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - dateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '오늘';
    } else if (diffDays === 2) {
      return '어제';
    } else if (diffDays <= 7) {
      return `${diffDays - 1}일 전`;
    } else {
      return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '날짜 미확인';
  }
}

// 카운트다운 버튼 컴포넌트
const CountdownButton = ({ videoId, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCounting, setIsCounting] = useState(false);

  useEffect(() => {
    const checkTimeLeft = () => {
      const lastWatched = localStorage.getItem(`lastWatched_${videoId}`);
      if (lastWatched) {
        const lastWatchedTime = parseInt(lastWatched);
        const now = Date.now();
        const timeDiff = now - lastWatchedTime;
        const oneHour = 60 * 60 * 1000; // 1시간을 밀리초로
        const remaining = oneHour - timeDiff;
        
        if (remaining > 0) {
          setTimeLeft(Math.ceil(remaining / 1000));
          setIsCounting(true);
        } else {
          setTimeLeft(0);
          setIsCounting(false);
          onTimeUp(videoId);
        }
      } else {
        setTimeLeft(0);
        setIsCounting(false);
      }
    };

    checkTimeLeft();
    const interval = setInterval(checkTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [videoId, onTimeUp]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isCounting) {
    return null;
  }

  return (
    <button
      disabled
      className="px-3 py-1.5 bg-gray-400 text-white text-xs font-semibold rounded-lg opacity-75 cursor-not-allowed"
    >
      {formatTime(timeLeft)} 후 재시청
    </button>
  );
};

// 영상 리스트 렌더러 (공통, 페이지네이션 추가)
const VideoListRenderer = ({ videos, onWatchClick = () => {}, recommendedVideos = [], getWatchCount = () => 0, onWatchComplete = () => {}, watchedVideos = new Set() }) => {
  const { watchedMap, canRewatch, getTimeUntilRewatch, setCertified } = useWatchedVideos();
  const [localWatchedVideos, setLocalWatchedVideos] = useState(new Set());
  const [timerUpdate, setTimerUpdate] = useState(0); // 실시간 타이머 업데이트용

  // 실시간 타이머 업데이트 (10초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerUpdate(prev => prev + 1);
    }, 10000); // 10초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 시청 완료 처리
  const handleWatchComplete = (videoId) => {
    console.log('✅ [VideoListRenderer] 시청 완료 처리:', videoId);
    setLocalWatchedVideos(prev => new Set([...prev, videoId]));
    
    // localStorage에 시청 완료 상태 저장
    localStorage.setItem(`watched_${videoId}`, 'true');
    
    // 1시간 타이머 시작을 위해 setCertified 호출
    setCertified(videoId, true, 'manual');
    
    onWatchComplete(videoId);
  };

  // 시청 상태 확인
  const isWatched = (videoId) => {
    // localStorage에서 시청 완료 상태 확인
    return localStorage.getItem(`watched_${videoId}`) === 'true' || localWatchedVideos.has(videoId) || watchedVideos.has(videoId);
  };

  // 시청 중인 상태 확인
  const isWatching = (videoId) => {
    return localStorage.getItem(`watching_${videoId}`) === 'true';
  };

  // 시청하기 버튼 클릭 처리
  const handleWatchClick = (video, idx, videos) => {
    const videoId = video.videoId || video.id;
    
    // 재시청 가능한 경우에는 시청 완료 상태를 무시하고 진행
    if (isWatched(videoId) && !canRewatch(videoId)) {
      console.log('✅ 이미 시청 완료된 영상 (재시청 불가)');
      return;
    }

    // 시청 중 상태로 설정
    localStorage.setItem(`watching_${videoId}`, 'true');
    
    // 팝업창 열기
    onWatchClick(video, idx, videos);
  };

  // 시청 완료 버튼 클릭 처리
  const handleCompleteClick = (videoId) => {
    console.log('✅ [VideoListRenderer] 시청 완료 버튼 클릭:', videoId);
    localStorage.removeItem(`watching_${videoId}`);
    handleWatchComplete(videoId);
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-sm">
          표시할 영상이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 추천 영상 섹션 */}
      {recommendedVideos && recommendedVideos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 pl-1">추천 영상</h3>
          <ul className="space-y-3">
            {recommendedVideos.map((video, idx) => (
              <li
                key={video.id + '-recommended-' + idx}
                className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 sm:p-4 rounded-xl border border-purple-200 flex items-start gap-3 sm:gap-4"
              >
                {/* 썸네일 */}
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail || video.thumbnailUrl || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/128x80/f3f4f6/9ca3af?text=영상';
                    }}
                  />
                  {video.durationDisplay && (
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {video.durationDisplay}
                    </span>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  {/* 제목 */}
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 leading-tight line-clamp-2">
                    {video.title || '제목 없음'}
                  </h3>
                  
                  {/* 조회수 */}
                  <div className="text-xs text-gray-500">
                    <span>유크라 조회수 {(video.viewCount || video.views || 0).toLocaleString()}회</span>
                  </div>
                </div>

                {/* 시청하기 버튼 */}
                <div className="flex-shrink-0">
                  {isWatching(video.id) ? (
                    // 시청 중인 경우 (재시청 포함)
                    <button
                      onClick={() => handleCompleteClick(video.id)}
                      className="px-3 py-2 sm:px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm rounded-lg font-semibold transition-all duration-200 shadow-md whitespace-nowrap"
                    >
                      시청완료(수동)
                    </button>
                  ) : isWatched(video.id) ? (
                    canRewatch(video.id) ? (
                      // 시청완료되었지만 1시간이 지나서 재시청 가능한 경우
                      <button
                        className="px-3 py-2 sm:px-4 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm rounded-lg font-semibold transition-all duration-200 shadow-md whitespace-nowrap"
                        onClick={e => { e.stopPropagation(); handleWatchClick(video, idx, recommendedVideos); }}
                      >
                        <FaPlay className="inline mr-1" />
                        재시청하기
                      </button>
                    ) : (
                      // 시청완료되었고 1시간이 지나지 않아 재시청 불가능한 경우
                      <button
                        className="px-3 py-2 sm:px-4 bg-gray-400 text-white text-xs sm:text-sm rounded-lg font-semibold transition-all duration-200 shadow-md whitespace-nowrap"
                        disabled
                      >
                        <FaClock className="inline mr-1" />
                        {getTimeUntilRewatch(video.id)}분 후 재시청
                      </button>
                    )
                  ) : (
                    // 처음 시청하는 경우
                    <button
                      className="px-3 py-2 sm:px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 whitespace-nowrap"
                      onClick={e => { e.stopPropagation(); handleWatchClick(video, idx, recommendedVideos); }}
                    >
                      <FaPlay className="inline mr-1" />
                      시청하기
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 일반 영상 리스트 */}
      <ul className="space-y-4">
        {videos.map((video, idx) => {
          const videoId = video.id || video.videoId;
          
          return (
            <li
              key={videoId + '-' + idx}
              className="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* 썸네일 - 반응형 사이즈 */}
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail || video.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-28 h-18 sm:w-40 sm:h-24 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/160x96/f3f4f6/9ca3af?text=영상';
                    }}
                  />
                  {/* 재생 시간 */}
                  {video.durationDisplay && (
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {video.durationDisplay}
                    </span>
                  )}
                  {/* 쇼츠 배지 */}
                  {video.type === 'short' && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      Shorts
                    </span>
                  )}
                </div>

                {/* 영상 정보 - 더 넓은 공간 활용 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                  {/* 상단: 제목과 시간 */}
                  <div className="flex-1">
                    {/* 제목 - 두 줄로 표시 가능 */}
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 leading-tight line-clamp-2">
                      {video.title || '제목 없음'}
                    </h3>
                  </div>
                  
                  {/* 하단: 유크라 플레이 횟수와 업로드일 */}
                  <div className="flex flex-row items-center text-xs sm:text-sm text-gray-500 gap-2">
                    <span className="whitespace-nowrap">유크라 조회수 {(video.ucraViewCount || 0).toLocaleString()}회</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">{(() => {
                      // 디버깅: 실제 registeredAt 값 확인 (모든 영상)
                      console.log(`📅 [날짜표시] "${video.title?.substring(0, 15)}":`, {
                        registeredAt: video.registeredAt,
                        type: typeof video.registeredAt,
                        hasSeconds: !!video.registeredAt?.seconds,
                        seconds: video.registeredAt?.seconds,
                        milliseconds: video.registeredAt?.getTime ? video.registeredAt.getTime() : null,
                        실제날짜: video.registeredAt?.seconds ? 
                          new Date(video.registeredAt.seconds * 1000).toLocaleString() : 
                          (video.registeredAt?.getTime ? new Date(video.registeredAt.getTime()).toLocaleString() : '없음'),
                        roomName: video.roomName,
                        videoId: video.videoId
                      });
                      const formattedResult = formatDate(video.registeredAt);
                      console.log(`🕐 [formatDate 결과] "${video.title?.substring(0, 15)}": "${formattedResult}"`);
                      return formattedResult;
                    })()}</span>
                  </div>
                </div>

                {/* 시청하기 버튼 */}
                <div className="flex-shrink-0">
                  {isWatching(videoId) ? (
                    // 시청 중인 경우 (재시청 포함)
                    <button
                      onClick={() => handleCompleteClick(videoId)}
                      className="px-3 py-2 sm:px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm rounded-lg font-semibold transition-all duration-200 shadow-md whitespace-nowrap"
                    >
                      시청완료(수동)
                    </button>
                  ) : isWatched(videoId) ? (
                    canRewatch(videoId) ? (
                      // 시청완료되었지만 1시간이 지나서 재시청 가능한 경우
                      <button
                        className="px-3 py-2 sm:px-4 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm rounded-lg font-semibold transition-all duration-200 shadow-md whitespace-nowrap"
                        onClick={e => { e.stopPropagation(); handleWatchClick(video, idx, videos); }}
                      >
                        <FaPlay className="inline mr-1" />
                        재시청하기
                      </button>
                    ) : (
                      // 시청완료되었고 1시간이 지나지 않아 재시청 불가능한 경우
                      <button
                        className="px-3 py-2 sm:px-4 bg-gray-400 text-white text-xs sm:text-sm rounded-lg font-semibold transition-all duration-200 shadow-md whitespace-nowrap"
                        disabled
                      >
                        <FaClock className="inline mr-1" />
                        {getTimeUntilRewatch(videoId)}분 후 재시청
                      </button>
                    )
                  ) : (
                    // 처음 시청하는 경우
                    <button
                      className="px-3 py-2 sm:px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 whitespace-nowrap"
                      onClick={e => { e.stopPropagation(); handleWatchClick(video, idx, videos); }}
                    >
                      <FaPlay className="inline mr-1" />
                      시청하기
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// YouTube 조회수 API 및 캐시 관련 코드 전체 제거

export const WatchVideoList = ({ 
  videoFilter, 
  sortKey = 'duration',
  onTokenEarned, 
  onWatchClick, 
  selectedCategories = [], 
  selectedVideos = [], // 추가된 파라미터
  getWatchCount = () => 0, // 시청 횟수 조회 함수
  onWatchComplete = () => {} // 시청 완료 콜백
}) => {
  const { currentUser } = useAuth();
  const { ucraVideos, loadingUcraVideos, error } = useUcraVideos();
  const { watchedMap, canRewatch, getTimeUntilRewatch, setCertified } = useWatchedVideos();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Context에서 duration 가져오기 (임시 비활성화)
  // const getVideoDuration = useVideoDuration;

  // props 검증 (최소화)
  if (!ucraVideos && !loadingUcraVideos) {
    console.warn('⚠️ [WatchVideoList] ucraVideos 데이터 없음');
  }

  // 🔄 useUcraVideos에서 이미 모든 사용자의 영상을 가져오므로 selectedVideos는 무시
  // useUcraVideos에는 이미 다음이 포함됨:
  // 1. 채팅방의 videos 서브컬렉션
  // 2. 루트 videos 컬렉션  
  // 3. 모든 사용자 프로필의 myVideos
  
  console.log('🔍 [WatchVideoList] 데이터 소스:', {
    ucraVideosCount: ucraVideos.length,
    selectedVideosCount: selectedVideos?.length || 0,
    selectedVideosIgnored: true // selectedVideos는 이제 무시됨
  });

  let filteredVideos = [...ucraVideos]; // ucraVideos만 사용

  // ✅ useUcraVideos에서 이미 내 영상 + 중복 영상 필터링이 완료됨
  console.log('✅ [WatchVideoList] useUcraVideos에서 필터링 완료된 영상 사용');
  console.log('🔍 [WatchVideoList] 필터링 완료된 영상 개수:', filteredVideos.length);
  // 내 영상 필터링 건너뜀

  // 디버깅: 처리된 영상 데이터 확인
  console.log('🔍 [WatchVideoList] 영상 데이터 처리 결과:', {
    ucraVideosCount: ucraVideos.length,
    selectedVideosCount: selectedVideos?.length || 0,
    filteredVideosCount: filteredVideos.length,
    note: 'selectedVideos는 이제 무시됨 - useUcraVideos에서 모든 사용자 영상을 가져옴'
  });

  /* 카테고리 필터링 완전 비활성화 */

  // category 유무와 상관없이 모든 영상 표시

  // 전체/숏폼/롱폼 필터
  console.log('🎯 [WatchVideoList] 필터링 시작:', {
    videoFilter: videoFilter,
    filteredVideosCount: filteredVideos.length
  });

  let displayVideos = filteredVideos;
  const isShort = (v) => {
    if (v.type) return v.type === 'short';
    if (typeof v.durationSeconds === 'number') return v.durationSeconds < 181; // 3분 1초(181초) 미만은 쇼츠
    return true; // type이 없고 durationSeconds도 없으면 기본적으로 쇼츠로 분류
  };
  const isLong = (v) => {
    if (v.type) return v.type === 'long';
    if (typeof v.durationSeconds === 'number') return v.durationSeconds >= 181; // 3분 1초(181초) 이상만 롱폼
    return false; // type이 없고 durationSeconds도 없으면 기본적으로 쇼츠로 분류
  };

  if (videoFilter === 'short') {
    console.log('🎯 [필터] 숏폼 필터링 적용');
    displayVideos = filteredVideos.filter(isShort);
    console.log('🎯 [필터] 숏폼 결과:', displayVideos.length);
  } else if (videoFilter === 'long') {
    console.log('🎯 [필터] 롱폼 필터링 적용');
    displayVideos = filteredVideos.filter(isLong);
    console.log('🎯 [필터] 롱폼 결과:', displayVideos.length);
  } else {
    console.log('🎯 [필터] 전체 필터 (필터링 없음)');
  }

  console.log('🎯 [WatchVideoList] 최종 필터링 결과:', {
    videoFilter: videoFilter,
    beforeFilter: filteredVideos.length,
    afterFilter: displayVideos.length,
    sampleTypes: displayVideos.slice(0, 3).map(v => ({ title: v.title?.substring(0, 20), type: v.type, durationSeconds: v.durationSeconds }))
  });

  // 유크라 기준 정렬 적용
  console.log(`🔄 [정렬시작] sortKey: "${sortKey}", 영상수: ${displayVideos.length}`);
  displayVideos = [...displayVideos].sort((a, b) => {
    if (sortKey === 'duration') {
      // 영상 길이순 (짧은 것부터)
      const aDuration = (typeof a.durationSeconds === 'number' ? a.durationSeconds : a.duration) || 0;
      const bDuration = (typeof b.durationSeconds === 'number' ? b.durationSeconds : b.duration) || 0;
      return aDuration - bDuration;
    } else if (sortKey === 'views') {
      // 유크라 조회수순 (높은 것부터)
      const aViews = a.ucraViewCount || 0;
      const bViews = b.ucraViewCount || 0;
      return bViews - aViews;
    } else {
      // 최신순 (유크라 등록일 기준)
      const getTimestamp = (registeredAt) => {
        if (!registeredAt) return 0;
        if (registeredAt.seconds) return registeredAt.seconds * 1000; // Firebase Timestamp → 밀리초
        if (registeredAt instanceof Date) return registeredAt.getTime(); // Date → 밀리초
        if (typeof registeredAt === 'number') return registeredAt; // 이미 밀리초라고 가정
        return 0;
      };
      
      const aTime = getTimestamp(a.registeredAt);
      const bTime = getTimestamp(b.registeredAt);
      
      // 디버깅: 정렬 비교 로그 (더 자주 출력)
      if (Math.random() < 0.1) {
        console.log(`📅 [정렬비교] "${a.title?.substring(0, 15)}" (${aTime}) vs "${b.title?.substring(0, 15)}" (${bTime})`);
        console.log(`📅 [등록일상세] A: ${JSON.stringify(a.registeredAt)} | B: ${JSON.stringify(b.registeredAt)}`);
      }
      
      // 0인 값들은 맨 뒤로 보내기
      if (aTime === 0 && bTime === 0) return 0;
      if (aTime === 0) return 1;  // a를 뒤로
      if (bTime === 0) return -1; // b를 뒤로
      
      return bTime - aTime; // 일반적인 최신순 정렬
    }
  });
  
  // 정렬 결과 요약 (개발환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ [정렬완료] ${sortKey} 기준, 총 ${displayVideos.length}개 영상`);
    
    if (sortKey === 'latest' || sortKey === 'duration') {
      console.log(`📊 [${sortKey} 결과] 상위 10개 영상:`, displayVideos.slice(0, 10).map((v, idx) => ({
        순서: idx + 1,
        title: v.title?.substring(0, 25),
        registeredAt: v.registeredAt,
        timeValue: v.registeredAt?.seconds || v.registeredAt?.getTime?.() || 0,
        roomName: v.roomName,
        날짜표시: v.registeredAt?.seconds ? new Date(v.registeredAt.seconds * 1000).toLocaleString() : '등록일없음'
      })));
    }
  }

  // 🔀 재시청 가능/불가에 따라 잠긴 영상은 항상 맨 아래로 이동
  const activeVideos = [];
  const lockedVideos = [];
  displayVideos.forEach(v => {
    const vid = v.videoId || v.id;
    (canRewatch(vid) ? activeVideos : lockedVideos).push(v);
  });
  displayVideos = [...activeVideos, ...lockedVideos];

  // 시청 완료 처리 함수
  const handleWatchComplete = (videoId) => {
    console.log('✅ [WatchVideoList] 시청 완료 처리:', videoId);
    // 1시간 타이머 시작을 위해 setCertified 호출
    setCertified(videoId, true, 'manual');
    onWatchComplete(videoId);
    setRefreshTrigger(prev => prev + 1);
  };

  if (loadingUcraVideos) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        영상 불러오는 중...
      </div>
    );
  }

  if (displayVideos.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        아직 유크라에 업로드된 영상이 없습니다.<br />
        채팅방에 영상을 등록해서 다른 사용자들과 공유해보세요!
      </div>
    );
  }

  console.log(`🧮 [WatchVideoList] 최종 노출 영상 개수: ${displayVideos.length}`);
  
  // 🔍 현재 표시되는 영상들의 상세 정보 출력
  console.log('🔍 [WatchVideoList] 현재 표시되는 영상들:', displayVideos.map(video => ({
    title: video.title,
    registeredBy: video.registeredBy,
    uploaderUid: video.uploaderUid,
    channelId: video.channelId,
    channelTitle: video.channelTitle,
    videoId: video.videoId || video.id
  })));

  return (
    <VideoListRenderer
      videos={displayVideos}
      onWatchClick={onWatchClick}
      recommendedVideos={[]}
      getWatchCount={getWatchCount}
      onWatchComplete={handleWatchComplete}
      watchedVideos={new Set()}
    />
  );
};

export { VideoListRenderer };
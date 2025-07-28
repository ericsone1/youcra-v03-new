import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUcraVideos } from '../../hooks/useUcraVideos';
import { useWatchedVideos } from '../../../../contexts/WatchedVideosContext';
import { 
  getRecommendedCategories, 
  filterVideosByRecommendedCategories, 
  computeUniqueVideos 
} from '../../utils/dataProcessing';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ChannelNameWithBadge from '../../../ChannelNameWithBadge';
import { useVideoPlayer } from '../../../../contexts/VideoPlayerContext';
// import { useVideoDuration } from '../../../../contexts/VideoDurationContext';

// 영상 길이(초)를 시:분:초 또는 분:초로 변환
function formatDuration(duration) {
  // 이미 문자열 형태로 포맷된 경우 (예: "4:13") 그대로 반환
  if (typeof duration === 'string' && duration.includes(':') && !duration.includes('PT')) {
    return duration;
  }
  
  // YouTube API ISO 8601 형식 처리 (예: "PT6M8S", "PT2M56S")
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  // 숫자로 변환 (초 단위)
  const seconds = parseInt(duration);
  if (!seconds || isNaN(seconds) || seconds <= 0) return '시간 미확인';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(date) {
  if (!date) return '날짜 미확인';
  
  // ISO 문자열 또는 Timestamp 객체를 Date로 변환
  let d;
  if (typeof date === 'string') {
    // 이미 "전" 등이 포함된 경우 그대로 반환
    if (date.includes('전')) return date;
    // 한국어 날짜 형식이면 그대로 반환 (예: "2024. 1. 15.")
    if (date.match(/\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\./)) return date;
    
    d = new Date(date);
    if (isNaN(d)) return date; // 파싱 실패시 원본 반환
  } else if (date.seconds) {
    d = new Date(date.seconds * 1000);
  } else if (date instanceof Date) {
    d = date;
  }
  if (!d || isNaN(d)) return '날짜 미확인';
  
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}주 전`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}개월 전`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}년 전`;
}

// 카운트다운 표시 컴포넌트
const CountdownButton = ({ videoId, onTimeUp }) => {
  const { getTimeUntilRewatch } = useWatchedVideos();
  const [remainingMinutes, setRemainingMinutes] = useState(getTimeUntilRewatch(videoId));

  useEffect(() => {
    const interval = setInterval(() => {
      const newRemainingMinutes = getTimeUntilRewatch(videoId);
      setRemainingMinutes(newRemainingMinutes);
      
      if (newRemainingMinutes <= 0) {
        onTimeUp(videoId);
      }
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, [videoId, getTimeUntilRewatch, onTimeUp]);

  return (
    <div className="px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-sm rounded-lg font-semibold shadow-md whitespace-nowrap flex items-center gap-2">
      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {remainingMinutes}분 뒤 재시청 가능
    </div>
  );
};

// 영상 리스트 렌더러 (공통, 페이지네이션 추가)
const VideoListRenderer = ({ videos, onWatchClick = () => {}, recommendedVideos = [], getWatchCount = () => 0 }) => {
  const { watchedMap, canRewatch, getTimeUntilRewatch } = useWatchedVideos();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // WatchedVideosContext가 업데이트될 때마다 리스트 강제 리렌더
  useEffect(() => {
    setRefreshKey(k => k + 1);
  }, [watchedMap]);
  
  // 🔍 VideoListRenderer 디버깅
  console.log('🎬 [VideoListRenderer] 받은 데이터:', {
    videos: videos,
    videosType: typeof videos,
    videosIsArray: Array.isArray(videos),
    videosLength: videos?.length,
    recommendedVideosLength: recommendedVideos?.length,
    // 첫 번째 영상 샘플
    firstVideo: videos?.[0] ? {
      id: videos[0].id || videos[0].videoId,
      title: videos[0].title,
      durationSeconds: videos[0].durationSeconds,
      type: videos[0].type
    } : null
  });
  
  const PAGE_SIZE = 7;
  const [page, setPage] = useState(1);

  // 재시청 가능 / 불가 영상 분리
  const { availableVideos, lockedVideos } = useMemo(() => {
    if (!Array.isArray(videos)) return { availableVideos: [], lockedVideos: [] };
    const avail = [];
    const locked = [];
    videos.forEach(v => {
      const videoId = v.id || v.videoId;
      (canRewatch(videoId) ? avail : locked).push(v);
    });
    return { availableVideos: avail, lockedVideos: locked };
  }, [videos, watchedMap, canRewatch]);

  const totalPages = Math.ceil(availableVideos.length / PAGE_SIZE) || 1;

  // 현재 페이지가 범위를 벗어나면 첫 페이지로 리셋
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const pagedVideos = availableVideos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 시간이 지나서 재시청 가능해진 영상들 새로고침
  const handleTimeUp = (videoId) => {
    console.log('⏰ 재시청 가능해진 영상:', videoId);
    setRefreshKey(prev => prev + 1);
  };

  // 🔧 조건 체크 강화
  const hasVideos = availableVideos.length > 0;
  console.log('🔍 [VideoListRenderer] 영상 있는지 체크:', {
    hasVideos,
    videosCheck: videos,
    videosLengthCheck: videos?.length
  });

  if (!hasVideos) {
    console.log('📭 [VideoListRenderer] 영상이 없어서 빈 상태 표시');
    return (
      <div className="text-center text-gray-400 py-8">
        아직 유크라에 업로드된 영상이 없습니다.<br />채팅방에 영상을 등록해서 다른 사용자들과 공유해보세요!
        {recommendedVideos && recommendedVideos.length > 0 && (
          <div className="mt-8">
            <div className="text-blue-600 font-bold mb-3 text-center">💡 연관 추천 영상</div>
            <ul className="space-y-3">
              {recommendedVideos.map((video, idx) => (
                <li
                  key={video.id || video.videoId}
                  className="bg-blue-50 p-4 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                  onClick={() => onWatchClick(video, idx, recommendedVideos)}
                >
                  <div className="flex items-start gap-4">
                    {/* 썸네일 */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.thumbnail || video.thumbnailUrl || `https://img.youtube.com/vi/${video.videoId || video.id}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/128x72?text=No+Image';
                        }}
                      />
                      {/* 재생 시간 */}
                      {video.durationDisplay && (
                        <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                          {video.durationDisplay}
                        </span>
                      )}
                      {/* 추천 배지 */}
                      <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        추천
                      </span>
                    </div>

                    {/* 영상 정보 */}
                    <div className="flex-1 min-w-0">
                      {/* 제목 */}
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 leading-snug">
                        {video.title || '제목 없음'}
                      </h3>
                      
                      {/* 영상 길이 */}
                      <div className="flex items-center mb-1">
                        <p className="text-xs text-gray-600 font-medium">
                          {video.durationDisplay || '시간 미확인'}
                        </p>
                      </div>
                      
                      {/* 조회수 */}
                      <div className="text-xs text-gray-500">
                        <span>조회수 {(video.viewCount || video.views || 0).toLocaleString()}회</span>
                      </div>
                    </div>

                    {/* 시청하기 버튼 */}
                    <div className="flex-shrink-0">
                      <button
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 whitespace-normal"
                        onClick={e => { e.stopPropagation(); onWatchClick(video, idx, recommendedVideos); }}
                      >
                        시청하기
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 현재 페이지의 영상들 */}
      <ul className="space-y-4">
        {pagedVideos.map((video, idx) => {
          const videoId = video.id || video.videoId;
          return (
            <li
              key={videoId + '-' + refreshKey}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200 cursor-pointer"
              onClick={() => onWatchClick(video, idx, availableVideos)}
            >
              <div className="flex items-start gap-4">
                {/* 썸네일 - 더 큰 사이즈로 */}
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail || video.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-40 h-24 object-cover rounded-lg shadow-sm"
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

                {/* 영상 정보 */}
                <div className="flex-1 min-w-0">
                  {/* 제목 */}
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2 leading-snug">
                    {video.title || '제목 없음'}
                  </h3>
                  
                  {/* 영상 길이 */}
                  <div className="flex items-center mb-2">
                    <p className="text-sm text-gray-600 font-medium">
                      {video.durationDisplay || '시간 미확인'}
                    </p>
                  </div>
                  
                  {/* 유크라 플레이 횟수와 업로드일 */}
                  <div className="flex items-center text-sm text-gray-500">
                    <span>유크라 플레이 {(video.ucraViewCount || 0).toLocaleString()}회</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(video.publishedAt || video.uploadedAt)}</span>
                  </div>
                </div>

                {/* 시청하기 버튼 */}
                <div className="flex-shrink-0">
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 whitespace-normal"
                    onClick={e => { e.stopPropagation(); onWatchClick(video, idx, availableVideos); }}
                  >
                    {getWatchCount(videoId).watchCount > 0 ? '재시청' : '시청하기'}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* 재시청 대기 중인 영상들 */}
      {lockedVideos.length > 0 && (
        <div className="mt-10 space-y-4">
          <h4 className="text-sm font-semibold text-gray-600 pl-1">최근 시청 영상 (재시청 대기 중)</h4>
          <ul className="space-y-4">
            {lockedVideos.map((video, idx) => {
              const videoId = video.id || video.videoId;
              const info = getWatchCount(videoId);
              const watchCount = info.watchCount || 0;
              const nextWatchCount = watchCount + 1;
              return (
                <li key={videoId + '-locked-' + refreshKey}
                    className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex items-start gap-4">
                  {/* 썸네일 */}
                  <div className="relative flex-shrink-0">
                    <img src={video.thumbnail || video.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                         alt={video.title}
                         className="w-32 h-20 object-cover rounded-lg shadow-sm"
                         onError={e => { e.target.src='https://via.placeholder.com/128x72?text=영상'; }} />
                    {video.durationDisplay && (
                      <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                        {video.durationDisplay}
                      </span>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1 leading-snug">{video.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{video.durationDisplay || '시간 미확인'}</p>
                    <div className="flex items-center gap-2">
                      <CountdownButton videoId={videoId} onTimeUp={handleTimeUp} />
                      <span className="text-xs text-gray-500">시청 {watchCount}회</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전
          </button>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg min-w-[2.5rem] text-center">
              {page}
            </span>
            <span className="text-gray-400 text-sm">/</span>
            <span className="text-gray-600 text-sm font-medium min-w-[2.5rem] text-center">
              {totalPages}
            </span>
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm transition-all duration-200"
          >
            다음
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
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
  getWatchCount = () => 0 // 시청 횟수 조회 함수
}) => {
  const { currentUser } = useAuth();
  const { ucraVideos, loadingUcraVideos, error } = useUcraVideos();
  const { watchedMap, canRewatch, getTimeUntilRewatch } = useWatchedVideos();
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
      const aTime = a.registeredAt?.seconds || a.registeredAt?.getTime?.() || 0;
      const bTime = b.registeredAt?.seconds || b.registeredAt?.getTime?.() || 0;
      return bTime - aTime;
    }
  });
  
  // 정렬 결과 요약 (개발환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ [정렬완료] ${sortKey} 기준, 총 ${displayVideos.length}개 영상`);
  }

  // 🔀 재시청 가능/불가에 따라 잠긴 영상은 항상 맨 아래로 이동
  const activeVideos = [];
  const lockedVideos = [];
  displayVideos.forEach(v => {
    const vid = v.videoId || v.id;
    (canRewatch(vid) ? activeVideos : lockedVideos).push(v);
  });
  displayVideos = [...activeVideos, ...lockedVideos];

  // --- 더보기(페이지네이션) ---
  const [visibleCount, setVisibleCount] = useState(10);
  const visibleVideos = displayVideos.slice(0, visibleCount);

  // 시간이 지나서 재시청 가능해진 영상들 새로고침
  const handleTimeUp = (videoId) => {
    console.log('⏰ 재시청 가능해진 영상:', videoId);
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
    <>
      <div className="flex flex-col gap-3">
        {visibleVideos.map(video => {
          const videoId = video.videoId || video.id;
          const canWatchNow = canRewatch(videoId);
          
          // 쇼츠 분류 확인 (개발환경에서만 샘플링)
          if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
            console.log(`🎬 [영상샘플] ${video.title?.substring(0, 15)}: ${video.type} (${video.durationSeconds}초)`);
          }
          
          return (
            <div
              key={videoId + '-' + refreshTrigger}
              className="bg-white rounded-xl shadow hover:shadow-md transition p-3 cursor-pointer"
            >
              {/* 상단: 썸네일 + 제목 + 시청하기 버튼 */}
              <div className="flex items-center gap-3 mb-2">
                {/* 썸네일 */}
                <div className="relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={video.thumbnailUrl || video.thumbnail || 'https://via.placeholder.com/80x56?text=No+Image'}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { e.target.src = 'https://via.placeholder.com/80x56?text=No+Image'; }}
                  />
                  {video.type === 'short' && (
                    <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full shadow">
                      쇼츠
                    </span>
                  )}
                </div>
                
                {/* 제목 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 leading-tight" 
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                      title={video.title}>
                    {video.title}
                  </h3>
                </div>
                
                {/* 시청하기 버튼 */}
                <div className="flex-shrink-0">
                {canWatchNow ? (
                  (() => {
                    const info = getWatchCount(videoId);
                    const watchCount = info.watchCount || 0;
                    const isRewatch = watchCount > 0;
                    const nextWatchCount = watchCount + 1;
                    
                    return (
                      <button
                        className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg shadow-sm whitespace-normal transition-all duration-200 ${
                          isRewatch 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        }`}
                        onClick={e => { e.stopPropagation(); onWatchClick && onWatchClick(video, activeVideos.indexOf(video), activeVideos); }}
                      >
                        {isRewatch ? '재시청' : '시청하기'}
                      </button>
                    );
                  })()
                ) : (
                  <CountdownButton 
                    videoId={videoId} 
                    onTimeUp={handleTimeUp}
                  />
                )}
                </div>
              </div>
              
              {/* 하단: 부가정보 */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span className="truncate">{(() => {
                  const finalDisplay = video.durationDisplay || formatDuration(video.durationSeconds) || '시간 미확인';
                  
                  // 디버깅: 가끔씩만 샘플링 로그
                  if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
                    console.log(`⏱️ [Duration] ${video.title?.substring(0, 15)}: ${finalDisplay}`);
                  }
                  
                  return finalDisplay;
                })()}</span>
                <div className="flex items-center gap-2 text-xs text-gray-400 ml-2">
                  <span>유크라 플레이 {video.ucraViewCount?.toLocaleString() || '0'}회</span>
                  <span>•</span>
                  <span className="whitespace-nowrap">{formatDate(video.publishedAt || video.uploadedAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* 더보기 버튼 */}
      {visibleCount < displayVideos.length && (
        <div className="flex justify-center mt-4">
          <button
            className="px-6 py-2 bg-gray-100 hover:bg-blue-100 text-blue-600 font-semibold rounded-lg shadow-sm text-sm"
            onClick={() => setVisibleCount(c => c + 10)}
          >
            더보기
          </button>
        </div>
      )}
    </>
  );
};

export { VideoListRenderer };
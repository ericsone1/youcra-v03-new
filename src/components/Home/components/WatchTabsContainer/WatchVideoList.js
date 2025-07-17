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

// 영상 길이(초)를 시:분:초 또는 분:초로 변환
function formatDuration(duration) {
  // 이미 문자열 형태로 포맷된 경우 (예: "4:13") 그대로 반환
  if (typeof duration === 'string' && duration.includes(':')) {
    return duration;
  }
  
  // 숫자로 변환
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
                      
                      {/* 채널명 */}
                      <div className="flex items-center mb-1">
                        <p className="text-xs text-gray-600 font-medium">
                          {video.channelTitle || video.channel || '채널명 없음'}
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
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 whitespace-nowrap"
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
                  
                  {/* 채널명 */}
                  <div className="flex items-center mb-2">
                    <p className="text-sm text-gray-600 font-medium hover:text-gray-900 cursor-pointer">
                      {video.channelTitle || video.channel || '채널명 없음'}
                    </p>
                  </div>
                  
                  {/* 조회수와 업로드 날짜 */}
                  <div className="flex items-center text-sm text-gray-500">
                    <span>조회수 {(video.viewCount || video.views || 0).toLocaleString()}회</span>
                    <span className="mx-2">•</span>
                    <span>{video.uploadedAt || '등록일 없음'}</span>
                  </div>
                </div>

                {/* 시청하기 버튼 */}
                <div className="flex-shrink-0">
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 whitespace-nowrap"
                    onClick={e => { e.stopPropagation(); onWatchClick(video, idx, availableVideos); }}
                  >
                    {getWatchCount(videoId).watchCount > 0 ? `재시청하기 (${getWatchCount(videoId).watchCount + 1}번째)` : '시청하기'}
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
                    <p className="text-xs text-gray-600 mb-2">{video.channelTitle || video.channel || '채널명 없음'}</p>
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
  getWatchCount = () => 0 // 시청 횟수 조회 함수
}) => {
  const { currentUser } = useAuth();
  const { ucraVideos, loadingUcraVideos } = useUcraVideos();
  const { watchedMap, canRewatch, getTimeUntilRewatch } = useWatchedVideos();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 내 영상 제외
  const filteredVideos = ucraVideos.filter(
    v => v.registeredBy !== currentUser?.uid && v.registeredBy !== currentUser?.email
  );

  // 전체/숏폼/롱폼 필터
  let displayVideos = filteredVideos;
  const isShort = (v) => {
    if (v.type) return v.type === 'short';
    if (typeof v.durationSeconds === 'number') return v.durationSeconds < 60;
    return false;
  };
  const isLong = (v) => {
    if (v.type) return v.type === 'long';
    if (typeof v.durationSeconds === 'number') return v.durationSeconds >= 60;
    return true;
  };

  if (videoFilter === 'short') {
    displayVideos = filteredVideos.filter(isShort);
  } else if (videoFilter === 'long') {
    displayVideos = filteredVideos.filter(isLong);
  }

  // 정렬 적용 (조회수 정렬은 Firestore 값만 사용)
  displayVideos = [...displayVideos].sort((a, b) => {
    if (sortKey === 'duration') {
      const aDuration = (typeof a.durationSeconds === 'number' ? a.durationSeconds : a.duration) || 0;
      const bDuration = (typeof b.durationSeconds === 'number' ? b.durationSeconds : b.duration) || 0;
      return aDuration - bDuration;
    } else if (sortKey === 'views') {
      return (b.viewCount || b.views || 0) - (a.viewCount || a.views || 0);
    } else {
      const aTime = a.registeredAt?.seconds || 0;
      const bTime = b.registeredAt?.seconds || 0;
      return bTime - aTime;
    }
  });

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

  return (
    <>
      <div className="flex flex-col gap-3">
        {visibleVideos.map(video => {
          const videoId = video.videoId || video.id;
          const canWatchNow = canRewatch(videoId);
          
          return (
            <div
              key={videoId + '-' + refreshTrigger}
              className="flex items-center bg-white rounded-xl shadow hover:shadow-md transition p-2 sm:p-3 cursor-pointer gap-3"
            >
              {/* 썸네일: 등록 이미지 우선, 없으면 No Image */}
              <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={video.thumbnailUrl || video.thumbnail || 'https://via.placeholder.com/128x72?text=No+Image'}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={e => { e.target.src = 'https://via.placeholder.com/128x72?text=No+Image'; }}
                />
                {video.type === 'short' && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                    쇼츠
                  </span>
                )}
              </div>
              {/* 정보 영역 */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="font-semibold text-base text-gray-900 truncate" title={video.title}>{video.title}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{video.channelTitle}</div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span>
                    조회수 {video.viewCount?.toLocaleString() || video.views?.toLocaleString() || '-'}
                  </span>
                  <span>· {video.uploadedAt}</span>
                </div>
              </div>
              {/* 시청하기 버튼 */}
              <div className="flex flex-col justify-end h-full">
                {canWatchNow ? (
                  (() => {
                    const info = getWatchCount(videoId);
                    const watchCount = info.watchCount || 0;
                    const isRewatch = watchCount > 0;
                    const nextWatchCount = watchCount + 1;
                    
                    return (
                      <button
                        className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg shadow-sm whitespace-nowrap transition-all duration-200 ${
                          isRewatch 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        }`}
                        onClick={e => { e.stopPropagation(); onWatchClick && onWatchClick(video, activeVideos.indexOf(video), activeVideos); }}
                      >
                        {isRewatch ? `재시청하기 (${nextWatchCount}번째)` : '시청하기'}
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
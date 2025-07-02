import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUcraVideos } from '../../hooks/useUcraVideos';
import { useAuth } from '../../../../contexts/AuthContext';
import { useVideoPlayer } from '../../../../contexts/VideoPlayerContext';
import { computeUniqueVideos } from '../../utils/videoUtils';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ChannelNameWithBadge from '../../../ChannelNameWithBadge';
import { getRecommendedCategories, filterVideosByRecommendedCategories } from '../../utils/dataProcessing';
import { useNavigate } from 'react-router-dom';

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

// 영상 리스트 렌더러 (공통, 페이지네이션 추가)
const VideoListRenderer = ({ videos, onWatchClick = () => {}, recommendedVideos = [], getWatchCount = () => 0 }) => {
  const PAGE_SIZE = 7;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil((videos?.length || 0) / PAGE_SIZE);
  const pagedVideos = videos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        아직 등록된 영상이 없습니다.<br />상단의 '내 영상 등록하기' 버튼을 눌러 첫 영상을 등록해보세요!
        {recommendedVideos && recommendedVideos.length > 0 && (
          <div className="mt-8">
            <div className="text-blue-600 font-bold mb-3 text-center">💡 연관 추천 영상</div>
            <ul className="space-y-2">
              {recommendedVideos.map((video, idx) => (
                <li
                  key={video.id}
                  className="flex gap-3 items-center p-3 bg-blue-50 rounded-lg shadow-sm hover:shadow-md hover:bg-blue-100 transition-all cursor-pointer border border-blue-200"
                  onClick={() => onWatchClick(video, idx, videos)}
                >
                  {/* 썸네일 */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.thumbnailUrl || video.thumbnail}
                      alt={video.title}
                      className="w-24 h-14 object-cover rounded border border-gray-200"
                      onError={e => { e.target.src = 'https://img.youtube.com/vi/' + (video.videoId || video.id) + '/mqdefault.jpg'; }}
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded text-center min-w-[32px]">
                      {video.durationDisplay || 
                       formatDuration(video.durationSeconds) || 
                       formatDuration(video.duration) || 
                       '?:??'}
                    </div>
                  </div>
                  
                  {/* 영상 정보 */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-semibold text-sm text-gray-900 truncate leading-tight">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600 truncate max-w-[120px]">
                        {video.channelTitle || video.channel || '채널명 없음'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 bg-green-100 text-green-600">
                        추천
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>👁️</span>
                        <span>{Number(video.viewCount || video.views || video.statistics?.viewCount || 0).toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>👍</span>
                        <span>{Number(video.likeCount || video.statistics?.likeCount || 0).toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        <span className="truncate">{formatDate(video.uploadedAt || video.publishedAt || video.registeredAt)}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* 시청하기 버튼 */}
                  <div className="flex-shrink-0">
                    {(() => {
                      const watchCount = getWatchCount(video.id || video.videoId);
                      const isRewatch = watchCount > 0;
                      const nextWatchCount = watchCount + 1;
                      
                      return (
                        <button
                          className={`px-3 py-1.5 text-white text-xs rounded-full font-medium transition-colors shadow-sm whitespace-nowrap ${
                            isRewatch 
                              ? 'bg-green-500 hover:bg-green-600 active:bg-green-700' 
                              : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                          }`}
                          onClick={e => { e.stopPropagation(); onWatchClick(video, idx, videos); }}
                        >
                          {isRewatch ? `${nextWatchCount}번째 시청` : '시청하기'}
                        </button>
                      );
                    })()}
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
    <ul className="space-y-2">
      {videos.map((video, idx) => (
        <li
          key={video.id}
          className="flex gap-3 items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-blue-50 transition-all cursor-pointer border border-gray-100"
          onClick={() => onWatchClick(video, idx, videos)}
        >
          {/* 썸네일 */}
          <div className="relative flex-shrink-0">
            <img
              src={video.thumbnailUrl || video.thumbnail}
              alt={video.title}
              className="w-24 h-14 object-cover rounded border border-gray-200"
              onError={e => { e.target.src = 'https://img.youtube.com/vi/' + (video.videoId || video.id) + '/mqdefault.jpg'; }}
            />
            {/* 영상 길이 오버레이 */}
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded text-center min-w-[32px]">
              {video.durationDisplay || 
               formatDuration(video.durationSeconds) || 
               formatDuration(video.duration) || 
               '?:??'}
            </div>
          </div>
          
          {/* 영상 정보 */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* 제목 */}
            <h3 className="font-semibold text-sm text-gray-900 truncate leading-tight">
              {video.title}
            </h3>
            
            {/* 채널명과 타입을 한 줄에 */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600 truncate max-w-[120px]">
                {video.channelTitle || video.channel || '채널명 없음'}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                video.type === 'short' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {video.type === 'short' ? '숏폼' : '롱폼'}
              </span>
            </div>
            
            {/* 통계 정보를 한 줄에 */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span>👁️</span>
                <span>{(video.views || video.viewCount || 0).toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1">
                <span>👍</span>
                <span>{(video.likeCount || 0).toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1">
                <span>📅</span>
                <span className="truncate">{formatDate(video.uploadedAt || video.publishedAt)}</span>
              </span>
            </div>
          </div>
          
          {/* 시청하기 버튼 */}
          <div className="flex-shrink-0">
            {(() => {
              const watchCount = getWatchCount(video.id || video.videoId);
              const isRewatch = watchCount > 0;
              const nextWatchCount = watchCount + 1;
              
              return (
                <button
                  className={`px-3 py-1.5 text-white text-xs rounded-full font-medium transition-colors shadow-sm whitespace-nowrap ${
                    isRewatch 
                      ? 'bg-green-500 hover:bg-green-600 active:bg-green-700' 
                      : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                  }`}
                  onClick={e => { 
                    e.stopPropagation(); 
                console.log('🔥 WatchVideoList - 버튼 클릭됨!', video, typeof onWatchClick);
                if (typeof onWatchClick === 'function') {
                  onWatchClick(video, idx, videos);
                } else {
                  console.error('❌ onWatchClick이 함수가 아닙니다:', onWatchClick);
                }
                  }}
                >
                  {isRewatch ? `${nextWatchCount}번째 시청` : '시청하기'}
                </button>
              );
            })()}
          </div>
        </li>
      ))}
    </ul>
  );
};

export const WatchVideoList = ({ 
  videoFilter, 
  onTokenEarned, 
  onWatchClick, 
  selectedCategories = [], 
  watchVideos = [], // Home에서 전달받은 YouTube API 데이터
  getWatchCount = () => 0 // 시청 횟수 조회 함수
}) => {
  const { currentUser } = useAuth();
  const { ucraVideos, loadingUcraVideos } = useUcraVideos();
  const [sortKey, setSortKey] = useState('duration'); // 기본값: 영상 길이순
  const [showPlayer, setShowPlayer] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) {
    return null; // 로그인 안내/버튼을 렌더링하지 않음
  }

  console.log('🎬 WatchVideoList에서 받은 데이터:', {
    watchVideos: watchVideos,
    watchVideosCount: watchVideos.length,
    videoFilter: videoFilter
  });

  // YouTube API 데이터가 있으면 우선 사용, 없으면 Firestore 데이터 사용
  let sourceVideos = watchVideos.length > 0 ? watchVideos : ucraVideos;
  
  // 내 영상 제외 (Firestore 데이터인 경우에만)
  if (watchVideos.length === 0) {
    sourceVideos = ucraVideos.filter(
      v => v.registeredBy !== currentUser?.uid && v.registeredBy !== currentUser?.email
    );
  }

  // 중복 영상 제거 (videoId 기준) - YouTube API 데이터는 이미 중복 제거됨
  const uniqueVideos = watchVideos.length > 0 ? sourceVideos : computeUniqueVideos(sourceVideos);

  // 숏폼/롱폼 조건 필터링 (durationSeconds 우선, duration 보조 사용)
  let displayVideos = uniqueVideos;
  if (videoFilter === 'short') {
    displayVideos = uniqueVideos.filter(v => {
      // durationSeconds가 있으면 우선 사용 (YouTube API 데이터)
      if (typeof v.durationSeconds === 'number' && v.durationSeconds > 0) {
        return v.durationSeconds <= 180;
      }
      // 없으면 duration 사용 (Firestore 데이터)
      return typeof v.duration === 'number' && v.duration > 0 && v.duration <= 180;
    });
  } else if (videoFilter === 'long') {
    displayVideos = uniqueVideos.filter(v => {
      // durationSeconds가 있으면 우선 사용 (YouTube API 데이터)
      if (typeof v.durationSeconds === 'number' && v.durationSeconds > 0) {
        return v.durationSeconds > 180;
      }
      // 없으면 duration 사용 (Firestore 데이터)
      return typeof v.duration === 'number' && v.duration > 180;
    });
  }

  // 정렬 적용
  displayVideos = [...displayVideos].sort((a, b) => {
    if (sortKey === 'duration') {
      // durationSeconds 우선 사용, 없으면 duration 사용
      const aDuration = (typeof a.durationSeconds === 'number' ? a.durationSeconds : a.duration) || 0;
      const bDuration = (typeof b.durationSeconds === 'number' ? b.durationSeconds : b.duration) || 0;
      return aDuration - bDuration; // 영상 길이 오름차순(짧은 영상이 위)
    } else if (sortKey === 'views') {
      return (b.viewCount || b.views || 0) - (a.viewCount || a.views || 0); // 조회수 내림차순
    } else {
      // 최신순(등록일 내림차순)
      const aTime = a.registeredAt?.seconds || 0;
      const bTime = b.registeredAt?.seconds || 0;
      return bTime - aTime;
    }
  });

  // 연관 추천 영상 계산 (시청할 영상이 없을 때만)
  let recommendedVideos = [];
  if (displayVideos.length === 0 && selectedCategories && selectedCategories.length > 0) {
    const recommendedCategories = getRecommendedCategories(selectedCategories.map(cat => typeof cat === 'string' ? cat : cat.category));
    
    // YouTube API 데이터가 있으면 우선 사용, 없으면 Firestore 데이터 사용
    const sourceForRecommended = watchVideos.length > 0 ? watchVideos : uniqueVideos;
    recommendedVideos = filterVideosByRecommendedCategories(sourceForRecommended, recommendedCategories);
  }

  // <GlobalVideoPlayer />는 Home/index.js 등 상위에서 항상 렌더링되어 있어야 함

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* 정렬 옵션 드롭다운 */}
      <div className="flex justify-end mb-2">
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
      {loadingUcraVideos ? (
        <div className="text-center text-gray-500 py-8">영상 불러오는 중...</div>
      ) : (
        <VideoListRenderer
          videos={displayVideos}
          onWatchClick={onWatchClick}
          recommendedVideos={recommendedVideos}
          getWatchCount={getWatchCount}
        />
      )}
    </motion.div>
  );
};

export { VideoListRenderer }; 
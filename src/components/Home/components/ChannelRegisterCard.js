import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiTrash2 } from 'react-icons/fi';
import { API_KEY } from '../utils/constants';

export const ChannelRegisterCard = ({ onRegister, channelInfo, onDelete = () => {} }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 디버깅: props 확인
  useEffect(() => {
    console.log('ChannelRegisterCard props:', {
      hasOnDelete: typeof onDelete === 'function',
      channelInfo
    });
  }, [onDelete, channelInfo]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 구독자 수와 조회수 포맷팅
  const formatCount = (count) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // 실제 YouTube API를 사용해서 채널 정보 가져오기
  const fetchChannelInfo = async (input) => {
    if (!API_KEY) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    let searchQuery = input.trim();
    let channelId = null;

    // 1. 입력값 분석 및 채널 ID 추출
    if (input.includes('youtube.com/channel/')) {
      // 채널 URL (youtube.com/channel/UC...)
      channelId = input.split('channel/')[1].split('/')[0].split('?')[0];
    } else if (input.includes('youtube.com/@')) {
      // 핸들 URL (youtube.com/@dongapmatjip)
      searchQuery = input.split('@')[1].split('/')[0].split('?')[0];
    } else if (input.startsWith('@')) {
      // 핸들 입력 (@dongapmatjip)
      searchQuery = input.substring(1);
    } else if (input.startsWith('UC') && input.length === 24) {
      // 직접 채널 ID 입력
      channelId = input;
    }
    // 그 외는 일반 검색어로 처리

    let channelData = null;

    try {
      // 2. 채널 ID가 있으면 직접 조회
      if (channelId) {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`
        );
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message);
        }
        
        if (data.items && data.items.length > 0) {
          channelData = data.items[0];
        }
      }

      // 3. 채널 ID가 없거나 조회 실패 시 검색
      if (!channelData && searchQuery) {
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&maxResults=1&key=${API_KEY}`
        );
        const searchData = await searchResponse.json();
        
        if (searchData.error) {
          throw new Error(searchData.error.message);
        }
        
        if (searchData.items && searchData.items.length > 0) {
          const foundChannelId = searchData.items[0].snippet.channelId;
          
          // 찾은 채널 ID로 상세 정보 조회
          const channelResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${foundChannelId}&key=${API_KEY}`
          );
          const channelDetailData = await channelResponse.json();
          
          if (channelDetailData.error) {
            throw new Error(channelDetailData.error.message);
          }
          
          if (channelDetailData.items && channelDetailData.items.length > 0) {
            channelData = channelDetailData.items[0];
          }
        }
      }

      if (!channelData) {
        throw new Error('채널을 찾을 수 없습니다. 채널 URL이나 핸들을 확인해주세요.');
      }

      return {
        id: channelData.id,
        title: channelData.snippet.title,
        handle: channelData.snippet.customUrl ? `@${channelData.snippet.customUrl}` : `@${channelData.snippet.title.replace(/\s+/g, '')}`,
        thumbnailUrl: channelData.snippet.thumbnails.high?.url || channelData.snippet.thumbnails.default?.url,
        subscriberCount: formatCount(channelData.statistics.subscriberCount || '0') + '명',
        videoCount: parseInt(channelData.statistics.videoCount || '0') + '개',
        viewCount: formatCount(channelData.statistics.viewCount || '0')
      };

    } catch (error) {
      console.error('YouTube API 오류:', error);
      throw new Error('채널 정보를 가져오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const channelInfo = await fetchChannelInfo(inputValue.trim());
      onRegister(channelInfo);
      setInputValue('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (channelInfo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow p-3 flex items-center gap-4 relative"
      >
        <img 
          src={channelInfo.thumbnailUrl || 'https://via.placeholder.com/64x64/cccccc/ffffff?text=CH'} 
          alt={channelInfo.title} 
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0" 
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/64x64/cccccc/ffffff?text=CH';
          }}
        />
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base font-bold text-gray-900 truncate max-w-[120px]">{channelInfo.title || '동감맛집'}</span>
            <span className="flex items-center text-xs text-gray-500 font-medium ml-1"><span className="text-blue-500">👥</span>{channelInfo.subscriberCount || '15명'}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-gray-700 bg-white rounded px-2 py-0.5 shadow-sm"><span className="text-blue-500">🎬</span>{channelInfo.videoCount || '2개'}</span>
            <span className="flex items-center gap-1 text-xs text-gray-700 bg-white rounded px-2 py-0.5 shadow-sm"><span className="text-blue-500">👁️</span>{channelInfo.viewCount || '2.8K'}</span>
          </div>
        </div>
        <button 
          onClick={() => {
            console.log('설정 버튼 클릭, 현재 드롭다운 상태:', showDropdown);
            setShowDropdown(!showDropdown);
          }}
          className="ml-auto p-2 rounded-full bg-white hover:bg-gray-50 shadow border border-gray-200 z-10"
          title="채널 설정"
        >
          <FiSettings className="text-blue-600 w-5 h-5" />
        </button>
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-3 top-14 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20"
            >
              <button
                onClick={() => {
                  console.log('채널 초기화 드롭다운 버튼 클릭');
                  setShowDropdown(false);
                  onDelete();
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FiTrash2 className="w-4 h-4 text-red-600" />
                채널 초기화
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
    >
      {/* YouTube 아이콘과 제목 */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">유튜브 채널 연동</h2>
        <p className="text-gray-600">채널 URL, 핸들(@), 또는 채널명을 입력해주세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="예: @동감맛집, https://youtube.com/@donggam, 동감맛집"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-center"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '검색 중...' : '채널 연동'}
        </button>
      </form>
    </motion.div>
  );
}; 
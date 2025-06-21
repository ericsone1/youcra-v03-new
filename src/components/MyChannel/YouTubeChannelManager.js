import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, deleteField, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { extractChannelId, fetchYouTubeChannelInfo } from '../../services/videoService';
import { useAuth } from '../../contexts/AuthContext';

// 카테고리 데이터
const YOUTUBE_CATEGORIES = [
  { id: 'gaming', name: '게임', icon: '🎮', color: 'bg-red-500', description: '게임 플레이 및 리뷰' },
  { id: 'entertainment', name: '엔터테인먼트', icon: '🎭', color: 'bg-purple-500', description: '예능, 코미디, 버라이어티' },
  { id: 'music', name: '음악', icon: '🎵', color: 'bg-pink-500', description: '음악, 커버, 작곡' },
  { id: 'education', name: '교육', icon: '📚', color: 'bg-blue-500', description: '강의, 튜토리얼, 설명' },
  { id: 'tech', name: '기술', icon: '💻', color: 'bg-gray-600', description: '프로그래밍, IT, 소프트웨어' },
  { id: 'lifestyle', name: '라이프스타일', icon: '✨', color: 'bg-green-500', description: '일상, 브이로그, 데코' },
  { id: 'cooking', name: '요리', icon: '👨‍🍳', color: 'bg-orange-500', description: '레시피, 쿠킹, 맛집' },
  { id: 'travel', name: '여행', icon: '✈️', color: 'bg-sky-500', description: '여행기, 관광지, 문화' },
  { id: 'beauty', name: '뷰티', icon: '💄', color: 'bg-rose-500', description: '메이크업, 스킨케어, 패션' },
  { id: 'fitness', name: '운동', icon: '💪', color: 'bg-red-600', description: '헬스, 홈트, 다이어트' },
  { id: 'review', name: '리뷰', icon: '⭐', color: 'bg-yellow-500', description: '제품리뷰, 언박싱, 평가' },
  { id: 'comedy', name: '코미디', icon: '😂', color: 'bg-amber-500', description: '개그, 유머, 웃긴영상' },
  { id: 'news', name: '뉴스', icon: '📰', color: 'bg-slate-600', description: '시사, 정치, 사회' },
  { id: 'animal', name: '동물', icon: '🐶', color: 'bg-emerald-500', description: '반려동물, 동물원, 야생동물' },
  { id: 'kids', name: '키즈', icon: '🧸', color: 'bg-indigo-500', description: '어린이, 교육, 놀이' },
  { id: 'sports', name: '스포츠', icon: '⚽', color: 'bg-teal-600', description: '축구, 야구, 올림픽' },
  { id: 'science', name: '과학', icon: '🔬', color: 'bg-cyan-600', description: '실험, 연구, 과학상식' },
  { id: 'art', name: '예술', icon: '🎨', color: 'bg-fuchsia-500', description: '그림, 조각, 창작' },
  { id: 'business', name: '비즈니스', icon: '💼', color: 'bg-stone-600', description: '경제, 투자, 창업' },
  { id: 'other', name: '기타', icon: '📝', color: 'bg-neutral-500', description: '기타 장르' }
];

const YouTubeChannelManager = () => {
  const { currentUser } = useAuth();
  const [channelData, setChannelData] = useState(null);
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 디버그 로그 추가
  console.log('🎬 YouTubeChannelManager 렌더링됨');
  console.log('현재 유저:', currentUser?.uid);
  console.log('채널 데이터:', channelData);

  useEffect(() => {
    loadChannelData();
  }, [currentUser]);

  const loadChannelData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().youtubeChannel) {
        const channelData = userDoc.data().youtubeChannel;
        setChannelData(channelData);
        
        if (channelData.category) {
          setSelectedCategory(channelData.category);
        }
        
        const lastSync = channelData.lastSyncAt;
        const now = new Date();
        const hoursSinceLastSync = lastSync ? 
          (now - new Date(lastSync.seconds ? lastSync.seconds * 1000 : lastSync)) / (1000 * 60 * 60) : 
          999;
        
        if (hoursSinceLastSync >= 24) {
          console.log('24시간 경과로 자동 동기화 시작');
          autoSyncChannel(channelData);
        }
      }
    } catch (error) {
      console.error('채널 데이터 로드 오류:', error);
    }
  };

  const handleCategorySelect = async (category) => {
    if (!currentUser?.uid || !channelData) return;

    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        youtubeChannel: {
          ...channelData,
          category: category
        }
      }, { merge: true });

      setSelectedCategory(category);
      setChannelData(prev => ({ ...prev, category }));
      setShowCategoryModal(false);
      setMessage(`✅ 카테고리가 "${category.name}"로 설정되었습니다!`);
      
    } catch (error) {
      console.error('카테고리 저장 오류:', error);
      setMessage(`카테고리 저장 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleDeleteChannel = async () => {
    if (!currentUser?.uid) return;

    setIsLoading(true);
    setMessage('');

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        youtubeChannel: deleteField()
      });

      setChannelData(null);
      setSelectedCategory(null);
      setShowDeleteModal(false);
      setShowManageDropdown(false);
      setMessage('✅ 채널이 성공적으로 삭제되었습니다!');
      
    } catch (error) {
      console.error('채널 삭제 오류:', error);
      setMessage(`채널 삭제 중 오류가 발생했습니다: ${error.message}`);
      setShowDeleteModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const autoSyncChannel = async (oldChannelData) => {
    try {
      const channelInfo = { type: 'channel', value: oldChannelData.channelId };
      const updatedDetails = await fetchYouTubeChannelInfo(channelInfo);
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        youtubeChannel: updatedDetails
      }, { merge: true });

      setChannelData(updatedDetails);
      console.log('채널 정보 자동 동기화 완료');
      
    } catch (error) {
      console.error('자동 동기화 오류:', error);
    }
  };

  const handleRegisterChannel = async () => {
    if (!newChannelUrl.trim()) {
      setMessage('YouTube 채널 URL을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      console.log('🔍 환경변수 확인:');
      console.log('- REACT_APP_YOUTUBE_API_KEY 존재:', !!process.env.REACT_APP_YOUTUBE_API_KEY);
      
      const channelInfo = extractChannelId(newChannelUrl);
      if (!channelInfo) {
        setMessage('올바른 YouTube 채널 URL이 아닙니다. 다시 확인해주세요.');
        setIsLoading(false);
        return;
      }

      const channelDetails = await fetchYouTubeChannelInfo(channelInfo);
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        youtubeChannel: channelDetails
      }, { merge: true });

      setChannelData(channelDetails);
      setIsEditing(false);
      setNewChannelUrl('');
      
      if (channelDetails.isMockData) {
        setMessage('채널이 등록되었습니다. (YouTube API 키가 없어 기본 정보만 표시됩니다)');
      } else {
        setMessage('채널이 성공적으로 등록되었습니다!');
      }
      
    } catch (error) {
      console.error('채널 등록 오류:', error);
      setMessage(`채널 등록 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncChannel = async () => {
    if (!channelData || !currentUser?.uid) return;

    setIsLoading(true);
    setMessage('');

    try {
      const channelInfo = { type: 'channel', value: channelData.channelId };
      const updatedDetails = await fetchYouTubeChannelInfo(channelInfo);
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        youtubeChannel: updatedDetails
      }, { merge: true });

      setChannelData(updatedDetails);
      setShowManageDropdown(false);
      
      if (updatedDetails.isMockData) {
        setMessage('✅ 최신 정보로 업데이트되었습니다. (기본 정보)');
      } else {
        setMessage('✅ 최신 정보로 업데이트되었습니다!');
      }
      
    } catch (error) {
      console.error('채널 동기화 오류:', error);
      setMessage(`채널 동기화 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };
  
  const formatLastSync = (lastSync) => {
    if (!lastSync) return 'N/A';
    const date = lastSync.toDate ? lastSync.toDate() : new Date(lastSync);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return '방금 전';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          🎬 YouTube 채널 관리
        </h3>
        {channelData && (
          <a
            href={`https://www.youtube.com/channel/${channelData.channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-red-500 text-white text-xs rounded font-bold hover:bg-red-600 transition shadow"
          >
            채널 바로가기
          </a>
        )}
      </div>

      {(!channelData || isEditing) && (
        <div className="mb-6">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newChannelUrl}
              onChange={(e) => setNewChannelUrl(e.target.value)}
              placeholder="YouTube 채널 URL 또는 @채널명"
              className="flex-1 px-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleRegisterChannel}
              disabled={isLoading}
              className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm font-medium"
            >
              {isLoading ? '처리중...' : channelData ? '업데이트' : '등록'}
            </button>
          </div>
          
          {isEditing && (
            <button
              onClick={() => {
                setIsEditing(false);
                setNewChannelUrl('');
              }}
              className="text-gray-500 text-sm hover:text-gray-700"
            >
              취소
            </button>
          )}
        </div>
      )}

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-center text-sm font-semibold flex items-center justify-center gap-2 border ${
            message.includes('오류')
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-green-50 text-green-600 border-green-200'
          }`}
        >
          <span>{message.includes('오류') ? '❌' : '✅'}</span>
          <span>{message}</span>
        </div>
      )}

      {channelData && !isEditing && (
        <div className="space-y-4">
          <div className="relative p-3 bg-gray-50 rounded-lg">
            <div className="absolute top-2 right-2 text-xs text-gray-500">
              업데이트: {formatLastSync(channelData.lastSyncAt)}
            </div>
            <div className="flex items-center gap-3 pr-20">
              <img
                src={channelData.channelThumbnail}
                alt="채널 썸네일"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{channelData.channelTitle}</h4>
                {selectedCategory && (
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white ${selectedCategory.color}`}>
                      <span>{selectedCategory.icon}</span>
                      <span>{selectedCategory.name}</span>
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                  {channelData.channelDescription || '설명이 없습니다.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={handleSyncChannel}
                disabled={isLoading}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                🔄 동기화
              </button>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                🏷️ 카테고리
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowManageDropdown(!showManageDropdown)}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  ⚙️ 관리
                </button>
                {showManageDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setNewChannelUrl(channelData.originalUrl || '');
                        setShowManageDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ✏️ 채널 수정
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowManageDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      🗑️ 채널 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="text-sm font-bold text-red-600">
                {formatNumber(channelData.subscriberCount)}
              </div>
              <div className="text-xs text-gray-600">구독자</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-sm font-bold text-blue-600">
                {formatNumber(channelData.videoCount)}
              </div>
              <div className="text-xs text-gray-600">영상 수</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-sm font-bold text-green-600">
                {formatNumber(channelData.viewCount)}
              </div>
              <div className="text-xs text-gray-600">총 조회수</div>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-gray-800">카테고리 선택</h4>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {YOUTUBE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedCategory?.id === category.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg ${category.color}`}>
                        {category.icon}
                      </span>
                      <div className="text-left">
                        <div className="font-bold text-gray-800">{category.name}</div>
                        <div className="text-xs text-gray-600">{category.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800">채널 삭제 확인</h4>
                  <p className="text-sm text-gray-600">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">등록된 YouTube 채널을 삭제하시겠습니까?</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteChannel}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  {isLoading ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManageDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowManageDropdown(false)}
        />
      )}
    </div>
  );
};

export default YouTubeChannelManager;
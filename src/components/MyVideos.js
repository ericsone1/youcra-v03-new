import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import BottomTabBar from './MyChannel/BottomTabBar';

const MyVideos = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVideos, setFilteredVideos] = useState([]);

  // 샘플 영상 데이터 (실제로는 Firebase나 YouTube API에서 가져올 것)
  const sampleVideos = [
    {
      id: '1',
      title: '한국의 겨울 풍경을 담은 아름다운 영상',
      description: '한국의 겨울 풍경을 담은 아름다운 영상입니다. 눈이 내리는 모습과 겨울의 정취를 느껴보세요.',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '5:23',
      uploadDate: '2024-01-15',
      views: '1,234',
      likes: '45',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: '2', 
      title: '맛있는 한국 음식 만들기 - 김치찌개',
      description: '집에서 쉽게 만들 수 있는 김치찌개 레시피를 소개합니다.',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '8:45',
      uploadDate: '2024-01-10', 
      views: '2,567',
      likes: '89',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: '3',
      title: '서울 여행 브이로그 - 명동 거리 탐방',
      description: '서울 명동의 다양한 먹거리와 볼거리를 소개하는 브이로그입니다.',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '12:30',
      uploadDate: '2024-01-05',
      views: '3,891',
      likes: '156',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: '4',
      title: '초보자를 위한 기타 레슨 1강',
      description: '기타를 처음 배우는 분들을 위한 기초 레슨입니다.',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '15:20',
      uploadDate: '2024-01-01',
      views: '5,234',
      likes: '203',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: '5',
      title: '운동 루틴 공유 - 홈트레이닝',
      description: '집에서 할 수 있는 효과적인 운동 루틴을 공유합니다.',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '20:15',
      uploadDate: '2023-12-28',
      views: '4,567',
      likes: '178',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }
  ];

  useEffect(() => {
    if (currentUser) {
      loadMyVideos();
    }
  }, [currentUser]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = videos.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVideos(filtered);
    } else {
      setFilteredVideos(videos);
    }
  }, [searchTerm, videos]);

  const loadMyVideos = async () => {
    try {
      setIsLoading(true);
      // 실제로는 Firebase에서 사용자의 영상을 가져올 것
      // 지금은 샘플 데이터 사용
      setTimeout(() => {
        setVideos(sampleVideos);
        setFilteredVideos(sampleVideos);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('영상 로드 오류:', error);
      setIsLoading(false);
    }
  };

  // 로딩 중
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">영상 로딩 중...</p>
        <BottomTabBar />
      </div>
    );
  }

  // 로그인 필요
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 pb-24">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-2xl mx-auto mb-4">
            🎬
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">내 영상</h2>
          <p className="text-gray-600 mb-6">영상을 관리하려면 로그인이 필요합니다</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-red-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-red-600 transition"
          >
            로그인하기
          </button>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col pb-24">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/my')}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">내 영상</h1>
                <p className="text-sm text-gray-500">업로드한 영상 관리</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/add-video')}
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              영상 추가
            </button>
          </div>

          {/* 검색 바 */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="영상 제목 또는 설명으로 검색..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 영상 통계 */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{videos.length}</div>
            <div className="text-sm text-gray-500">총 영상</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {videos.reduce((acc, video) => acc + parseInt(video.views.replace(',', '')), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">총 조회수</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {videos.reduce((acc, video) => acc + parseInt(video.likes), 0)}
            </div>
            <div className="text-sm text-gray-500">총 좋아요</div>
          </div>
        </div>

        {/* 영상 목록 */}
        <div className="space-y-3">
          {filteredVideos.length > 0 ? (
            filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">영상이 없습니다</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? '검색 결과가 없습니다' : '첫 번째 영상을 업로드해보세요!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/add-video')}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600 transition"
                >
                  영상 추가하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

// 개별 영상 카드 컴포넌트
const VideoCard = ({ video }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex gap-4">
        {/* 썸네일 */}
        <div className="relative w-40 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA0NEw4MCA1Nkw2NCA2OFY0NFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+Cg==';
            }}
          />
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
            {video.duration}
          </div>
        </div>

        {/* 영상 정보 */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
            {video.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {video.description}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {video.views}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {video.likes}
              </span>
            </div>
            <span>{formatDate(video.uploadDate)}</span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.open(video.videoUrl, '_blank')}
            className="text-blue-500 hover:text-blue-600 transition p-2"
            title="영상 보기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16h1m4 0h1m-7-16h8a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V2a2 2 0 012-2z" />
            </svg>
          </button>
          <button
            className="text-gray-500 hover:text-gray-600 transition p-2"
            title="더보기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyVideos;
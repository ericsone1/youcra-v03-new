import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMyVideoViewers } from '../../hooks/useMyVideoViewers';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../../../hooks/useAuth';

// 시간 포맷 함수
const formatWatchTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};

// 더미 시청자 데이터
const mockViewers = [
  {
    user: {
      uid: 'user1',
      displayName: '홍길동',
      email: 'hong@example.com',
      photoURL: 'https://randomuser.me/api/portraits/men/32.jpg',
      youtubeChannel: { title: '길동TV', verified: true },
      uploadedVideos: [
        {
          videoId: 'abc123',
          title: '홍길동의 맛집 브이로그',
          channelTitle: '길동TV',
          durationDisplay: '4:12',
          thumbnail: 'https://img.youtube.com/vi/abc123/mqdefault.jpg'
        },
        {
          videoId: 'def456',
          title: '홍길동의 여행기',
          channelTitle: '길동TV',
          durationDisplay: '7:01',
          thumbnail: 'https://img.youtube.com/vi/def456/mqdefault.jpg'
        }
      ]
    },
    watchedMyVideos: [
      {
        videoId: 'my1',
        title: '내가 올린 첫 영상',
        channelTitle: '내채널',
        durationDisplay: '3:12',
        thumbnail: 'https://via.placeholder.com/80x60?text=No+Image'
      },
      {
        videoId: 'my2',
        title: '두번째 영상',
        channelTitle: '내채널',
        durationDisplay: '2:01',
        thumbnail: 'https://via.placeholder.com/80x60?text=No+Image'
      }
    ]
  },
  {
    user: {
      uid: 'user2',
      displayName: '김유라',
      email: 'yura@example.com',
      photoURL: 'https://randomuser.me/api/portraits/women/44.jpg',
      youtubeChannel: { title: '유라의 일상', verified: false },
      uploadedVideos: [
        {
          videoId: 'ghi789',
          title: '유라의 브이로그',
          channelTitle: '유라의 일상',
          durationDisplay: '5:20',
          thumbnail: 'https://img.youtube.com/vi/ghi789/mqdefault.jpg'
        }
      ]
    },
    watchedMyVideos: [
      {
        videoId: 'my3',
        title: '세번째 영상',
        channelTitle: '내채널',
        durationDisplay: '5:20',
        thumbnail: 'https://via.placeholder.com/80x60?text=No+Image'
      }
    ]
  }
];

export const ViewerList = ({ onMessageClick }) => {
  const { loading, viewers } = useMyVideoViewers();
  // const { currentUser } = useAuth();
  const [selectedViewer, setSelectedViewer] = useState(null);
  const navigate = useNavigate();
  const [playerVideoId, setPlayerVideoId] = useState(null);

  // 로그인하지 않은 사용자를 위한 안내 (임시로 비활성화)
  // if (!currentUser) {
  //   return (
  //     <div className="text-center py-12">
  //       <div className="text-gray-500 mb-4">
  //         <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  //         </svg>
  //         <h3 className="text-lg font-medium text-gray-700 mb-2">내 영상 시청자 정보</h3>
  //         <p className="text-sm text-gray-500">로그인하면 내 영상을 시청한 사용자들을 확인할 수 있습니다.</p>
  //       </div>
  //     </div>
  //   );
  // }

  // 채널 URL 생성 함수
  const getChannelUrl = (viewer) => {
    if (viewer.user.youtubeChannel?.channelId) {
      return `https://www.youtube.com/channel/${viewer.user.youtubeChannel.channelId}`;
    }
    if (viewer.user.youtubeChannel?.customUrl) {
      return `https://www.youtube.com/${viewer.user.youtubeChannel.customUrl}`;
    }
    return null;
  };

  // 메시지 보내기 (DM)
  const handleSendMessage = (viewer) => {
    navigate(`/dm/${viewer.user.uid}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
        <p className="text-gray-500">내 영상 시청자 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">내 영상 시청자</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          총 {viewers.length}명
        </span>
      </div>

      {viewers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">👥</div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">아직 시청자가 없어요</h4>
          <p className="text-gray-500 text-sm">
            유크라에 영상을 더 많이 등록하고 다른 사용자들과 상호 시청해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {viewers.map((viewer, index) => (
            <motion.div
              key={viewer.user.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                {/* 사용자 썸네일 */}
                <div className="relative flex-shrink-0">
                  <img
                    src={viewer.user.photoURL || '/default-profile.png'}
                    alt={viewer.user.displayName || viewer.user.email || '유저'}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/56x56/e5e7eb/9ca3af?text=👤';
                    }}
                  />
                  {/* 온라인 상태 표시 (임시) */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                </div>

                {/* 사용자 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                      {viewer.user.displayName || viewer.user.email?.split('@')[0] || '익명 사용자'}
                    </h4>
                    {viewer.user.youtubeChannel?.verified && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>내 영상 {viewer.watchedMyVideos.length}개 시청</span>
                    {viewer.user.youtubeChannel?.title && (
                      <span className="truncate max-w-[200px]">
                        📺 {viewer.user.youtubeChannel.title}
                      </span>
                    )}
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* 채널 바로가기 버튼 */}
                  {getChannelUrl(viewer) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(getChannelUrl(viewer), '_blank')}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-1"
                    >
                      <span>📺</span>
                      <span>채널</span>
                    </motion.button>
                  )}

                  {/* 메시지 버튼 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSendMessage(viewer)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-1"
                  >
                    <span>💬</span>
                    <span>메시지</span>
                  </motion.button>

                  {/* 더보기 버튼 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedViewer(selectedViewer?.user.uid === viewer.user.uid ? null : viewer)}
                    className={`p-2 rounded-lg transition-colors text-sm ${
                      selectedViewer?.user.uid === viewer.user.uid
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedViewer?.user.uid === viewer.user.uid ? '▲' : '▼'}
                  </motion.button>
                </div>
              </div>

              {/* 상세 시청 내역 (펼쳐진 상태) */}
              {selectedViewer?.user.uid === viewer.user.uid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <h5 className="text-base font-semibold text-gray-800 mb-3">
                    {viewer.user.displayName || '이 사용자'}님의 등록 영상
                  </h5>
                  {(viewer.user.uploadedVideos?.length === 0 || !viewer.user.uploadedVideos) ? (
                    <p className="text-gray-500 text-center py-4">등록한 영상이 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {viewer.user.uploadedVideos.map((video, idx) => (
                        <div key={video.videoId || video.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <img 
                            src={video.thumbnail || video.thumbnailUrl || 'https://via.placeholder.com/80x60?text=No+Image'} 
                            alt={video.title} 
                            className="w-20 h-12 object-cover rounded"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80x60?text=No+Image';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">
                              {video.title || '제목 없음'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {video.durationDisplay || '시간 미확인'}
                            </p>
                          </div>
                          <button
                            className="px-3 py-1 text-xs rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors flex-shrink-0"
                            onClick={() => setPlayerVideoId(video.videoId || video.id)}
                          >
                            시청하기
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* 유튜브 팝업 플레이어 모달 */}
      {playerVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-lg p-2 relative w-full max-w-xl mx-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={() => setPlayerVideoId(null)}
            >
              ×
            </button>
            <div className="aspect-w-16 aspect-h-9 w-full">
              <iframe
                width="100%"
                height="360"
                src={`https://www.youtube.com/embed/${playerVideoId}?autoplay=1&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
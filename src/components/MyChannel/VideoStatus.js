import React from 'react';
import { useNavigate } from 'react-router-dom';

const VideoStatus = ({ myVideosData }) => {
  const navigate = useNavigate();

  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-bold text-base sm:text-lg">내 유튜브가 등록된 채팅방</h3>
      </div>
      
      {myVideosData.length === 0 ? (
        <div className="text-gray-400 text-center py-6 sm:py-8 bg-white rounded-xl shadow text-sm sm:text-base">
          아직 등록한 영상이 있는 채팅방이 없습니다.
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {myVideosData.map((roomGroup) => (
            <div key={roomGroup.roomId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* 채팅방 헤더 - 모바일 최적화 */}
              <div className="bg-gray-50 border-b border-gray-100 p-2.5 sm:p-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* 채팅방 썸네일 */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-sm sm:text-lg font-bold text-gray-700 flex-shrink-0">
                    {roomGroup.roomName?.slice(0, 2).toUpperCase() || 'CH'}
                  </div>
                  
                  {/* 채팅방 정보 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate">{roomGroup.roomName}</h4>
                    <p className="text-gray-500 text-xs sm:text-sm">{roomGroup.videos.length}개의 영상</p>
                  </div>
                  
                  {/* 입장하기 버튼 */}
                  <button
                    onClick={() => navigate(`/chat/${roomGroup.roomId}`)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    입장하기
                  </button>
                </div>
              </div>
              
              {/* 영상 카드들 - 모바일 최적화 */}
              <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                {roomGroup.videos.map((video) => (
                  <div 
                    key={video.id}
                    className="flex gap-2.5 sm:gap-3 p-2 bg-gray-50 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/chat/${roomGroup.roomId}`)}
                  >
                    {/* 영상 썸네일 */}
                    <div className="w-16 h-9 sm:w-20 sm:h-12 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                      {video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          🎬
                        </div>
                      )}
                    </div>
                    
                    {/* 영상 정보 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h5 className="font-medium text-xs sm:text-sm text-gray-800 mb-1" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {video.title || "제목 없음"}
                      </h5>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          👥 풀시청자: <span className="font-semibold text-blue-600">{video.fullViewersCount}명</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoStatus; 
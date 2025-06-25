import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';

const VideoSelectionStep = ({
  completedSteps,
  videoSelectionCollapsed,
  setVideoSelectionCollapsed,
  videosLoading,
  currentVideos,
  selectedVideos,
  handleVideoSelect,
  handleImageError,
  totalPages,
  currentPage,
  handlePageChange,
  completeStep,
  setVideoSelectionCollapsedTrue,
  mockMyVideos,
}) => (
  <AnimatePresence initial={false}>
    {completedSteps.includes(1) && (
      <motion.div
        key="video-selection-container"
        initial={false}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-2xl p-6 mx-4 shadow-lg mb-6"
        >
          {/* 헤더 - 항상 표시 */}
          <div 
            className="flex justify-between items-center mb-4 cursor-pointer"
            onClick={() => setVideoSelectionCollapsed(!videoSelectionCollapsed)}
          >
            <h3 className="text-xl font-bold">시청받을 영상 선택</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {selectedVideos.length}/3 선택
                {totalPages > 1 && !videosLoading && ` • ${currentPage + 1}/${totalPages} 페이지`}
              </span>
              {completedSteps.includes(2) && (
                <motion.div
                  animate={{ rotate: videoSelectionCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaChevronDown className="text-gray-400" />
                </motion.div>
              )}
            </div>
          </div>

          {/* 완료 상태 요약 - 접혔을 때 표시 */}
          {completedSteps.includes(2) && videoSelectionCollapsed && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span>✅ 선택 완료 ({selectedVideos.length}개)</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoSelectionCollapsed(false);
                }}
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200 transition-colors duration-150"
              >
                수정하기
              </button>
            </div>
          )}

          {/* 영상 리스트 - 접기/펼치기 */}
          <AnimatePresence initial={false}>
            {!videoSelectionCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {videosLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm">영상 목록을 불러오는 중...</p>
                  </div>
                ) : (
                  <>
                  <div className="space-y-3 mb-4">
                    {currentVideos.map((video) => {
                    const isSelected = selectedVideos.includes(video.id);
                    return (
                      <motion.div
                        key={video.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleVideoSelect(video.id);
                        }}
                        className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors duration-150 select-none ${
                          isSelected 
                            ? 'bg-blue-50 border-2 border-blue-500' 
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                        style={{ userSelect: 'none' }}
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-16 h-12 rounded-lg object-cover pointer-events-none"
                          onError={handleImageError}
                          draggable={false}
                        />
                        <div className="flex-1 pointer-events-none">
                          <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{video.duration}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              video.type === 'short' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {video.type === 'short' ? '숏폼' : '롱폼'}
                            </span>
                            {video.viewCount && (
                              <>
                                <span>•</span>
                                <span>조회수 {video.viewCount.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="pointer-events-none">
                          <BsCheckCircleFill
                            className={`text-2xl transition-colors duration-150 ${
                              isSelected ? 'text-blue-500' : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                  </div>

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 py-4">
                      <button
                        onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        이전
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, index) => (
                          <button
                            key={index}
                            onClick={() => handlePageChange(index)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-150 ${
                              currentPage === index
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
                )}

                {selectedVideos.length > 0 && !videosLoading && (
                  <button
                    onClick={() => {
                      completeStep(2);
                      setVideoSelectionCollapsedTrue();
                    }}
                    className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-150"
                  >
                    {completedSteps.includes(2) ? '영상 수정 완료' : '영상 등록하기'} ({selectedVideos.length}개)
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default React.memo(VideoSelectionStep); 
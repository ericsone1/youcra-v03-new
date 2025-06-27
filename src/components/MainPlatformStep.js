import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaUsers } from 'react-icons/fa';

const MainPlatformStep = ({
  completedSteps,
  watchedCount,
  earnedViews,
  activeTab,
  handleTabChange,
  children,
}) => (
  <AnimatePresence>
    {completedSteps.includes(2) && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4"
        >
          {/* 상태 카드 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mx-4 text-white shadow-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{watchedCount}</div>
                <div className="text-sm opacity-90">내가 영상을 시청한 수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{earnedViews}</div>
                <div className="text-sm opacity-90">UCRA에서 시청된 수</div>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mx-4">
            <button
              onClick={() => handleTabChange('watch')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors duration-150 whitespace-nowrap text-sm md:text-base ${
                activeTab === 'watch'
                  ? 'bg-white text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaPlay className="inline mr-2" />
              시청할 영상
            </button>
            <button
              onClick={() => handleTabChange('myVideos')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors duration-150 whitespace-nowrap text-sm md:text-base ${
                activeTab === 'myVideos'
                  ? 'bg-white text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaUsers className="inline mr-2" />
              내영상 시청현황
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default React.memo(MainPlatformStep); 
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WatchVideoList } from './WatchVideoList';
import { ViewerList } from './ViewerList';
import { TabButtons } from './TabButtons';
import { FilterButtons } from './FilterButtons';

export const WatchTabsContainer = ({
  activeTab,
  onTabChange,
  videoFilter,
  onFilterChange,
  selectedVideos,
  onTokenEarned
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      {/* 메인 탭 */}
      <TabButtons
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* 필터 탭 */}
      <FilterButtons
        videoFilter={videoFilter}
        onFilterChange={onFilterChange}
      />

      {/* 콘텐츠 영역 */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'watch' ? (
            <WatchVideoList
              key="watch"
              videoFilter={videoFilter}
              onTokenEarned={onTokenEarned}
            />
          ) : (
            <ViewerList
              key="viewers"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}; 
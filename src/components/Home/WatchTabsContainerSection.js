import React from 'react';
import { WatchTabsContainer } from './components/WatchTabsContainer';

export default function WatchTabsContainerSection({
  activeTab,
  onTabChange,
  videoFilter,
  onFilterChange,
  selectedVideos,
  onTokenEarned,
  onWatchClick,
}) {
  return (
    <section className="mb-4">
      <WatchTabsContainer
        activeTab={activeTab}
        onTabChange={onTabChange}
        videoFilter={videoFilter}
        onFilterChange={onFilterChange}
        selectedVideos={selectedVideos}
        onTokenEarned={onTokenEarned}
        onWatchClick={onWatchClick}
      />
    </section>
  );
} 
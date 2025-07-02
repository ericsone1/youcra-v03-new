import { useState } from 'react';

export function useHomeTabState() {
  const [activeTab, setActiveTab] = useState('watch'); // 'watch' | 'viewers'
  const [videoFilter, setVideoFilter] = useState('all'); // 'all' | 'short' | 'long'

  return {
    activeTab,
    setActiveTab,
    videoFilter,
    setVideoFilter,
  };
} 
import React from 'react';
import { motion } from 'framer-motion';

export const TabButtons = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex border-b">
      <button
        onClick={() => onTabChange('watch')}
        className={`flex-1 py-4 text-sm font-medium transition-colors relative
          ${activeTab === 'watch'
            ? 'text-blue-500'
            : 'text-gray-500 hover:text-gray-700'
          }`}
      >
        내가 시청할 영상
        {activeTab === 'watch' && (
          <motion.div
            layoutId="activeTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
          />
        )}
      </button>
      <button
        onClick={() => onTabChange('viewers')}
        className={`flex-1 py-4 text-sm font-medium transition-colors relative
          ${activeTab === 'viewers'
            ? 'text-blue-500'
            : 'text-gray-500 hover:text-gray-700'
          }`}
      >
        내 영상 시청자
        {activeTab === 'viewers' && (
          <motion.div
            layoutId="activeTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
          />
        )}
      </button>
    </div>
  );
}; 
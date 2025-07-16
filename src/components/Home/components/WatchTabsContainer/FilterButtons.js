import React from 'react';

export const FilterButtons = ({ videoFilter, onFilterChange }) => {
  return (
    <div className="flex p-2 gap-2 bg-gray-50">
      <button
        onClick={() => onFilterChange('all')}
        className={`px-3 py-1.5 rounded-full text-sm transition-colors
          ${videoFilter === 'all'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-500 hover:bg-gray-100'
          }`}
      >
        전체
      </button>
      <button
        onClick={() => onFilterChange('short')}
        className={`px-3 py-1.5 rounded-full text-sm transition-colors
          ${videoFilter === 'short'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-500 hover:bg-gray-100'
          }`}
      >
        숏폼
      </button>
      <button
        onClick={() => onFilterChange('long')}
        className={`px-3 py-1.5 rounded-full text-sm transition-colors
          ${videoFilter === 'long'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-500 hover:bg-gray-100'
          }`}
      >
        롱폼
      </button>
      {/* 재시청 필터 버튼 제거 */}
    </div>
  );
}; 
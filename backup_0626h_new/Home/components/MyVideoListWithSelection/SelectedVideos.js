import React from 'react';

export const SelectedVideos = ({ selectedVideos, onVideoRemove }) => {
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-xl">
      <h3 className="text-sm font-medium text-blue-700 mb-3">
        ✅ 선택된 영상
      </h3>
      <div className="space-y-2">
        {selectedVideos.map(video => (
          <div
            key={video.id}
            className="flex items-center gap-3 bg-white p-2 rounded-lg"
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-16 h-9 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {video.title}
              </p>
              <p className="text-xs text-gray-500">
                {video.duration} • {video.views} 조회
              </p>
            </div>
            <button
              onClick={() => onVideoRemove(video)}
              className="text-red-500 hover:text-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}; 
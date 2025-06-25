import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsCheckCircleFill } from 'react-icons/bs';
import { BiTime } from 'react-icons/bi';

const MyVideoListWithSelection = ({ videos = [], onSelectionChange, maxSelection = 3 }) => {
  const [selectedVideos, setSelectedVideos] = useState([]);

  const handleVideoSelect = (video) => {
    let newSelection;
    if (selectedVideos.find(v => v.id === video.id)) {
      newSelection = selectedVideos.filter(v => v.id !== video.id);
    } else if (selectedVideos.length < maxSelection) {
      newSelection = [...selectedVideos, video];
    } else {
      return; // Max selection reached
    }
    
    setSelectedVideos(newSelection);
    onSelectionChange?.(newSelection);
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 mb-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">내 영상 목록</h2>
        <span className="text-sm text-gray-500">
          {selectedVideos.length}/{maxSelection} 선택됨
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {videos.map((video) => {
            const isSelected = selectedVideos.find(v => v.id === video.id);
            
            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`relative rounded-lg overflow-hidden cursor-pointer
                  ${isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
                onClick={() => handleVideoSelect(video)}
              >
                <div className="flex gap-4 p-4">
                  <div className="relative w-40 h-24 flex-shrink-0">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <BiTime />
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      조회수 {video.views.toLocaleString()}회 • {video.uploadedAt}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <BsCheckCircleFill
                      className={`w-6 h-6 transition-colors
                        ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {videos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            등록된 영상이 없습니다
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MyVideoListWithSelection; 
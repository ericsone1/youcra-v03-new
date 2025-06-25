import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaUsers } from 'react-icons/fa';
import { BiTime } from 'react-icons/bi';

const TABS = [
  { id: 'watch', label: '내가 시청할 영상', icon: FaPlay },
  { id: 'viewers', label: '내 영상 시청자', icon: FaUsers }
];

const VideoCard = ({ video, onVideoClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
    onClick={() => onVideoClick(video)}
  >
    <div className="relative mb-3">
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="w-full h-40 object-cover rounded-lg"
      />
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
        <BiTime />
        {video.duration}
      </div>
      {video.progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-red-500"
            style={{ width: `${video.progress}%` }}
          />
        </div>
      )}
    </div>

    <h3 className="font-medium line-clamp-2 mb-2">{video.title}</h3>
    
    <div className="flex items-center justify-between text-sm text-gray-500">
      <span>조회수 {video.views.toLocaleString()}회</span>
      <span>{video.uploadedAt}</span>
    </div>
  </motion.div>
);

const ViewerCard = ({ viewer, onMessageClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="bg-white rounded-lg shadow p-4"
  >
    <div className="flex items-center gap-4">
      <img
        src={viewer.profileImage}
        alt={viewer.name}
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1">
        <h3 className="font-medium">{viewer.name}</h3>
        <p className="text-sm text-gray-500">
          시청 영상 {viewer.watchedVideos}개
        </p>
      </div>
      <button
        onClick={() => onMessageClick(viewer)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        메시지
      </button>
    </div>
  </motion.div>
);

const WatchTabsContainer = ({
  watchVideos = [],
  viewers = [],
  onVideoClick,
  onMessageClick
}) => {
  const [activeTab, setActiveTab] = useState('watch');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex gap-4 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <Icon />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'watch' ? (
          <motion.div
            key="watch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {watchVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onVideoClick={onVideoClick}
              />
            ))}
            {watchVideos.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                시청할 수 있는 영상이 없습니다
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="viewers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4"
          >
            {viewers.map((viewer) => (
              <ViewerCard
                key={viewer.id}
                viewer={viewer}
                onMessageClick={onMessageClick}
              />
            ))}
            {viewers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                아직 시청자가 없습니다
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WatchTabsContainer; 
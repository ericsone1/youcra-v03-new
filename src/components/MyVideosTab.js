import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUsers } from 'react-icons/fa';
import { collection, getCountFromServer, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';

const GOAL_VIEWERS = 10; // 임시 목표치

const MyVideosTab = ({ selectedVideos, myVideos, handleImageError }) => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (!selectedVideos || selectedVideos.length === 0) return;
    (async () => {
      const newStats = {};
      const roomsSnap = await getDocs(collection(db, 'chatRooms'));
      for (const roomDoc of roomsSnap.docs) {
        for (const vid of selectedVideos) {
          const certCol = collection(db, 'chatRooms', roomDoc.id, 'videos', vid, 'certifications');
          try {
            const countSnap = await getCountFromServer(certCol);
            newStats[vid] = (newStats[vid] || 0) + countSnap.data().count;
          } catch (_) {}
        }
      }
      setStats(newStats);
    })();
  }, [selectedVideos]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 mx-4"
    >
      {selectedVideos.map((videoId, index) => {
        const video = myVideos.find(v => v.id === videoId);
        if (!video) return null;
        const totalViewers = stats[videoId] || 0;
        const watchProgress = Math.min(100, Math.round((totalViewers / GOAL_VIEWERS) * 100));
        
        return (
          <motion.div
            key={video.id}
            className="bg-white rounded-2xl p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex gap-3 mb-3">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-20 h-14 rounded-lg object-cover"
                onError={handleImageError}
              />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{video.title}</h4>
                <div className="text-xs text-gray-500">
                  <span>{video.duration}</span>
                  <span className="ml-2">누적 시청자 {totalViewers}명</span>
                </div>
              </div>
            </div>
            {/* 시청률 게이지 */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">시청 진행률</span>
                <span className="font-medium">{watchProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${watchProgress}%` }}
                  transition={{ duration: 1, delay: 0.2 * index }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>목표 {GOAL_VIEWERS}명</span>
              <span>누적 시청 완료</span>
            </div>
          </motion.div>
        );
      })}
      {selectedVideos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FaUsers className="text-4xl mx-auto mb-2 opacity-30" />
          <p>등록된 영상이 없습니다</p>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(MyVideosTab); 
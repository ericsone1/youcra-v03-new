import React from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaEye, FaChartLine } from 'react-icons/fa';

export const WatchRateSummary = ({ totalVideos, watchedVideosCount, watchRate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-4 mb-4 border border-blue-100"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <FaChartLine className="text-white text-sm" />
        </div>
        <h3 className="font-bold text-purple-700 text-lg">유크라 시청률 요약</h3>
      </div>
      
      <div className="space-y-3">
        {/* 전체 통계 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaPlay className="text-blue-500 text-sm" />
            <span className="text-sm text-gray-600">전체 등록 영상</span>
          </div>
          <span className="font-semibold text-gray-800">{totalVideos.toLocaleString()}개</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaEye className="text-green-500 text-sm" />
            <span className="text-sm text-gray-600">시청 완료 영상</span>
          </div>
          <span className="font-semibold text-green-600">{watchedVideosCount.toLocaleString()}개</span>
        </div>
        
        {/* 시청률 바 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">시청률</span>
            <span className="text-sm font-bold text-blue-600">{watchRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${watchRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
        
        {/* 남은 영상 수 */}
        {totalVideos > watchedVideosCount && (
          <div className="text-center pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              아직 시청하지 않은 영상: <span className="font-semibold text-orange-600">{(totalVideos - watchedVideosCount).toLocaleString()}개</span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}; 
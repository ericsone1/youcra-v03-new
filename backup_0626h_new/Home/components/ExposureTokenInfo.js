import React from 'react';
import { motion } from 'framer-motion';

export const ExposureTokenInfo = ({ tokenCount }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          💎 나의 노출수 토큰
        </h2>
        <span className="text-2xl font-bold">
          {tokenCount}
        </span>
      </div>

      <div className="space-y-3">
        <div className="bg-white bg-opacity-10 rounded-xl p-3">
          <h3 className="font-medium mb-2">토큰 적립 기준</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-yellow-300">⚡</span>
              숏폼 1개 시청 = 1토큰
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-300">🎬</span>
              롱폼 10분 시청 = 1토큰
            </li>
          </ul>
        </div>

        {/* 토큰 게이지 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>다음 레벨까지</span>
            <span>{100 - (tokenCount % 100)}토큰</span>
          </div>
          <div className="h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(tokenCount % 100)}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-yellow-300"
            />
          </div>
        </div>

        {/* 토큰 사용 안내 */}
        <div className="text-sm bg-white bg-opacity-10 rounded-xl p-3">
          <h3 className="font-medium mb-2">💡 토큰 활용 팁</h3>
          <ul className="space-y-1 opacity-90">
            <li>• 토큰이 많을수록 내 영상이 더 많이 노출됩니다</li>
            <li>• 매일 시청하여 토큰을 모아보세요</li>
            <li>• 레벨업 시 추가 노출 기회가 제공됩니다</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}; 
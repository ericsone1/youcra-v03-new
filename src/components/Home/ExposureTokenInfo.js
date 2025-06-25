import React from 'react';
import { motion } from 'framer-motion';
import { FaCoins } from 'react-icons/fa';
import { IoTrendingUp } from 'react-icons/io5';

const ExposureTokenInfo = ({ tokenInfo = { total: 0, used: 0, earned: 0 } }) => {
  const calculateProgress = () => {
    const progress = (tokenInfo.used / tokenInfo.total) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <FaCoins className="text-yellow-500 text-2xl" />
        <h2 className="text-xl font-bold">노출수 토큰</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-500 text-sm mb-1">보유 토큰</div>
          <div className="text-2xl font-bold">{tokenInfo.total}</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-500 text-sm mb-1">사용 토큰</div>
          <div className="text-2xl font-bold">{tokenInfo.used}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-500 text-sm mb-1">획득 토큰</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            {tokenInfo.earned}
            <IoTrendingUp className="text-green-500" />
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>토큰 사용량</span>
          <span>{calculateProgress()}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculateProgress()}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-blue-500 rounded-full"
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <ul className="list-disc list-inside space-y-1">
          <li>숏폼 영상 1개 = 1토큰</li>
          <li>롱폼 영상 10분 = 1토큰</li>
          <li>시청 완료 시 토큰이 적립됩니다</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default ExposureTokenInfo; 
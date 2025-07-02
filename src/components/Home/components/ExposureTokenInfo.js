import React from 'react';
import { motion } from 'framer-motion';
import { FiInfo } from 'react-icons/fi';

export const ExposureTokenInfo = ({ tokenCount, onInfoClick = () => {} }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-4 text-white flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold">💎 {tokenCount}</span>
        <span className="text-sm opacity-80">나의 노출 토큰</span>
      </div>
      <button
        onClick={onInfoClick}
        className="ml-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-lg flex items-center justify-center"
        title="노출 토큰 안내"
      >
        <FiInfo />
      </button>
    </motion.div>
  );
}; 
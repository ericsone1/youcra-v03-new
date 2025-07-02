// 🏠 Home 헤더 컴포넌트
// 원본: Home.js에서 추출

import React from 'react';
import { motion } from 'framer-motion';

export const HomeHeader = () => (
  <motion.div 
    className="text-center py-4 relative"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <div className="flex items-center justify-center mb-2">
      <div>
        <motion.h1 
          className="text-3xl font-bold gradient-text mb-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 100 }}
        >
          UCRA
        </motion.h1>
        <motion.p 
          className="text-gray-600 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          유튜브 크리에이터들의 공간
        </motion.p>
      </div>
    </div>
  </motion.div>
); 
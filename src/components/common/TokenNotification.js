import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCoins, FaTimes } from 'react-icons/fa';

export default function TokenNotification({ 
  isVisible, 
  tokensEarned, 
  totalTokens, 
  onClose 
}) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!isVisible) return;

    setTimeLeft(5);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onClose]);

  if (!isVisible || tokensEarned <= 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          duration: 0.5 
        }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-sm w-full mx-4"
      >
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl shadow-2xl p-4 border-2 border-yellow-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1] 
                }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                className="bg-white rounded-full p-2"
              >
                <FaCoins className="text-yellow-500 text-xl" />
              </motion.div>
              <div>
                <h3 className="font-bold text-white text-lg">토큰 획득!</h3>
                <p className="text-yellow-100 text-sm">시청해 주셔서 감사합니다</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <FaTimes className="text-white text-sm" />
            </button>
          </div>

          <div className="bg-white/20 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">획득한 토큰</span>
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-2xl font-bold text-white flex items-center"
              >
                +{tokensEarned} <FaCoins className="ml-1 text-yellow-200" />
              </motion.span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-yellow-100 text-sm">총 보유 토큰</span>
              <span className="text-white font-semibold">{totalTokens}개</span>
            </div>
          </div>

          {/* 진행 바 */}
          <div className="flex items-center justify-between text-yellow-100 text-xs">
            <span>자동으로 닫힘</span>
            <span>{timeLeft}초</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1 mt-1">
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="bg-white rounded-full h-1"
            />
          </div>

          {/* 배경 효과 */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  x: Math.random() * 100 - 50,
                  y: Math.random() * 100 - 50,
                  scale: 0 
                }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 200 - 100,
                  scale: [0, 1, 0] 
                }}
                transition={{ 
                  duration: 2, 
                  delay: Math.random() * 1,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3 + 2
                }}
                className="absolute w-2 h-2 bg-yellow-200 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 
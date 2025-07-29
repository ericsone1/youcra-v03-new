import React from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaClock, FaFire, FaChartLine, FaGift } from 'react-icons/fa';
import { useTokenStats } from '../../hooks/useTokenStats';

export default function TokenStatsCard() {
  const { tokenStats, loading, error } = useTokenStats();

  // 로딩 중이거나 에러가 있으면 로딩 표시
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-gradient-to-br from-indigo-50 via-white to-cyan-50 rounded-xl border border-slate-200/50 p-3 mb-3 shadow-lg backdrop-blur-sm overflow-hidden"
      >
        <div className="flex items-center justify-center h-20 flex-col">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mb-2"></div>
          <p className="text-xs text-slate-500">토큰 계산 중...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-gradient-to-br from-red-50 via-white to-pink-50 rounded-xl border border-red-200/50 p-3 mb-3 shadow-lg backdrop-blur-sm overflow-hidden"
      >
        <div className="text-center text-red-600">
          <p className="text-sm">토큰 정보를 불러올 수 없습니다</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-gradient-to-br from-indigo-50 via-white to-cyan-50 rounded-xl border border-slate-200/50 p-3 mb-3 shadow-lg backdrop-blur-sm overflow-hidden"
    >
      {/* 배경 장식 요소 */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-100/30 to-purple-100/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-br from-cyan-100/30 to-blue-100/20 rounded-full blur-lg"></div>
      
      {/* 헤더 */}
      <div className="relative flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-1.5 mr-2 shadow-sm">
            <FaCoins className="text-white text-sm" />
          </div>
          <span className="text-base font-semibold text-slate-700">토큰 월렛</span>
        </div>
        <div className="text-right">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent font-bold text-xl">
            {tokenStats.availableTokens || 0}
          </div>
        </div>
      </div>

      {/* 통계 그리드 */}
      <div className="relative grid grid-cols-3 gap-2 mb-2">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-1.5 text-center">
          <div className="text-xs font-semibold text-slate-600">{tokenStats.totalWatchHours || '0'}시간</div>
          <div className="text-xs text-slate-500">시청</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-1.5 text-center">
          <div className="text-xs font-semibold text-slate-600">{tokenStats.totalTokens || 0}개</div>
          <div className="text-xs text-slate-500">획득</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-1.5 text-center">
          <div className="text-xs font-semibold text-slate-600">{tokenStats.spentTokens || 0}개</div>
          <div className="text-xs text-slate-500">사용</div>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="relative mb-2">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>다음 토큰까지</span>
          <span>{tokenStats.nextTokenIn || '정보 없음'}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${tokenStats.progressToNextToken || 0}%` }}
          ></div>
        </div>
      </div>

      {/* 도움말 */}
      <div className="relative text-center">
        <p className="text-xs text-slate-500 flex items-center justify-center">
          <FaFire className="mr-1 text-pink-400" />
          10분 시청하면 1토큰 획득
          <FaGift className="ml-2 text-emerald-400" />
        </p>
      </div>
    </motion.div>
  );
} 
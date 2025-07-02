import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const LoginPromptCard = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-8 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-6 bg-blue-500 rounded-2xl flex items-center justify-center">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        로그인이 필요합니다
      </h2>
      <p className="text-gray-600 mb-8">
        영상 시청과 토큰 적립을 위해 로그인해주세요
      </p>
      
      <div className="space-y-3">
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
        >
          로그인하기
        </button>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-lg font-medium text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          회원가입하기
        </button>
      </div>
    </motion.div>
  );
}; 
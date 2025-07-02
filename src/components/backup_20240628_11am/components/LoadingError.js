// 🔄 로딩 및 에러 상태 컴포넌트
// 원본: Home.js에서 추출

import React from 'react';

export const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="spinner"></div>
      <div className="text-gray-600 font-medium">로딩 중...</div>
    </div>
  </div>
);

export const ErrorDisplay = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="card max-w-md w-full p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">오류 발생</h3>
      <p className="text-red-600 mb-6">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="btn-primary w-full"
      >
        다시 시도
      </button>
    </div>
  </div>
); 
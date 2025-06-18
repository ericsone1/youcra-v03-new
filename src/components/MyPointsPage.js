import React from 'react';
import BottomTabBar from './MyChannel/BottomTabBar';

function MyPointsPage() {
  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center pb-24 px-4 text-center">
      <div className="max-w-md w-full bg-white shadow rounded-2xl p-8">
        <div className="text-5xl mb-4">💎</div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">내 포인트</h1>
        <p className="text-gray-600 mb-6">포인트 기능은 준비 중입니다! 곧 더 재미있는 보상 시스템으로 찾아뵐게요. ✨</p>
      </div>
      <BottomTabBar />
    </div>
  );
}

export default MyPointsPage; 
import React from 'react';

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="text-6xl mb-4">📝</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">첫 번째 게시글을 작성해보세요!</h3>
      <p className="text-gray-600">아직 작성된 게시글이 없습니다.</p>
    </div>
  );
}

export default EmptyState; 
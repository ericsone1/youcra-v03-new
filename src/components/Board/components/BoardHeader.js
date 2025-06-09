import React from 'react';

function BoardHeader({ showCreateForm, onToggleForm }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>📋</span>
          자유게시판
        </h1>
        <button
          onClick={onToggleForm}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <span>✏️</span>
          글쓰기
        </button>
      </div>
      <p className="text-gray-600 text-sm">유크라 사용자들과 자유롭게 소통해보세요!</p>
    </div>
  );
}

export default BoardHeader; 
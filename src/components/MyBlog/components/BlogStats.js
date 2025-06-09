import React from 'react';

function BlogStats({ blogData }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-purple-600">{blogData.postsCount || 0}</div>
        <div className="text-sm text-gray-500">총 포스트</div>
      </div>
      <div className="bg-white rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{blogData.viewsCount || 0}</div>
        <div className="text-sm text-gray-500">총 조회수</div>
      </div>
      <div className="bg-white rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{blogData.category}</div>
        <div className="text-sm text-gray-500">카테고리</div>
      </div>
    </div>
  );
}

export default BlogStats; 
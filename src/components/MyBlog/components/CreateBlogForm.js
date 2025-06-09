import React, { useState } from 'react';

function CreateBlogForm({ onCreateBlog, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '일상'
  });

  const categories = ['일상', '기술', '여행', '음식', '취미', '리뷰', '기타'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('블로그 제목과 설명을 모두 입력해주세요.');
      return;
    }
    onCreateBlog(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            📝
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">내 블로그 만들기</h2>
          <p className="text-gray-600">당신만의 특별한 블로그를 시작해보세요!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">블로그 제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="블로그 제목을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">블로그 설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="블로그에 대한 간단한 설명을 작성해주세요"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">주요 카테고리</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-200 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-purple-600 transition"
            >
              블로그 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBlogForm; 
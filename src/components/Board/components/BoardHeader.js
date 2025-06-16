import React from 'react';

function BoardHeader({ currentCategory, showCreateForm, onToggleForm, isAuthenticated }) {
  // 카테고리별 고정 버튼 스타일
  const getButtonStyle = (category, isCreateForm) => {
    if (isCreateForm) {
      return 'bg-gray-300 text-gray-700 hover:bg-gray-400';
    }
    
    const styles = {
      promotion: 'bg-blue-500 text-white hover:bg-blue-600',
      suggestion: 'bg-yellow-500 text-white hover:bg-yellow-600',
      free: 'bg-green-500 text-white hover:bg-green-600',
      collaboration: 'bg-purple-500 text-white hover:bg-purple-600',
      tips: 'bg-red-500 text-white hover:bg-red-600'
    };
    
    return styles[category?.id] || 'bg-blue-500 text-white hover:bg-blue-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentCategory?.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {currentCategory?.name || '게시판'}
            </h1>
            <p className="text-gray-600 text-sm">유크라 사용자들과 자유롭게 소통해보세요!</p>
          </div>
        </div>
        {isAuthenticated && (
          <button
            onClick={onToggleForm}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${getButtonStyle(currentCategory, showCreateForm)}`}
          >
            <span>{showCreateForm ? '❌' : '✏️'}</span>
            {showCreateForm ? '취소' : '글쓰기'}
          </button>
        )}
      </div>
    </div>
  );
}

export default BoardHeader; 
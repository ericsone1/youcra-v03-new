import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 추천 카테고리 목록
const SUGGESTED_CATEGORIES = [
  { id: 1, name: '게임', icon: '🎮', color: 'bg-purple-500' },
  { id: 2, name: '음악', icon: '🎵', color: 'bg-pink-500' },
  { id: 3, name: '요리', icon: '🍳', color: 'bg-yellow-500' },
  { id: 4, name: '여행', icon: '✈️', color: 'bg-blue-500' },
  { id: 5, name: '뷰티', icon: '💄', color: 'bg-red-500' },
  { id: 6, name: '일상', icon: '📱', color: 'bg-green-500' },
  { id: 7, name: '교육', icon: '📚', color: 'bg-indigo-500' },
  { id: 8, name: '스포츠', icon: '⚽', color: 'bg-orange-500' },
];

export const CategoryInputBox = ({ selectedCategories, onCategoriesChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // 입력값이 변경될 때마다 추천 카테고리 필터링
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions(SUGGESTED_CATEGORIES);
      return;
    }

    const filtered = SUGGESTED_CATEGORIES.filter(
      category => 
        category.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedCategories.some(selected => selected.id === category.id)
    );
    setSuggestions(filtered);
  }, [inputValue, selectedCategories]);

  const handleCategorySelect = (category) => {
    if (selectedCategories.length >= 3) {
      return; // 최대 3개까지만 선택 가능
    }
    onCategoriesChange([...selectedCategories, category]);
    setInputValue('');
  };

  const handleCategoryRemove = (categoryId) => {
    onCategoriesChange(selectedCategories.filter(c => c.id !== categoryId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        🏷️ 채널 카테고리 선택
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        당신의 채널과 매칭되는 영상을 보여드리겠습니다
      </p>

      {/* 선택된 카테고리 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedCategories.map(category => (
          <motion.div
            key={category.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`${category.color} text-white rounded-full px-3 py-1 text-sm flex items-center gap-1`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
            <button
              onClick={() => handleCategoryRemove(category.id)}
              className="ml-1 hover:text-red-200"
            >
              ×
            </button>
          </motion.div>
        ))}
      </div>

      {/* 카테고리 입력 */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="카테고리 검색 또는 직접 입력"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={selectedCategories.length >= 3}
        />
        
        {selectedCategories.length >= 3 && (
          <p className="text-sm text-orange-500 mt-2">
            ⚠️ 최대 3개까지 선택할 수 있습니다
          </p>
        )}
      </div>

      {/* 추천 카테고리 */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          추천 카테고리
        </h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category)}
              disabled={selectedCategories.length >= 3}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-gray-200
                ${selectedCategories.length >= 3
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'hover:bg-gray-50 text-gray-700 hover:border-gray-300'
                }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}; 
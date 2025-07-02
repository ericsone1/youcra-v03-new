import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';

const SUGGESTED_CATEGORIES = [
  '게임', '음악', '영화', '교육', '요리', '여행',
  '뷰티', '테크', '스포츠', '라이프스타일'
];

const CategoryInputBox = ({ onCategoriesChange, maxCategories = 3 }) => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddCategory = (category) => {
    if (categories.length < maxCategories && !categories.includes(category)) {
      const newCategories = [...categories, category];
      setCategories(newCategories);
      onCategoriesChange?.(newCategories);
      setSearchTerm('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    const newCategories = categories.filter(cat => cat !== categoryToRemove);
    setCategories(newCategories);
    onCategoriesChange?.(newCategories);
  };

  const filteredSuggestions = SUGGESTED_CATEGORIES.filter(
    cat => cat.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !categories.includes(cat)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 mb-6"
    >
      <h2 className="text-xl font-bold mb-4">채널 카테고리 선택</h2>
      
      <div className="relative mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={`카테고리 검색 (최대 ${maxCategories}개)`}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={categories.length >= maxCategories}
        />

        <AnimatePresence>
          {showSuggestions && searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg"
            >
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddCategory(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">
                  검색 결과가 없습니다
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <motion.span
            key={category}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
          >
            {category}
            <button
              onClick={() => handleRemoveCategory(category)}
              className="p-1 hover:bg-blue-200 rounded-full"
            >
              <IoClose size={14} />
            </button>
          </motion.span>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="text-gray-500 text-sm mt-2">
          추천 카테고리를 검색하거나 직접 입력하세요
        </p>
      )}
    </motion.div>
  );
};

export default CategoryInputBox; 
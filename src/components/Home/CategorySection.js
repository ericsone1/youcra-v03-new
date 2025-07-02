import React from 'react';

export default function CategorySection({ selectedCategories, categoriesCompleted, onCategoriesChange }) {
  return (
    <section className="p-4 bg-gray-50 rounded-lg mb-4">
      <h2 className="text-lg font-semibold mb-2">내 관심 카테고리</h2>
      {/* 카테고리 선택 UI (예시) */}
      <div className="flex flex-wrap gap-2 mb-2">
        {['게임', '음악', '스포츠', '교육', '엔터', '기타'].map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1 rounded border ${selectedCategories.includes(cat) ? 'bg-blue-200 border-blue-400' : 'bg-white border-gray-300'}`}
            onClick={() => {
              if (selectedCategories.includes(cat)) {
                onCategoriesChange(selectedCategories.filter((c) => c !== cat));
              } else {
                onCategoriesChange([...selectedCategories, cat]);
              }
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      {categoriesCompleted ? (
        <span className="text-green-600 text-sm">카테고리 선택 완료!</span>
      ) : (
        <span className="text-gray-500 text-sm">카테고리를 1개 이상 선택하세요.</span>
      )}
    </section>
  );
} 
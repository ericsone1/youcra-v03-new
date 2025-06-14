import React from 'react';

function SearchBar({ searchQuery, onSearchChange, onSearch, onKeyDown }) {
  return (
    <div className="relative mb-4">
      <input
        type="text"
        placeholder="채팅방 이름, 키워드, #해시태그 검색..."
        value={searchQuery}
        onChange={onSearchChange}
        onKeyDown={onKeyDown}
        className="w-full p-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
      />
      <button 
        onClick={onSearch}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-blue-600 transition-colors duration-200 p-1"
        aria-label="검색"
      >
        <svg className="w-5 h-5 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  );
}

export default SearchBar; 
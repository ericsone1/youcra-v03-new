import React from 'react';

function SearchFilter({ 
  searchInput, 
  setSearchInput, 
  searchActive, 
  onSearch, 
  onClearSearch
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch(searchInput);
    }
  };

  return (
    <div className="space-y-2">
      {/* 검색창 */}
      <input
        className="w-full rounded-lg border px-3 py-2 mb-2 text-base"
        placeholder="채팅방 이름, 키워드, #해시태그 검색"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
      {/* 검색 해제 버튼 */}
      {searchActive && (
        <button
          className="text-sm text-blue-500 underline mb-2 ml-1"
          onClick={onClearSearch}
        >
          검색 해제
        </button>
      )}
      

    </div>
  );
}

export default SearchFilter; 
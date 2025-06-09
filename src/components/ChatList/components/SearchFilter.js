import React from 'react';

function SearchFilter({ 
  searchInput, 
  setSearchInput, 
  searchActive, 
  onSearch, 
  onClearSearch, 
  filter, 
  onFilterChange 
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
        className="w-full rounded-lg border px-3 py-2 mb-2 text-sm"
        placeholder="채팅방 이름, 키워드, #해시태그 검색"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
      {/* 검색 해제 버튼 */}
      {searchActive && (
        <button
          className="text-xs text-blue-500 underline mb-2 ml-1"
          onClick={onClearSearch}
        >
          검색 해제
        </button>
      )}
      
      {/* 정렬 셀렉트 박스 */}
      <div className="mb-3">
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="최신순">최신순</option>
          <option value="좋아요순">좋아요순</option>
          <option value="참여인원순">참여인원순</option>
        </select>
      </div>
    </div>
  );
}

export default SearchFilter; 
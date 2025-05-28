import React from 'react';
import { useLocation } from 'react-router-dom';

function SearchResult() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get('query');

  return (
    <div className="p-8 text-center text-gray-500">
      <div className="text-lg font-bold mb-4">검색 결과</div>
      <div className="mb-2">현재 검색어 서비스는 준비중입니다.<br />
        입력한 검색어: <b>{query}</b>
      </div>
      <div className="text-sm text-gray-400">곧 서비스될 예정이니 기다려주세요! 🙏</div>
    </div>
  );
}

export default SearchResult; 
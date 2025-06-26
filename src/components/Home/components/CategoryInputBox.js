import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 추천 키워드 예시(실제 추천 알고리즘은 추후 확장)
const SUGGESTED_KEYWORDS = [
  '게임', '롤', 'e스포츠', 'MOBA', '음악', 'K-POP', '피아노', '요리', '한식', '여행', '브이로그', '뷰티', '메이크업', '일상', '교육', '수학', '영어', '스포츠', '축구', '농구', '헬스', '다이어트', '테크', 'IT', '리뷰', '먹방', 'ASMR', '동물', '반려견', '패션', '쇼핑', '자동차', '드라마', '영화', '애니', '만화', '책', '독서', '사진', '캠핑', '등산', '자연', '과학', '역사', '정치', '경제', '주식', '코딩', '프로그래밍', 'React', '유튜브'
];

// 카테고리-키워드 매핑 테이블
const CATEGORY_MAP = {
  '게임': ['게임', '롤', 'e스포츠', 'MOBA', 'FPS', '오버워치', '배그', '서든', '스타', 'LOL', '리그오브레전드', '포켓몬', '모바일게임', '스팀', '콘솔', '닌텐도', '플스', 'XBOX'],
  '음악': ['음악', 'K-POP', '피아노', '작곡', '노래', '보컬', '기타', '밴드', '랩', '힙합', '커버', '뮤직', '연주', '음반', '앨범'],
  '요리': ['요리', '한식', '레시피', '먹방', '쿠킹', '베이킹', '디저트', '음식', '식사', '간식', '브런치'],
  '여행': ['여행', '브이로그', '여행기', '트립', '해외', '국내', '관광', '캠핑', '등산', '자연', '풍경'],
  '뷰티': ['뷰티', '메이크업', '화장', '스킨케어', '패션', '헤어', '네일', '쇼핑', '스타일'],
  '일상': ['일상', '브이로그', '라이프', '생활', '집', '반려견', '동물', '고양이', '강아지', '가족', '친구'],
  '교육': ['교육', '수학', '영어', '공부', '강의', '학습', '과외', '입시', '과학', '역사', '정치', '경제', '주식', '코딩', '프로그래밍', 'React', 'IT', '테크'],
  '스포츠': ['스포츠', '축구', '농구', '야구', '헬스', '다이어트', '운동', '체육', '마라톤', '수영', '골프'],
  '리뷰': ['리뷰', 'IT', '테크', '제품', '언박싱', '전자기기', '자동차', '카메라', '폰', '가전'],
  '엔터테인먼트': ['드라마', '영화', '애니', '만화', '예능', '방송', '연예', '연기', '뮤지컬', '공연', '연출'],
  '책/독서': ['책', '독서', '서평', '문학', '작가', '출판', '독후감'],
  '기타': []
};

function matchCategory(keyword) {
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => keyword.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  return '기타';
}

export const CategoryInputBox = ({ selectedCategories, onCategoriesChange, onComplete }) => {
  const [inputValue, setInputValue] = useState('');
  const [keywords, setKeywords] = useState(
    (selectedCategories || [])
      .filter(Boolean)
      .map(c => typeof c === 'string' ? c : c.keyword)
  );

  // 입력값이 변경될 때마다 유사 추천 키워드 필터링
  const suggestions = React.useMemo(() => {
    if (!inputValue.trim()) return [];
    const lower = inputValue.trim().toLowerCase();
    return SUGGESTED_KEYWORDS.filter(
      k => k.toLowerCase().includes(lower) && !keywords.includes(k)
    ).slice(0, 6);
  }, [inputValue, keywords]);

  // 키워드 추가 (엔터/쉼표)
  const handleInputKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',')) {
      e.preventDefault();
      addKeyword(inputValue.trim());
    }
  };

  const addKeyword = (word) => {
    if (!word) return;
    if (keywords.length >= 3) return;
    if (keywords.includes(word)) return;
    setKeywords([...keywords.filter(Boolean), word]);
    setInputValue('');
  };

  const handleRemoveKeyword = (word) => {
    setKeywords(keywords.filter(k => (typeof k === 'string' ? k : k.keyword) !== word && Boolean(k)));
  };

  const handleSuggestionClick = (word) => {
    if (keywords.length >= 3) return;
    if (keywords.includes(word)) return;
    setKeywords([...keywords, word]);
    setInputValue('');
  };

  const handleComplete = () => {
    let combined = [...keywords];
    const trimmed = inputValue.trim();
    if (trimmed) {
      if (!combined.includes(trimmed) && combined.length < 3) {
        combined.push(trimmed);
      }
    }
    // 최대 3개 제한 및 빈 값 제거
    const validKeywords = combined.filter(Boolean).slice(0, 3);
    if (validKeywords.length === 0) return;
    // 내부 사전 기반 자동 매칭
    const mapped = validKeywords.map(word => ({
      category: matchCategory(word),
      keyword: word
    }));
    onCategoriesChange(mapped);
    onComplete();
    // 상태 리셋
    setKeywords(validKeywords);
    setInputValue('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        🏷️ 채널 카테고리(키워드) 입력
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        채널을 대표하는 키워드(최대 3개)를 입력하세요. 예: 게임, 롤, e스포츠
      </p>

      {/* 입력된 키워드 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {keywords.filter(Boolean).map(word => (
          <motion.div
            key={typeof word === 'string' ? word : word.keyword}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-blue-500 text-white rounded-full px-3 py-1 text-sm flex items-center gap-1"
          >
            <span>{typeof word === 'string' ? word : word.keyword}</span>
            <button
              onClick={() => handleRemoveKeyword(typeof word === 'string' ? word : word.keyword)}
              className="ml-1 hover:text-red-200"
            >
              ×
            </button>
          </motion.div>
        ))}
      </div>

      {/* 키워드 입력 */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="카테고리 또는 키워드 입력 후 Enter/쉼표"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={keywords.length >= 3}
        />
        {keywords.length >= 3 && (
          <p className="text-sm text-orange-500 mt-2">
            ⚠️ 최대 3개까지 입력할 수 있습니다
          </p>
        )}
      </div>

      {/* 유사 추천 키워드 */}
      {suggestions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            추천 키워드
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(word => (
              <button
                key={word}
                type="button"
                onClick={() => handleSuggestionClick(word)}
                className="px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-gray-50 hover:bg-blue-50 text-gray-700"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 선택 완료 버튼 */}
      <button
        type="button"
        onClick={handleComplete}
        className="mt-6 w-full py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors text-lg shadow"
        disabled={keywords.length === 0 && inputValue.trim() === ''}
      >
        선택 완료
      </button>
    </motion.div>
  );
}; 
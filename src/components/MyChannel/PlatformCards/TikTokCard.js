import React, { useState } from 'react';

const TikTokCard = ({ channel, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // TikTok 사용자명 추출
  const getUsername = (url) => {
    try {
      const match = url.match(/tiktok\.com\/@?([^/?]+)/);
      return match ? match[1] : 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  const username = getUsername(channel.url);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-300 rounded-lg p-4 mb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-gray-800 to-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            🎵
          </div>
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              TikTok
              <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                @{username}
              </span>
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(channel.registeredAt).toLocaleDateString('ko-KR')} 등록
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition p-1"
            title={isExpanded ? "접기" : "펼치기"}
          >
            <svg 
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {onRemove && (
            <button
              onClick={() => onRemove(channel.id)}
              className="text-red-400 hover:text-red-600 transition p-1"
              title="채널 삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 truncate max-w-xs mb-2">{channel.url}</p>
          
          {/* TikTok 통계 (모의 데이터) */}
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-gray-800">---</div>
              <div className="text-gray-500">팔로워</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-500">---</div>
              <div className="text-gray-500">좋아요</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-600">---</div>
              <div className="text-gray-500">동영상</div>
            </div>
          </div>
        </div>
        
        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-gray-800 to-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:from-gray-900 hover:to-gray-700 transition flex-shrink-0"
        >
          바로가기
        </a>
      </div>

      {/* 확장된 정보 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">🎬 콘텐츠</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 조회수:</span>
                  <span className="font-medium">---</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 좋아요:</span>
                  <span className="font-medium">---</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 댓글:</span>
                  <span className="font-medium">---</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">📈 성장</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">최근 업로드:</span>
                  <span className="font-medium">---</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">업로드 빈도:</span>
                  <span className="font-medium">---</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">트렌드 점수:</span>
                  <span className="font-medium">---</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 인기 태그 */}
          <div className="mt-4">
            <h4 className="font-semibold text-gray-700 mb-2">🏷️ 인기 태그</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">#dance</span>
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">#trending</span>
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">#viral</span>
              <span className="text-gray-400 text-xs">+ 더보기</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-700">
              💡 TikTok API 연동 시 실제 팔로워 수, 조회수, 인기 태그 등을 실시간으로 확인할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TikTokCard; 
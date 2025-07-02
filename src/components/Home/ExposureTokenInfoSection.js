import React from 'react';

export default function ExposureTokenInfoSection({ tokenCount, onTokenEarned }) {
  return (
    <section className="p-4 bg-blue-50 rounded-lg mb-4 flex items-center justify-between">
      <div>
        <span className="font-semibold text-blue-700">시청 토큰</span>
        <span className="ml-2 text-lg font-bold text-blue-900">{tokenCount}</span>
      </div>
      {onTokenEarned && (
        <button
          className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm"
          onClick={onTokenEarned}
        >
          토큰 적립 테스트
        </button>
      )}
    </section>
  );
} 
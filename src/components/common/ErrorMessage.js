import React from 'react';

export function ErrorMessage({ message, fullScreen = false, onRetry }) {
  const containerClasses = fullScreen
    ? "flex flex-col items-center justify-center h-screen"
    : "flex flex-col items-center justify-center p-4";

  return (
    <div className={containerClasses}>
      <div className="flex items-center text-red-500 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-lg">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          다시 시도
        </button>
      )}
    </div>
  );
} 
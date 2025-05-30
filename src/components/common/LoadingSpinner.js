import React from 'react';

export function LoadingSpinner({ fullScreen = false }) {
  const containerClasses = fullScreen
    ? "flex items-center justify-center h-screen"
    : "flex items-center justify-center p-4";

  return (
    <div className={containerClasses}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-gray-600">로딩중...</span>
    </div>
  );
} 
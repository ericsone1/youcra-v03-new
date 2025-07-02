import React from 'react';

export default function HeaderSection({ user, onLogout }) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-white">
      <h1 className="text-2xl font-bold text-blue-700">YouCra 홈</h1>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-gray-700">{user.displayName}</span>
        )}
        {onLogout && (
          <button
            className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm"
            onClick={onLogout}
          >
            로그아웃
          </button>
        )}
      </div>
    </header>
  );
} 
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      path: '/',
      label: '홈',
      icon: (active) => (
        <svg
          className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110' : ''}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2 : 1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
          />
        </svg>
      )
    },
    {
      path: '/chat',
      label: '채팅',
      icon: (active) => (
        <svg
          className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110' : ''}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2 : 1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )
    },
    {
      path: '/board',
      label: '게시판',
      icon: (active) => (
        <svg
          className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110' : ''}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2 : 1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )
    },
    {
      path: '/my',
      label: '마이채널',
      icon: (active) => (
        <svg
          className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110' : ''}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={active ? 2 : 1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      )
    }
  ];

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50">
      {/* 글래스모피즘 배경 */}
      <div className="glass rounded-t-3xl shadow-2xl border-t border-white/20">
        <div className="flex justify-around items-center py-2 px-4">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-2xl min-w-[60px]
                  transition-all duration-300 transform
                  ${active 
                    ? 'text-white scale-105' 
                    : 'text-gray-500 hover:text-gray-700 hover:scale-105'
                  }
                `}
              >
                {/* 활성 상태 배경 */}
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg animate-pulse"></div>
                )}
                
                {/* 아이콘 */}
                <div className="relative z-10 mb-1 nav-icon">
                  {item.icon(active)}
                </div>
                
                {/* 라벨 */}
                <span className={`
                  relative z-10 text-xs font-medium transition-all duration-300
                  ${active ? 'font-bold' : ''}
                `}>
                  {item.label}
                </span>
                
                {/* 활성 상태 점 표시 */}
                {active && (
                  <div className="absolute -top-1 w-2 h-2 bg-white rounded-full shadow-lg animate-bounce"></div>
                )}
              </Link>
            );
          })}
        </div>
        
        {/* 하단 안전 영역 (iPhone X+ 대응) */}
        <div className="h-safe-area-inset-bottom bg-transparent"></div>
      </div>
    </footer>
  );
} 
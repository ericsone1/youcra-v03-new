import React from 'react';
import { Link } from 'react-router-dom';

const BottomTabBar = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-center items-center h-16 z-50">
      <div className="max-w-md w-full mx-auto flex justify-around items-center">
        <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
          </svg>
          <span className="text-xs">홈</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m10 0V6a4 4 0 00-8 0v2" />
          </svg>
          <span className="text-xs">채팅방</span>
        </Link>
        <Link to="/board" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <span className="text-xs">게시판</span>
        </Link>
        <Link to="/my" className="flex flex-col items-center text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-bold">마이채널</span>
        </Link>
      </div>
    </footer>
  );
};

export default BottomTabBar; 
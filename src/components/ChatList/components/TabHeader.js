import React from 'react';

function TabHeader({ activeTab, onTabChange }) {
  return (
    <div className="flex gap-2 mb-2">
      <button 
        className={`flex-1 py-2 rounded-full font-bold text-base ${
          activeTab === "내 채팅방" 
            ? "bg-blue-500 text-white" 
            : "bg-blue-100 text-gray-500"
        }`} 
        onClick={() => onTabChange("내 채팅방")}
      >
        내 채팅방
      </button>
      <button 
        className={`flex-1 py-2 rounded-full font-bold text-base ${
          activeTab === "전체" 
            ? "bg-blue-500 text-white" 
            : "bg-blue-100 text-gray-500"
        }`} 
        onClick={() => onTabChange("전체")}
      >
        전체
      </button>
    </div>
  );
}

export default TabHeader; 
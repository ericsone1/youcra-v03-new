import React from 'react';
import { MdPictureInPicture, MdClose } from 'react-icons/md';

export default function PlayerControlsSection({ minimized, onMinimize, onClose }) {
  if (minimized) return null;
  return (
    <div
      className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b rounded-t-2xl cursor-move select-none"
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <span className="text-sm text-gray-600 font-semibold">영상 플레이어 (반복재생) - 드래그해서 이동</span>
      <div className="flex items-center gap-2">
        <button
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 touch-manipulation cursor-pointer"
          onClick={e => { e.stopPropagation(); onMinimize(true); }}
          onTouchStart={e => { e.stopPropagation(); }}
          onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); onMinimize(true); }}
          style={{ touchAction: 'manipulation' }}
          title="미니플레이어로 전환"
        >
          <MdPictureInPicture size={18} />
        </button>
        <button
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 touch-manipulation cursor-pointer"
          onClick={e => { e.stopPropagation(); onClose(); }}
          onTouchStart={e => { e.stopPropagation(); }}
          onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); onClose(); }}
          style={{ touchAction: 'manipulation' }}
          aria-label="플레이어 닫기"
        >
          <MdClose size={20} />
        </button>
      </div>
    </div>
  );
} 
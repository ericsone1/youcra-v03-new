import React from 'react';
import { FaWindowMinimize } from 'react-icons/fa';

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
          className="text-xl text-gray-400 hover:text-gray-700 touch-manipulation cursor-pointer"
          onClick={e => { e.stopPropagation(); onMinimize(true); }}
          onTouchStart={e => { e.stopPropagation(); }}
          onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); onMinimize(true); }}
          style={{ touchAction: 'manipulation' }}
          title="최소화"
        >
          <FaWindowMinimize />
        </button>
        <button
          className="text-2xl text-gray-400 hover:text-gray-700 touch-manipulation cursor-pointer"
          onClick={e => { e.stopPropagation(); onClose(); }}
          onTouchStart={e => { e.stopPropagation(); }}
          onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); onClose(); }}
          style={{ touchAction: 'manipulation' }}
          aria-label="플레이어 닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
} 
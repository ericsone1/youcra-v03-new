import React, { useState } from 'react';

export default function IOSOverlay({ onFirstTouch }) {
  const [fadeOut, setFadeOut] = useState(false);

  const handleClick = () => {
    setFadeOut(true);
    if (onFirstTouch) onFirstTouch();
    // overlay will be removed by parent once show flag false
  };

  return (
    <div
      onClick={handleClick}
      className={`absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/60 transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="mb-4 animate-ping-slow">
        {/* simple hand icon */}
        <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a2 2 0 00-2 2v8h-1V5a2 2 0 10-4 0v7H4V7a2 2 0 10-4 0v12a5 5 0 005 5h7a5 5 0 005-5V3a2 2 0 00-2-2 2 2 0 00-2 2v9h-1V3a2 2 0 00-2-2z" />
        </svg>
      </div>
      <div className="text-white text-lg font-semibold mb-1">터치해서 소리를 켜세요</div>
      <div className="text-white text-sm opacity-80">소리가 켜지면 영상이 자동으로 재생돼요</div>
    </div>
  );
}

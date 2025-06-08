import React, { useState, useCallback, useRef } from 'react';

export const MessageInput = React.memo(function MessageInput({ onSend, disabled }) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!message.trim() || disabled || isComposing) return;
    
    onSend(message.trim());
    setMessage('');
    inputRef.current?.focus();
  }, [message, onSend, disabled, isComposing]);

  const handleChange = useCallback((e) => {
    setMessage(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit, isComposing]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-4"
      aria-label="메시지 입력 폼"
    >
      <div className="flex items-end space-x-3">
        {/* 메시지 입력 영역 */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200 max-h-32"
            style={{
              minHeight: '48px',
              lineHeight: '1.5',
            }}
            aria-label="메시지 입력창"
            aria-required={true}
            aria-invalid={message.trim().length === 0}
          />
          
          {/* 문자 수 표시 */}
          {message.length > 0 && (
            <div className="absolute bottom-1 right-14 text-xs text-gray-400">
              {message.length}
            </div>
          )}
        </div>

        {/* 전송 버튼 */}
        <button
          type="submit"
          disabled={disabled || !message.trim() || isComposing}
          className={`p-3 rounded-full transition-all duration-200 ${
            disabled || !message.trim() || isComposing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg hover:shadow-xl'
          }`}
          aria-label="메시지 전송"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
            />
          </svg>
        </button>
      </div>
      
      {/* 입력 힌트 */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Enter로 전송 • Shift+Enter로 줄바꿈
      </div>
    </form>
  );
}); 
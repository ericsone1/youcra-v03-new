import React, { useState, useEffect, useRef } from 'react';

/**
 * 개발 모드에서 성능 지표를 실시간으로 표시하는 모니터링 컴포넌트
 */
const PerformanceMonitor = ({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  minimized = false
}) => {
  const [stats, setStats] = useState({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    scrollEvents: 0,
    domNodes: 0
  });
  const [isVisible, setIsVisible] = useState(!minimized);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const scrollEventCount = useRef(0);
  const renderStartTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let animationId;
    
    const measurePerformance = () => {
      const now = performance.now();
      frameCount.current++;
      
      // FPS 계산 (매 초마다 업데이트)
      if (now - lastTime.current >= 1000) {
        setStats(prev => ({
          ...prev,
          fps: Math.round((frameCount.current * 1000) / (now - lastTime.current)),
          memoryUsage: performance.memory ? 
            Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0,
          domNodes: document.querySelectorAll('*').length,
          scrollEvents: scrollEventCount.current
        }));
        
        frameCount.current = 0;
        lastTime.current = now;
        scrollEventCount.current = 0;
      }
      
      animationId = requestAnimationFrame(measurePerformance);
    };

    // 스크롤 이벤트 카운터
    const handleScroll = () => {
      scrollEventCount.current++;
    };

    // 렌더링 시간 측정
    const measureRenderTime = () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        setStats(prev => ({ ...prev, renderTime: Math.round(renderTime * 100) / 100 }));
      }
      renderStartTime.current = performance.now();
    };

    // 이벤트 리스너 등록
    document.addEventListener('scroll', handleScroll, { passive: true });
    measurePerformance();
    
    // 렌더링 시간 측정을 위한 observer
    const observer = new MutationObserver(measureRenderTime);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true 
    });

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      document.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [enabled]);

  if (!enabled || !isVisible) {
    return enabled ? (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed z-50 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded hover:bg-opacity-90 transition-all ${
          position === 'bottom-right' ? 'bottom-4 right-4' :
          position === 'bottom-left' ? 'bottom-4 left-4' :
          position === 'top-right' ? 'top-4 right-4' : 'top-4 left-4'
        }`}
      >
        📊
      </button>
    ) : null;
  }

  const getPerformanceColor = (value, type) => {
    switch (type) {
      case 'fps':
        if (value >= 55) return 'text-green-400';
        if (value >= 30) return 'text-yellow-400';
        return 'text-red-400';
      case 'memory':
        if (value <= 50) return 'text-green-400';
        if (value <= 100) return 'text-yellow-400';
        return 'text-red-400';
      case 'render':
        if (value <= 16) return 'text-green-400';
        if (value <= 33) return 'text-yellow-400';
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className={`fixed z-50 ${
      position === 'bottom-right' ? 'bottom-4 right-4' :
      position === 'bottom-left' ? 'bottom-4 left-4' :
      position === 'top-right' ? 'top-4 right-4' : 'top-4 left-4'
    }`}>
      <div className="bg-black bg-opacity-90 text-white text-xs p-3 rounded-lg shadow-lg min-w-48">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-blue-400">⚡ 성능 모니터</span>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>FPS:</span>
            <span className={getPerformanceColor(stats.fps, 'fps')}>
              {stats.fps}
            </span>
          </div>
          
          {stats.memoryUsage > 0 && (
            <div className="flex justify-between">
              <span>메모리:</span>
              <span className={getPerformanceColor(stats.memoryUsage, 'memory')}>
                {stats.memoryUsage}MB
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>렌더시간:</span>
            <span className={getPerformanceColor(stats.renderTime, 'render')}>
              {stats.renderTime}ms
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>스크롤/초:</span>
            <span className="text-blue-400">{stats.scrollEvents}</span>
          </div>
          
          <div className="flex justify-between">
            <span>DOM 노드:</span>
            <span className="text-gray-300">{stats.domNodes.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-center text-gray-400 text-xs">
            TanStack Virtual 최적화
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 
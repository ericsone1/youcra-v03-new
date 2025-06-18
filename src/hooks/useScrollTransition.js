import { useTransition, useEffect, useRef, useCallback } from 'react';

/**
 * 스크롤 중에 비중요한 업데이트를 지연시키는 훅
 * React 18의 useTransition을 활용한 스크롤 성능 최적화
 */
export const useScrollTransition = () => {
  const [isPending, startTransition] = useTransition();
  const scrollTimeoutRef = useRef(null);
  const isScrollingRef = useRef(false);

  // 스크롤 최적화를 위한 디바운스된 업데이트 함수
  const deferredUpdate = useCallback((updateFn) => {
    if (isScrollingRef.current) {
      // 스크롤 중에는 트랜지션으로 지연
      startTransition(() => {
        updateFn();
      });
    } else {
      // 스크롤 중이 아니면 즉시 실행
      updateFn();
    }
  }, [startTransition]);

  // 스크롤 상태 추적
  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;
    
    // 스크롤 종료 감지 (디바운스)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150); // 150ms 후 스크롤 종료로 간주
  }, []);

  // 클린업
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    isPending,
    isScrolling: isScrollingRef.current,
    deferredUpdate,
    handleScroll
  };
};

/**
 * 스크롤 컨테이너에 자동으로 이벤트를 바인딩하는 훅
 */
export const useScrollOptimization = (containerRef) => {
  const { isPending, isScrolling, deferredUpdate, handleScroll } = useScrollTransition();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 스크롤 이벤트 리스너 추가 (패시브 모드로 성능 최적화)
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    isPending,
    isScrolling,
    deferredUpdate
  };
};

export default useScrollTransition; 
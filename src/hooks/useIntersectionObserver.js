import { useEffect, useRef, useState } from 'react';

/**
 * Intersection Observer를 활용한 지연 로딩 훅
 * @param {Object} options - Intersection Observer 옵션
 * @param {string} options.rootMargin - 루트 마진 (기본: '50px')
 * @param {number} options.threshold - 임계값 (기본: 0.1)
 * @param {boolean} options.triggerOnce - 한 번만 트리거 여부 (기본: true)
 */
export const useIntersectionObserver = (options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        
        if (isVisible) {
          setIsIntersecting(true);
          setHasIntersected(true);
          
          // 한 번만 트리거하는 경우 관찰 중단
          if (triggerOnce) {
            observer.unobserve(target);
          }
        } else {
          if (!triggerOnce) {
            setIsIntersecting(false);
          }
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce]);

  return {
    targetRef,
    isIntersecting: triggerOnce ? hasIntersected : isIntersecting,
    hasIntersected
  };
};

/**
 * 리스트 아이템들을 위한 지연 로딩 훅
 * @param {Array} items - 아이템 배열
 * @param {number} initialCount - 초기 로드 개수 (기본: 10)
 * @param {number} loadMoreCount - 추가 로드 개수 (기본: 5)
 */
export const useLazyList = (items = [], initialCount = 10, loadMoreCount = 5) => {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  
  const { targetRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px',
    threshold: 0.1,
    triggerOnce: false
  });

  useEffect(() => {
    if (isIntersecting && visibleCount < items.length && !isLoading) {
      setIsLoading(true);
      
      // 로딩 시뮬레이션 (실제로는 API 호출 등)
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + loadMoreCount, items.length));
        setIsLoading(false);
      }, 300);
    }
  }, [isIntersecting, visibleCount, items.length, loadMoreCount, isLoading]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return {
    visibleItems,
    hasMore,
    isLoading,
    targetRef,
    loadMore: () => setVisibleCount(prev => Math.min(prev + loadMoreCount, items.length))
  };
};

export default useIntersectionObserver; 
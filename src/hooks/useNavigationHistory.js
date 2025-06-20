import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 스마트한 뒤로가기 네비게이션 관리 훅
 * - 히스토리 스택 추적
 * - 상태 보존
 * - 스크롤 위치 복원
 * - 폴백 경로 지원
 */
export const useNavigationHistory = (fallbackPath = '/') => {
  const navigate = useNavigate();
  const location = useLocation();
  const historyStack = useRef([]);
  const scrollPositions = useRef(new Map());

  // 히스토리 스택 업데이트
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // 중복 경로 방지
    if (historyStack.current[historyStack.current.length - 1] !== currentPath) {
      historyStack.current.push(currentPath);
      
      // 히스토리 스택 크기 제한 (메모리 최적화)
      if (historyStack.current.length > 10) {
        historyStack.current = historyStack.current.slice(-10);
      }
    }
  }, [location]);

  // 스크롤 위치 저장
  const saveScrollPosition = useCallback((path, position) => {
    scrollPositions.current.set(path, position);
  }, []);

  // 스크롤 위치 복원
  const restoreScrollPosition = useCallback((path) => {
    return scrollPositions.current.get(path) || 0;
  }, []);

  // 스마트 뒤로가기
  const handleSmartBack = useCallback((options = {}) => {
    const {
      fallback = fallbackPath,
      preserveScroll = true,
      stateToRestore = null
    } = options;

    // 현재 스크롤 위치 저장
    if (preserveScroll) {
      const currentPath = location.pathname + location.search;
      saveScrollPosition(currentPath, window.scrollY);
    }

    // 히스토리 스택에서 이전 경로 찾기
    const currentIndex = historyStack.current.length - 1;
    
    if (currentIndex > 0) {
      const previousPath = historyStack.current[currentIndex - 1];
      
      // 상태와 함께 이전 페이지로 이동
      navigate(previousPath, {
        state: stateToRestore,
        replace: false
      });

      // 스크롤 위치 복원 (약간의 지연으로 DOM 렌더링 완료 후)
      if (preserveScroll) {
        setTimeout(() => {
          const savedPosition = restoreScrollPosition(previousPath);
          window.scrollTo({
            top: savedPosition,
            behavior: 'auto' // 즉시 이동
          });
        }, 50);
      }
      
      // 히스토리 스택에서 현재 경로 제거
      historyStack.current.pop();
    } else {
      // 히스토리가 없으면 폴백 경로로 이동
      navigate(fallback, { replace: true });
    }
  }, [navigate, location, fallbackPath, saveScrollPosition, restoreScrollPosition]);

  // 브라우저 뒤로가기 감지
  useEffect(() => {
    const handlePopState = () => {
      // 브라우저 뒤로가기 시 히스토리 스택 동기화
      if (historyStack.current.length > 0) {
        historyStack.current.pop();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 현재 히스토리 정보 반환
  const getHistoryInfo = useCallback(() => {
    return {
      stackSize: historyStack.current.length,
      canGoBack: historyStack.current.length > 1,
      previousPath: historyStack.current[historyStack.current.length - 2] || null,
      currentPath: location.pathname + location.search
    };
  }, [location]);

  return {
    handleSmartBack,
    saveScrollPosition,
    restoreScrollPosition,
    getHistoryInfo,
    historyStack: historyStack.current
  };
};

/**
 * 채팅방 전용 뒤로가기 훅
 * - 채팅방 -> 채팅 목록 최적화
 * - 읽지 않은 메시지 상태 보존
 */
export const useChatNavigationHistory = () => {
  const { handleSmartBack, getHistoryInfo } = useNavigationHistory('/chat');

  const handleChatBack = useCallback((roomData = {}) => {
    const { unreadCount, lastReadMessageId } = roomData;
    
    handleSmartBack({
      fallback: '/chat',
      preserveScroll: true,
      stateToRestore: {
        from: 'chatroom',
        unreadCount,
        lastReadMessageId,
        timestamp: Date.now()
      }
    });
  }, [handleSmartBack]);

  return {
    handleChatBack,
    getHistoryInfo
  };
};

/**
 * 스크롤 위치 보존 훅
 * - 페이지 떠날 때 자동 저장
 * - 페이지 돌아올 때 자동 복원
 */
export const useScrollPreservation = (preserveKey) => {
  const location = useLocation();
  const { saveScrollPosition, restoreScrollPosition } = useNavigationHistory();

  // 페이지 떠날 때 스크롤 위치 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      const key = preserveKey || location.pathname;
      saveScrollPosition(key, window.scrollY);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.pathname, preserveKey, saveScrollPosition]);

  // 페이지 로드 시 스크롤 위치 복원
  useEffect(() => {
    if (location.state?.from) {
      const key = preserveKey || location.pathname;
      const savedPosition = restoreScrollPosition(key);
      
      if (savedPosition > 0) {
        setTimeout(() => {
          window.scrollTo({
            top: savedPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [location, preserveKey, restoreScrollPosition]);
}; 
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * 브라우저 뒤로가기 버튼 최적화 처리
 * - 뒤로가기 시 스크롤 위치 복원
 * - 채팅방에서 나갈 때 정리 작업
 * - 모달 닫기 등 컨텍스트별 처리
 */
const BrowserBackHandler = ({ 
  onBeforeBack, 
  shouldPreventDefault = false,
  scrollRestoration = true 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = async (event) => {
      // 브라우저 뒤로가기 감지
      console.log('🔙 브라우저 뒤로가기 감지:', location.pathname);

      // 뒤로가기 전 콜백 실행
      if (onBeforeBack) {
        const shouldProceed = await onBeforeBack(event);
        
        if (shouldProceed === false && shouldPreventDefault) {
          // 뒤로가기 취소 (history를 다시 앞으로 이동)
          event.preventDefault();
          window.history.pushState(null, '', location.pathname + location.search);
          return;
        }
      }

      // 스크롤 복원 처리
      if (scrollRestoration && event.state?.scrollPosition) {
        setTimeout(() => {
          window.scrollTo({
            top: event.state.scrollPosition,
            behavior: 'auto'
          });
        }, 50);
      }
    };

    // 현재 페이지 상태에 스크롤 위치 저장
    const saveCurrentState = () => {
      if (scrollRestoration) {
        const state = { 
          ...window.history.state,
          scrollPosition: window.scrollY,
          timestamp: Date.now()
        };
        window.history.replaceState(state, '', location.pathname + location.search);
      }
    };

    // 페이지 떠나기 전 스크롤 위치 저장
    const handleBeforeUnload = () => {
      saveCurrentState();
    };

    // 스크롤 시 주기적으로 상태 저장 (디바운스)
    let scrollTimer;
    const handleScroll = () => {
      if (scrollRestoration) {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(saveCurrentState, 100);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 초기 상태 저장
    saveCurrentState();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [location, onBeforeBack, shouldPreventDefault, scrollRestoration]);

  return null; // 렌더링 없음
};

/**
 * 채팅방 전용 뒤로가기 핸들러
 */
export const ChatRoomBackHandler = ({ roomId, onLeaveRoom }) => {
  const handleBeforeBack = async () => {
    console.log('🚪 채팅방 떠나기 처리 시작...');
    
    try {
      // 채팅방 나가기 전 정리 작업
      if (onLeaveRoom) {
        await onLeaveRoom();
      }
      
      // 추가 정리 작업들
      // - 읽음 상태 업데이트
      // - 실시간 리스너 정리
      // - 영상 플레이어 정지 등
      
      console.log('✅ 채팅방 나가기 완료');
      return true; // 뒤로가기 진행
    } catch (error) {
      console.error('❌ 채팅방 나가기 실패:', error);
      return true; // 에러가 있어도 뒤로가기 진행
    }
  };

  return (
    <BrowserBackHandler 
      onBeforeBack={handleBeforeBack}
      scrollRestoration={false} // 채팅방은 항상 하단 스크롤
    />
  );
};

/**
 * 모달 전용 뒤로가기 핸들러
 */
export const ModalBackHandler = ({ isOpen, onClose }) => {
  const handleBeforeBack = async () => {
    if (isOpen && onClose) {
      console.log('📱 모달 뒤로가기로 닫기');
      onClose();
      return false; // 실제 뒤로가기는 막고 모달만 닫기
    }
    return true;
  };

  return (
    <BrowserBackHandler 
      onBeforeBack={handleBeforeBack}
      shouldPreventDefault={isOpen} // 모달이 열려있을 때만 방지
      scrollRestoration={false}
    />
  );
};

export default BrowserBackHandler; 
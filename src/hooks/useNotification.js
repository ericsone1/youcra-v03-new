import { useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';

/**
 * useNotification()
 * - 브라우저 Notification + 소리 + 진동 한 번에 처리
 * - 첫 호출 시 자동 권한 요청(사용자 동작 후 권장)
 */
export default function useNotification() {
  const audioRef = useRef(null);
  const toast = useToast();

  // 오디오 객체 준비
  useEffect(() => {
    audioRef.current = new Audio('/sounds/ding.mp3');
    audioRef.current.volume = 0.6;
  }, []);

  /**
   * 새 알림 표시
   * @param {string} title - 알림 제목
   * @param {Object} opts - { body, icon, silent }
   */
  const send = (title = '새 알림', opts = {}) => {
    // 소리 (silent 아니면)
    if (!opts.silent && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      } catch (_) {}
    }

    // 진동 (모바일 지원 시)
    if (navigator.vibrate && !opts.silent) {
      navigator.vibrate(200);
    }

    // 브라우저 Notification
    if (!('Notification' in window)) return; // 지원 안함

    const show = () => {
      try {
        new Notification(title, opts);
      } catch (_) {}
    };

    if (Notification.permission === 'granted') {
      show();
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') show();
      });
    }

    if (toast) toast.addToast({ title, body: opts.body });
  };

  return send;
} 
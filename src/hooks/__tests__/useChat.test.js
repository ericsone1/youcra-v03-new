import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';
import { auth } from '../../firebase';

// Firebase 모킹
jest.mock('../../firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com'
    }
  },
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({
            name: '테스트 채팅방',
            createdAt: { seconds: Date.now() / 1000 }
          })
        })),
        onSnapshot: jest.fn()
      })),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          onSnapshot: jest.fn()
        }))
      }))
    }))
  }
}));

describe('useChat', () => {
  const roomId = 'test-room-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('채팅방 정보를 정상적으로 로드함', async () => {
    const { result } = renderHook(() => useChat(roomId));

    // 초기 상태 확인
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    // 비동기 작업 완료 대기
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // 로드 완료 후 상태 확인
    expect(result.current.loading).toBe(false);
    expect(result.current.roomInfo).toEqual({
      name: '테스트 채팅방',
      createdAt: expect.any(Object)
    });
  });

  test('메시지 전송 함수가 존재함', () => {
    const { result } = renderHook(() => useChat(roomId));
    expect(typeof result.current.sendMessage).toBe('function');
  });

  test('채팅방 입장/퇴장 함수가 존재함', () => {
    const { result } = renderHook(() => useChat(roomId));
    expect(typeof result.current.joinRoom).toBe('function');
    expect(typeof result.current.leaveRoom).toBe('function');
  });
}); 
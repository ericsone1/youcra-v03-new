import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChatRoom } from '../ChatRoom';
import { auth } from '../../../firebase';
import { useChat } from '../../../hooks/useChat';

// useChat 훅 모킹
jest.mock('../../../hooks/useChat', () => ({
  useChat: jest.fn()
}));

// Firebase auth 모킹
jest.mock('../../../firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com'
    },
    onAuthStateChanged: jest.fn(callback => {
      callback({ uid: 'test-user-id', email: 'test@example.com' });
      return () => {};
    })
  }
}));

describe('ChatRoom', () => {
  const mockUseChat = {
    loading: false,
    error: null,
    roomInfo: { name: '테스트 채팅방' },
    messages: [
      {
        id: '1',
        text: '안녕하세요',
        uid: 'test-user-id',
        email: 'test@example.com',
        createdAt: { seconds: Date.now() / 1000 }
      }
    ],
    participants: ['test-user-id'],
    myJoinedAt: { seconds: Date.now() / 1000 },
    sendMessage: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn()
  };

  beforeEach(() => {
    useChat.mockReturnValue(mockUseChat);
  });

  const renderWithRouter = (roomId = 'test-room-id') => {
    return render(
      <MemoryRouter initialEntries={[`/chat/${roomId}`]}>
        <Routes>
          <Route path="/chat/:roomId" element={<ChatRoom />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('채팅방이 정상적으로 렌더링됨', () => {
    renderWithRouter();
    expect(screen.getByText('테스트 채팅방')).toBeInTheDocument();
  });

  test('메시지가 정상적으로 표시됨', () => {
    renderWithRouter();
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
  });

  test('메시지 전송이 정상적으로 작동함', async () => {
    renderWithRouter();
    
    const input = screen.getByPlaceholderText('메시지를 입력하세요');
    const sendButton = screen.getByText('전송');

    fireEvent.change(input, { target: { value: '테스트 메시지' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockUseChat.sendMessage).toHaveBeenCalledWith('테스트 메시지');
    });
  });

  test('채팅방 입장 시 joinRoom이 호출됨', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(mockUseChat.joinRoom).toHaveBeenCalled();
    });
  });

  test('에러 상태가 정상적으로 표시됨', () => {
    useChat.mockReturnValue({
      ...mockUseChat,
      error: '채팅방을 불러올 수 없습니다.'
    });

    renderWithRouter();
    expect(screen.getByText('채팅방을 불러올 수 없습니다.')).toBeInTheDocument();
  });
}); 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  test('에러 메시지가 정상적으로 렌더링됨', () => {
    const message = '테스트 에러 메시지';
    render(<ErrorMessage message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  test('전체 화면 에러 메시지가 정상적으로 렌더링됨', () => {
    render(<ErrorMessage message="에러" fullScreen />);
    const container = screen.getByText('에러').parentElement.parentElement;
    expect(container).toHaveClass('h-screen');
  });

  test('재시도 버튼이 클릭되면 onRetry 함수가 호출됨', () => {
    const onRetry = jest.fn();
    render(<ErrorMessage message="에러" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
}); 
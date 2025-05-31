import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  test('기본 로딩 스피너가 정상적으로 렌더링됨', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('로딩중...')).toBeInTheDocument();
  });

  test('전체 화면 로딩 스피너가 정상적으로 렌더링됨', () => {
    render(<LoadingSpinner fullScreen />);
    const container = screen.getByText('로딩중...').parentElement;
    expect(container).toHaveClass('h-screen');
  });
}); 
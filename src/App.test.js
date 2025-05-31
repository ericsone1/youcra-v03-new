import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Firebase 모킹
jest.mock('./firebase');

// 컴포넌트 모킹
jest.mock('./components/Home', () => ({
  __esModule: true,
  default: () => <div>Home</div>
}));

jest.mock('./components/chat/ChatList', () => ({
  __esModule: true,
  default: () => <div>ChatList</div>
}));

jest.mock('./components/chat/ChatRoom', () => ({
  __esModule: true,
  default: () => <div>ChatRoom</div>
}));

jest.mock('./components/Report', () => ({
  __esModule: true,
  default: () => <div>Report</div>
}));

jest.mock('./components/auth/AuthForm', () => ({
  __esModule: true,
  default: () => <div>AuthForm</div>
}));

jest.mock('./components/common/Navigation', () => ({
  __esModule: true,
  default: () => <nav>Navigation</nav>
}));

describe('App', () => {
  test('renders navigation', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});

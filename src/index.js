import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 개발 모드에서 특정 경고들 필터링
if (process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    // FedCM 관련 경고들 필터링
    if (message.includes('FedCM') || 
        message.includes('fedcm') || 
        message.includes('identity credential') ||
        message.includes('One Tap prompt')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

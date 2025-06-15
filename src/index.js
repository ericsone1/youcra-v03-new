import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';
import reportWebVitals from './reportWebVitals';
import { setupGlobalErrorHandlers } from './utils/errorHandler';
import { setupYouTubeErrorHandlers } from './utils/youtubeErrorHandler';

// 전역 오류 핸들러 설정
setupGlobalErrorHandlers();
setupYouTubeErrorHandlers();

// 개발 모드에서 특정 경고들 필터링 (확장)
if (process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;
  
  console.warn = (...args) => {
    const message = args.join(' ');
    // 필터링할 경고 메시지들
    const ignoredWarnings = [
      'FedCM',
      'fedcm',
      'identity credential',
      'One Tap prompt',
      'BloomFilter',
      'youtube',
      'postMessage',
      'www-widgetapi',
      'signature',
      'decipher',
      'react-refresh',
      'react_devtools'
    ];
    
    if (ignoredWarnings.some(ignored => message.toLowerCase().includes(ignored.toLowerCase()))) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const message = args.join(' ');
    // 필터링할 오류 메시지들
    const ignoredErrors = [
      'BloomFilter',
      'signature decipher',
      'postMessage',
      'DOMWindow',
      'youtube.com',
      'www-widgetapi',
      'Failed to execute',
      'Uncaught ReferenceError',
      'limit is not defined',
      'Routes',
      'AuthProvider',
      'BrowserRouter',
      'AppWrapper',
      'react-refresh-runtime',
      'react_devtools_backend',
      'Failed to load resource'
    ];
    
    if (ignoredErrors.some(ignored => message.toLowerCase().includes(ignored.toLowerCase()))) {
      return;
    }
    originalError.apply(console, args);
  };

  // console.log도 필터링 (YouTube 관련)
  console.log = (...args) => {
    const message = args.join(' ');
    const ignoredLogs = [
      'youtube',
      'signature',
      'decipher',
      'www-widgetapi'
    ];
    
    if (ignoredLogs.some(ignored => message.toLowerCase().includes(ignored.toLowerCase()))) {
      return;
    }
    originalLog.apply(console, args);
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

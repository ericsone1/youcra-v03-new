import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestBlog = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      color: 'white', 
      padding: '50px', 
      textAlign: 'center',
      minHeight: '100vh',
      fontSize: '20px'
    }}>
      <h1>🎉 블로그 라우팅 성공!</h1>
      <p>현재 URL: {window.location.href}</p>
      <p>블로그 페이지가 정상적으로 로드되었습니다!</p>
      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={() => navigate('/my')}
          style={{
            background: 'white',
            color: '#667eea',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginRight: '15px'
          }}
        >
          ← 마이채널로 돌아가기
        </button>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            padding: '15px 30px',
            border: '2px solid white',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🏠 홈으로
        </button>
      </div>
    </div>
  );
};

export default TestBlog; 
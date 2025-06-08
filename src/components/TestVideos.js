import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestVideos = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', 
      color: 'white', 
      padding: '50px', 
      textAlign: 'center',
      minHeight: '100vh',
      fontSize: '20px'
    }}>
      <h1>🎬 내 영상 페이지 테스트!</h1>
      <p>현재 URL: {window.location.href}</p>
      <p>영상 페이지가 정상적으로 로드되었습니다!</p>
      
      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={() => navigate('/my')}
          style={{
            background: 'white',
            color: '#ff6b6b',
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

      <div style={{ marginTop: '40px', fontSize: '16px' }}>
        <p>✅ 라우팅 정상 작동</p>
        <p>✅ 컴포넌트 로드 성공</p>
        <p>✅ HashRouter 지원</p>
      </div>
    </div>
  );
};

export default TestVideos; 
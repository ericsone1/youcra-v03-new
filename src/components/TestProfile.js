import React from 'react';

function TestProfile() {
  return (
    <div style={{ 
      background: 'red', 
      color: 'white', 
      padding: '20px', 
      textAlign: 'center',
      minHeight: '100vh'
    }}>
      <h1>🎉 테스트 프로필 페이지 작동!</h1>
      <p>URL: {window.location.href}</p>
      <p>이 페이지가 보이면 라우팅이 작동하고 있습니다!</p>
    </div>
  );
}

export default TestProfile; 
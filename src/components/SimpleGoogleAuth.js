import React, { useEffect } from 'react';

function SimpleGoogleAuth() {
  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    console.log('=== 디버깅 정보 ===');
    console.log('CLIENT_ID:', CLIENT_ID);
    console.log('Origin:', window.location.origin);
    
    // 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      console.log('Google 스크립트 로드됨');
      
      // 간단한 초기화
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            console.log('로그인 성공!', response);
            alert('로그인 성공!');
          }
        });
        
        // 버튼 렌더링
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large' }
        );
      }
    };
    document.head.appendChild(script);
  }, [CLIENT_ID]);

  return (
    <div>
      <h2>간단한 Google 인증 테스트</h2>
      <div id="google-signin-button"></div>
    </div>
  );
}

export default SimpleGoogleAuth; 
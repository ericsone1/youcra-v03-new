import React from 'react';
import AdminDeleteAllChatRooms from './AdminDeleteAllChatRooms';
import DummyRoomGenerator from './DummyRoomGenerator';

export default function AdminPage() {
  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001' }}>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#d00' }}>관리자 페이지</h1>
      <p style={{ marginBottom: 32, color: '#555' }}>
        이 페이지는 관리자만 접근할 수 있습니다.<br />
        아래 버튼을 누르면 <b>모든 채팅방 및 하위 데이터가 완전히 삭제</b>됩니다.<br />
        <span style={{ color: '#d00', fontWeight: 'bold' }}>되돌릴 수 없으니 신중히 사용하세요!</span>
      </p>
      <AdminDeleteAllChatRooms />
      <hr style={{ margin: '32px 0', border: 0, borderTop: '1px solid #eee' }} />
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#007bff' }}>더미 채팅방 예시</h2>
      <ul style={{ marginBottom: 16, color: '#333', fontSize: 15, lineHeight: 1.7 }}>
        <li>1. 유머/일상 유튜버방</li>
        <li>2. 시니어 타겟 방</li>
        <li>3. 10~20대 타겟 채널 유튜버 방</li>
        <li>4. 썰채널 유튜버방</li>
        <li>5. 주식/경제/부동산 채널 유튜버방</li>
        <li>6. 먹방/쿡방 유튜버방</li>
        <li>7. 게임 유튜버방</li>
        <li>8. 브이로그 유튜버방</li>
        <li>9. 여행/캠핑 유튜버방</li>
        <li>10. IT/테크 유튜버방</li>
        <li>11. 패션/뷰티 유튜버방</li>
        <li>12. 음악/커버 유튜버방</li>
        <li>13. 운동/헬스 유튜버방</li>
        <li>14. 교육/공부 유튜버방</li>
        <li>15. 반려동물 유튜버방</li>
      </ul>
      <DummyRoomGenerator />
    </div>
  );
} 
import React from 'react';
import AdminDeleteAllChatRooms from './AdminDeleteAllChatRooms';

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
    </div>
  );
} 
import React from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; // 이미 src/components/firebase.js에 db가 있습니다.

async function deleteCollectionDocs(colRef) {
  const snap = await getDocs(colRef);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
}

async function deleteAllChatRoomsCompletely() {
  const roomsSnap = await getDocs(collection(db, 'chatRooms'));
  for (const roomDoc of roomsSnap.docs) {
    const roomId = roomDoc.id;
    // 하위 컬렉션 삭제
    await deleteCollectionDocs(collection(db, 'chatRooms', roomId, 'messages'));
    await deleteCollectionDocs(collection(db, 'chatRooms', roomId, 'participants'));
    await deleteCollectionDocs(collection(db, 'chatRooms', roomId, 'videos'));
    // 방 document 삭제
    await deleteDoc(doc(db, 'chatRooms', roomId));
  }
  alert('모든 채팅방 및 하위 데이터가 완전히 삭제되었습니다!');
}

export default function AdminDeleteAllChatRooms() {
  return (
    <button
      style={{ padding: 16, background: 'red', color: 'white', fontWeight: 'bold', borderRadius: 8 }}
      onClick={async () => {
        if (window.confirm('정말 모든 채팅방과 하위 데이터를 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
          await deleteAllChatRoomsCompletely();
        }
      }}
    >
      모든 채팅방 완전 삭제
    </button>
  );
} 
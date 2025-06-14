import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export const useParticipants = (roomId, isOwner, myUid, myEmail) => {
  const [participants, setParticipants] = useState([]);
  
  // 방장 이양 관련 상태
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferUser, setSelectedTransferUser] = useState(null);
  const [transferConfirmText, setTransferConfirmText] = useState('');
  const [transferringOwnership, setTransferringOwnership] = useState(false);

  // 참여자 실시간 구독
  useEffect(() => {
    if (!roomId || !isOwner) return;

    const q = query(collection(db, 'chatRooms', roomId, 'participants'));
    const unsub = onSnapshot(q, (snapshot) => {
      const participantsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setParticipants(participantsList);
    });

    return () => unsub();
  }, [roomId, isOwner]);

  // 시간 포맷팅
  const formatJoinTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 참여자 강퇴
  const handleKickParticipant = async (participantId, participantEmail) => {
    if (!window.confirm('정말 이 사용자를 강퇴하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'chatRooms', roomId, 'participants', participantId));
      alert('강퇴되었습니다.');
    } catch (error) {
      console.error('강퇴 오류:', error);
      alert('강퇴에 실패했습니다.');
    }
  };

  // 방장 이양
  const handleTransferOwnership = async () => {
    if (!selectedTransferUser || transferConfirmText !== '방장이양') {
      alert('확인 텍스트를 정확히 입력해주세요.');
      return;
    }

    setTransferringOwnership(true);
    try {
      // 방 소유자 변경
      await updateDoc(doc(db, 'chatRooms', roomId), {
        createdBy: selectedTransferUser.id,
        createdByEmail: selectedTransferUser.email,
        transferredAt: serverTimestamp(),
        previousOwner: myUid,
        previousOwnerEmail: myEmail
      });

      alert('방장이 이양되었습니다.');
      window.location.href = `/chat/${roomId}`;
    } catch (error) {
      console.error('방장 이양 오류:', error);
      alert('방장 이양에 실패했습니다.');
    } finally {
      setTransferringOwnership(false);
    }
  };

  // 방장 이양 취소
  const handleCancelTransfer = () => {
    setShowTransferModal(false);
    setSelectedTransferUser(null);
    setTransferConfirmText('');
  };

  return {
    participants,
    showTransferModal,
    setShowTransferModal,
    selectedTransferUser,
    setSelectedTransferUser,
    transferConfirmText,
    setTransferConfirmText,
    transferringOwnership,
    formatJoinTime,
    handleKickParticipant,
    handleTransferOwnership,
    handleCancelTransfer
  };
}; 
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDoc 
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
    const unsub = onSnapshot(q, async (snapshot) => {
      try {
        const participantsList = await Promise.all(
          snapshot.docs.map(async (participantDoc) => {
            const uid = participantDoc.id;
            const participantData = participantDoc.data();
            
            // 사용자 정보 가져오기
            try {
              const userRef = doc(db, 'users', uid);
              const userSnapshot = await getDoc(userRef);
              
              if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                return {
                  id: uid,
                  email: userData.email || participantData.email || '이메일 없음',
                  displayName: userData.nickname || userData.displayName || userData.nick || userData.name || userData.email?.split('@')[0] || '익명',
                  avatar: userData.photoURL || userData.profileImage || null,
                  joinedAt: participantData.joinedAt,
                  role: participantData.role || 'member',
                  isOnline: participantData.isOnline || false,
                  // 기존 participantData의 다른 필드들도 유지
                  ...participantData
                };
              }
            } catch (userError) {
              console.error('사용자 정보 로딩 실패:', userError);
            }
            
            // 사용자 정보를 찾을 수 없는 경우 기본값 반환
            return {
              id: uid,
              email: participantData.email || '이메일 정보 없음',
              displayName: participantData.displayName || uid.slice(0, 8) + '...',
              avatar: null,
              joinedAt: participantData.joinedAt,
              role: participantData.role || 'member',
              isOnline: participantData.isOnline || false,
              ...participantData
            };
          })
        );
        
        setParticipants(participantsList);
      } catch (error) {
        console.error('참여자 목록 로딩 실패:', error);
      }
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
    if (!selectedTransferUser) {
      alert('위임할 사용자를 선택해주세요.');
      return;
    }

    if (transferConfirmText !== '권한 위임') {
      alert('"권한 위임"을 정확히 입력해주세요.');
      return;
    }

    // 선택된 사용자 정보 검증
    const userEmail = selectedTransferUser.email || selectedTransferUser.displayName || '선택된 사용자';
    

    // 최종 확인
    if (!window.confirm(`정말로 ${userEmail}님에게 방장 권한을 위임하시겠습니까?\n\n⚠️ 이 작업 후에는 방 관리 권한을 잃게 됩니다!`)) {
      return;
    }

    setTransferringOwnership(true);
    try {
      // 안전한 이메일 값 확보
      const newOwnerEmail = selectedTransferUser.email || selectedTransferUser.displayName || `user_${selectedTransferUser.id}`;
      
      // 방 소유자 변경
      const updateData = {
        createdBy: selectedTransferUser.id,
        transferredAt: serverTimestamp(),
        previousOwner: myUid,
        previousOwnerEmail: myEmail
      };

      // 이메일이 유효할 때만 이메일 필드 추가
      if (selectedTransferUser.email) {
        updateData.createdByEmail = selectedTransferUser.email;
        updateData.ownerEmail = selectedTransferUser.email;
      }

      await updateDoc(doc(db, 'chatRooms', roomId), updateData);

      alert(`${userEmail}님에게 방장 권한이 위임되었습니다.`);
      
      // 일반 채팅방으로 리다이렉션 (더 이상 방장이 아니므로)
      window.location.href = `/chat/${roomId}`;
    } catch (error) {
      console.error('방장 이양 오류:', error);
      alert('방장 이양에 실패했습니다: ' + error.message);
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
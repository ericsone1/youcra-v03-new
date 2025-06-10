import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";

export const useParticipants = (roomId, isOwner, myUid, myEmail) => {
  const [participants, setParticipants] = useState([]);
  
  // 권한 위임 관련 상태
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferUser, setSelectedTransferUser] = useState(null);
  const [transferConfirmText, setTransferConfirmText] = useState("");
  const [transferringOwnership, setTransferringOwnership] = useState(false);

  // 참여자 목록 실시간 구독
  useEffect(() => {
    if (!roomId || !isOwner) return;
    
    const participantsQuery = query(
      collection(db, "chatRooms", roomId, "participants"), 
      orderBy("joinedAt", "desc")
    );
    
    const unsubParticipants = onSnapshot(participantsQuery, (snapshot) => {
      const participantsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setParticipants(participantsList);
    });

    return () => unsubParticipants();
  }, [roomId, isOwner]);

  // 시간 포맷팅 함수
  const formatJoinTime = (timestamp) => {
    if (!timestamp) return "알 수 없음";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
    return `${Math.floor(diffMins / 1440)}일 전`;
  };

  // 참여자 강퇴
  const handleKickParticipant = async (participantId, participantEmail) => {
    if (participantId === myUid) {
      alert("자기 자신은 강퇴할 수 없습니다.");
      return;
    }

    if (!window.confirm(`정말 ${participantEmail}님을 강퇴하시겠습니까?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "participants", participantId));
      alert(`${participantEmail}님이 강퇴되었습니다.`);
    } catch (error) {
      console.error("강퇴 중 오류:", error);
      alert("강퇴 중 오류가 발생했습니다.");
    }
  };

  // 권한 위임
  const handleTransferOwnership = async () => {
    if (!selectedTransferUser) {
      alert("권한을 위임할 사용자를 선택해주세요.");
      return;
    }

    if (transferConfirmText !== "권한 위임") {
      alert('"권한 위임"을 정확히 입력해주세요.');
      return;
    }

    setTransferringOwnership(true);
    try {
      // 방장 권한 이전
      await updateDoc(doc(db, "chatRooms", roomId), {
        createdBy: selectedTransferUser.id,
        ownerEmail: selectedTransferUser.email,
        transferredAt: new Date(),
        previousOwner: myUid
      });

      alert(`${selectedTransferUser.email}님에게 방장 권한이 위임되었습니다.`);
      
      // 일반 채팅방으로 리다이렉션
      window.location.href = `/chat/${roomId}`;
    } catch (error) {
      console.error("권한 위임 중 오류:", error);
      alert("권한 위임 중 오류가 발생했습니다.");
    } finally {
      setTransferringOwnership(false);
    }
  };

  // 권한 위임 취소
  const handleCancelTransfer = () => {
    setShowTransferModal(false);
    setSelectedTransferUser(null);
    setTransferConfirmText("");
  };

  return {
    // 상태
    participants,
    
    // 권한 위임 상태
    showTransferModal,
    setShowTransferModal,
    selectedTransferUser,
    setSelectedTransferUser,
    transferConfirmText,
    setTransferConfirmText,
    transferringOwnership,
    
    // 함수
    formatJoinTime,
    handleKickParticipant,
    handleTransferOwnership,
    handleCancelTransfer
  };
}; 
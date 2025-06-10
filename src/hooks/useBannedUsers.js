import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc } from "firebase/firestore";

export const useBannedUsers = (roomId, isOwner, myUid, myEmail) => {
  const [bannedUsers, setBannedUsers] = useState([]);
  
  // 차단 관련 상태
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedBanUser, setSelectedBanUser] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);

  // 차단된 사용자 목록 실시간 구독
  useEffect(() => {
    if (!roomId || !isOwner) return;
    
    const bannedQuery = query(
      collection(db, "chatRooms", roomId, "banned"), 
      orderBy("bannedAt", "desc")
    );
    
    const unsubBanned = onSnapshot(bannedQuery, (snapshot) => {
      const bannedList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setBannedUsers(bannedList);
    });

    return () => unsubBanned();
  }, [roomId, isOwner]);

  // 참여자 차단
  const handleBanUser = async () => {
    if (!selectedBanUser) {
      alert("차단할 사용자를 선택해주세요.");
      return;
    }

    if (!banReason.trim()) {
      alert("차단 사유를 입력해주세요.");
      return;
    }

    setBanning(true);
    try {
      // 1. 차단 목록에 추가
      await setDoc(doc(db, "chatRooms", roomId, "banned", selectedBanUser.id), {
        email: selectedBanUser.email,
        uid: selectedBanUser.id,
        bannedBy: myUid,
        bannedByEmail: myEmail,
        bannedAt: new Date(),
        reason: banReason.trim(),
        originalJoinedAt: selectedBanUser.joinedAt
      });

      // 2. 참여자 목록에서 제거
      await deleteDoc(doc(db, "chatRooms", roomId, "participants", selectedBanUser.id));

      alert(`${selectedBanUser.email}님이 차단되었습니다.`);
      handleCancelBan();
    } catch (error) {
      console.error("차단 중 오류:", error);
      alert("차단 중 오류가 발생했습니다.");
    } finally {
      setBanning(false);
    }
  };

  // 차단 해제
  const handleUnbanUser = async (bannedUser) => {
    if (!window.confirm(`정말 ${bannedUser.email}님의 차단을 해제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "banned", bannedUser.id));
      alert(`${bannedUser.email}님의 차단이 해제되었습니다.`);
    } catch (error) {
      console.error("차단 해제 중 오류:", error);
      alert("차단 해제 중 오류가 발생했습니다.");
    }
  };

  // 차단 모달 취소
  const handleCancelBan = () => {
    setShowBanModal(false);
    setSelectedBanUser(null);
    setBanReason("");
  };

  return {
    // 상태
    bannedUsers,
    
    // 차단 모달 상태
    showBanModal,
    setShowBanModal,
    selectedBanUser,
    setSelectedBanUser,
    banReason,
    setBanReason,
    banning,
    
    // 함수
    handleBanUser,
    handleUnbanUser,
    handleCancelBan
  };
}; 
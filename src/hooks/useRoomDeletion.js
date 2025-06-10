import { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export const useRoomDeletion = (roomId, roomData, navigate) => {
  // 방 삭제 관련 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deletingRoom, setDeletingRoom] = useState(false);

  // 방 삭제
  const handleDeleteRoom = async () => {
    if (deleteConfirmName !== roomData?.name) {
      alert("방 이름이 정확하지 않습니다.");
      return;
    }

    if (!window.confirm("정말로 이 채팅방을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setDeletingRoom(true);
    try {
      // 1. 모든 메시지 삭제
      const messagesSnapshot = await getDocs(collection(db, "chatRooms", roomId, "messages"));
      const messageDeletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // 2. 모든 참여자 삭제
      const participantsSnapshot = await getDocs(collection(db, "chatRooms", roomId, "participants"));
      const participantDeletePromises = participantsSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // 3. 모든 영상 삭제
      const videosSnapshot = await getDocs(collection(db, "chatRooms", roomId, "videos"));
      const videoDeletePromises = videosSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // 4. 모든 차단 사용자 삭제
      const bannedSnapshot = await getDocs(collection(db, "chatRooms", roomId, "banned"));
      const bannedDeletePromises = bannedSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // 5. 모든 공지사항 삭제
      const announcementsSnapshot = await getDocs(collection(db, "chatRooms", roomId, "announcements"));
      const announcementDeletePromises = announcementsSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // 모든 서브컬렉션 삭제 대기
      await Promise.all([
        ...messageDeletePromises,
        ...participantDeletePromises,
        ...videoDeletePromises,
        ...bannedDeletePromises,
        ...announcementDeletePromises
      ]);

      // 6. 채팅방 자체 삭제
      await deleteDoc(doc(db, "chatRooms", roomId));

      alert("채팅방이 완전히 삭제되었습니다.");
      navigate("/chat");
    } catch (error) {
      console.error("방 삭제 중 오류:", error);
      alert("방 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingRoom(false);
    }
  };

  // 삭제 취소
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmName("");
  };

  return {
    // 상태
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteConfirmName,
    setDeleteConfirmName,
    deletingRoom,
    
    // 함수
    handleDeleteRoom,
    handleCancelDelete
  };
}; 
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";

export const useAnnouncements = (roomId, isOwner, myUid, myEmail) => {
  const [announcements, setAnnouncements] = useState([]);
  
  // 공지사항 모달 상태
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementImportant, setAnnouncementImportant] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // 공지사항 목록 실시간 구독
  useEffect(() => {
    if (!roomId || !isOwner) return;
    
    const announcementsQuery = query(
      collection(db, "chatRooms", roomId, "announcements"), 
      orderBy("createdAt", "desc")
    );
    
    const unsubAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      const announcementsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsList);
    });

    return () => unsubAnnouncements();
  }, [roomId, isOwner]);

  // 공지사항 저장
  const handleSaveAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      alert("공지사항 제목을 입력해주세요.");
      return;
    }

    if (!announcementContent.trim()) {
      alert("공지사항 내용을 입력해주세요.");
      return;
    }

    setSavingAnnouncement(true);
    try {
      const announcementData = {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        important: announcementImportant,
        createdBy: myUid,
        createdByEmail: myEmail,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingAnnouncement) {
        // 기존 공지사항 수정
        await updateDoc(doc(db, "chatRooms", roomId, "announcements", editingAnnouncement.id), {
          ...announcementData,
          createdAt: editingAnnouncement.createdAt // 생성일은 유지
        });
        alert("공지사항이 수정되었습니다.");
      } else {
        // 새 공지사항 추가
        await setDoc(doc(collection(db, "chatRooms", roomId, "announcements")), announcementData);
        alert("공지사항이 등록되었습니다.");
      }

      handleCancelAnnouncement();
    } catch (error) {
      console.error("공지사항 저장 중 오류:", error);
      alert("공지사항 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // 공지사항 삭제
  const handleDeleteAnnouncement = async (announcementId, title) => {
    if (!window.confirm(`정말 "${title}" 공지사항을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "announcements", announcementId));
      alert("공지사항이 삭제되었습니다.");
    } catch (error) {
      console.error("공지사항 삭제 중 오류:", error);
      alert("공지사항 삭제 중 오류가 발생했습니다.");
    }
  };

  // 공지사항 편집 시작
  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementTitle(announcement.title);
    setAnnouncementContent(announcement.content);
    setAnnouncementImportant(announcement.important || false);
    setShowAnnouncementModal(true);
  };

  // 공지사항 모달 취소
  const handleCancelAnnouncement = () => {
    setShowAnnouncementModal(false);
    setEditingAnnouncement(null);
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementImportant(false);
  };

  // 공지사항 중요도 토글
  const handleToggleImportant = async (announcementId, currentImportant) => {
    try {
      await updateDoc(doc(db, "chatRooms", roomId, "announcements", announcementId), {
        important: !currentImportant,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("중요도 변경 중 오류:", error);
      alert("중요도 변경 중 오류가 발생했습니다.");
    }
  };

  return {
    // 상태
    announcements,
    
    // 모달 상태
    showAnnouncementModal,
    setShowAnnouncementModal,
    editingAnnouncement,
    announcementTitle,
    setAnnouncementTitle,
    announcementContent,
    setAnnouncementContent,
    announcementImportant,
    setAnnouncementImportant,
    savingAnnouncement,
    
    // 함수
    handleSaveAnnouncement,
    handleDeleteAnnouncement,
    handleEditAnnouncement,
    handleCancelAnnouncement,
    handleToggleImportant
  };
}; 
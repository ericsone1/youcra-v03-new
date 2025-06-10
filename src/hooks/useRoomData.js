import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export const useRoomData = (roomId, navigate) => {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 방 설정 편집 상태
  const [editingSettings, setEditingSettings] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDesc, setEditedDesc] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [editedMaxParticipants, setEditedMaxParticipants] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);

  // 방장 확인 로직
  const myEmail = auth.currentUser?.email;
  const myUid = auth.currentUser?.uid;
  const isOwner = roomData && myUid && (
    roomData.createdBy === myUid ||
    roomData.ownerEmail === myEmail
  );

  // 채팅방 정보 및 권한 확인
  useEffect(() => {
    if (!roomId || !auth.currentUser) return;

    const fetchRoomData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        if (roomDoc.exists()) {
          const data = roomDoc.data();
          setRoomData(data);
          
          // 편집 폼 초기값 설정
          setEditedName(data.name || "");
          setEditedDesc(data.desc || "");
          setEditedHashtags(data.hashtags ? data.hashtags.join(" #") : "");
          setEditedMaxParticipants(data.maxParticipants || 10);
          
          // 방장이 아니면 접근 차단
          const isOwnerCheck = myUid && (
            data.createdBy === myUid || 
            data.ownerEmail === myEmail
          );
          
          if (!isOwnerCheck) {
            alert("방장만 접근할 수 있습니다.");
            navigate(`/chat/${roomId}`);
            return;
          }
        } else {
          alert("채팅방을 찾을 수 없습니다.");
          navigate("/chat");
          return;
        }
      } catch (error) {
        console.error("방 정보 확인 오류:", error);
        alert("방 정보를 확인할 수 없습니다.");
        navigate(`/chat/${roomId}`);
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, navigate, myEmail, myUid]);

  // 해시태그 파싱 함수
  const parseHashtags = (hashtagString) => {
    if (!hashtagString.trim()) return [];
    return hashtagString
      .split(/\s+/)
      .map(tag => tag.replace(/^#+/, '').trim())
      .filter(tag => tag.length > 0);
  };

  // 방 설정 저장
  const handleSaveSettings = async () => {
    if (!editedName.trim()) {
      alert("방 이름을 입력해주세요.");
      return;
    }

    if (editedMaxParticipants < 1 || editedMaxParticipants > 100) {
      alert("최대 참여자 수는 1~100명 사이여야 합니다.");
      return;
    }

    setSavingSettings(true);
    try {
      const updatedData = {
        name: editedName.trim(),
        desc: editedDesc.trim(),
        hashtags: parseHashtags(editedHashtags),
        maxParticipants: editedMaxParticipants
      };

      await updateDoc(doc(db, "chatRooms", roomId), updatedData);
      
      // 로컬 상태 업데이트
      setRoomData(prev => ({
        ...prev,
        ...updatedData
      }));
      
      setEditingSettings(false);
      alert("방 설정이 저장되었습니다.");
    } catch (error) {
      console.error("방 설정 저장 오류:", error);
      alert("방 설정 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingSettings(false);
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingSettings(false);
    // 원래 값으로 복원
    setEditedName(roomData?.name || "");
    setEditedDesc(roomData?.desc || "");
    setEditedHashtags(roomData?.hashtags ? roomData.hashtags.join(" #") : "");
    setEditedMaxParticipants(roomData?.maxParticipants || 10);
  };

  return {
    // 상태
    roomData,
    loading,
    isOwner,
    myEmail,
    myUid,
    
    // 편집 상태
    editingSettings,
    setEditingSettings,
    editedName,
    setEditedName,
    editedDesc,
    setEditedDesc,
    editedHashtags,
    setEditedHashtags,
    editedMaxParticipants,
    setEditedMaxParticipants,
    savingSettings,
    
    // 함수
    handleSaveSettings,
    handleCancelEdit,
    parseHashtags
  };
};

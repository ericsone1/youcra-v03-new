import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const useRoomData = (roomId, navigate) => {
  const [loading, setLoading] = useState(true);
  const [roomData, setRoomData] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [myUid, setMyUid] = useState('');
  const [myEmail, setMyEmail] = useState('');
  
  // 방 설정 편집 상태
  const [editingSettings, setEditingSettings] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [editedHashtags, setEditedHashtags] = useState('');
  const [editedMaxParticipants, setEditedMaxParticipants] = useState(20);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    let unsubscribe = null;
    
    const checkOwnership = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        setMyUid(user.uid);
        setMyEmail(user.email);

        const roomDoc = await getDoc(doc(db, 'chatRooms', roomId));
        if (!roomDoc.exists()) {
          alert('존재하지 않는 채팅방입니다.');
          navigate('/chat');
          return;
        }

        const data = roomDoc.data();
        setRoomData(data);

        if (data.createdBy !== user.uid) {
          alert('방장만 접근할 수 있습니다.');
          navigate(`/chat/${roomId}`);
          return;
        }

        setIsOwner(true);
        setEditedName(data.name || '');
        setEditedDesc(data.description || '');
        setEditedHashtags((data.hashtags || []).join(', '));
        setEditedMaxParticipants(data.maxParticipants || 20);

        // 실시간 방 데이터 구독 시작 (방장 권한 확인 후)
        unsubscribe = onSnapshot(doc(db, 'chatRooms', roomId), (doc) => {
          if (doc.exists()) {
            const updatedData = doc.data();
            setRoomData(updatedData);
            console.log('🔄 방 데이터 실시간 업데이트:', updatedData.watchSettings);
          }
        });
      } catch (error) {
        console.error('권한 확인 오류:', error);
        navigate('/chat');
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      checkOwnership();
    }

    // cleanup: 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [roomId, navigate]);

  const handleSaveSettings = async () => {
    if (savingSettings) return;
    
    setSavingSettings(true);
    try {
      const updates = {
        name: editedName.trim(),
        description: editedDesc.trim(),
        hashtags: editedHashtags.split(',').map(tag => tag.trim()).filter(tag => tag),
        maxParticipants: parseInt(editedMaxParticipants)
      };

      await updateDoc(doc(db, 'chatRooms', roomId), updates);
      setRoomData(prev => ({ ...prev, ...updates }));
      setEditingSettings(false);
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 오류:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(roomData?.name || '');
    setEditedDesc(roomData?.description || '');
    setEditedHashtags((roomData?.hashtags || []).join(', '));
    setEditedMaxParticipants(roomData?.maxParticipants || 20);
    setEditingSettings(false);
  };

  return {
    loading,
    roomData,
    isOwner,
    myUid,
    myEmail,
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
    handleSaveSettings,
    handleCancelEdit
  };
}; 
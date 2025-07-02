import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { updateUserProfile, getUserProfile } from '../../../services/userService';

export function useHomeChannelState() {
  const { currentUser } = useAuth();
  const [channelRegistered, setChannelRegistered] = useState(false);
  const [channelInfo, setChannelInfo] = useState(null);

  const handleChannelRegister = async (info) => {
    setChannelRegistered(true);
    setChannelInfo(info);
    // Firestore에 저장
    if (currentUser?.uid) {
      await updateUserProfile(currentUser.uid, { channelInfo: info });
    }
  };

  const handleChannelDelete = async () => {
    if (window.confirm('정말로 채널을 삭제하시겠습니까? 등록된 모든 정보가 삭제됩니다.')) {
      setChannelRegistered(false);
      setChannelInfo(null);
      // Firestore에서도 삭제
      if (currentUser?.uid) {
        await updateUserProfile(currentUser.uid, { 
          channelInfo: null,
          categories: null // 카테고리도 함께 삭제
        });
      }
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      getUserProfile(currentUser.uid).then(profile => {
        if (profile?.channelInfo) {
          setChannelRegistered(true);
          setChannelInfo(profile.channelInfo);
        }
      });
    }
  }, [currentUser]);

  return {
    channelRegistered,
    setChannelRegistered,
    channelInfo,
    setChannelInfo,
    handleChannelRegister,
    handleChannelDelete,
  };
} 
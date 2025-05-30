import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  validateChannelLink,
} from '../services/userService';

export function useProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    nickname: "",
    profileImage: "",
    email: "",
    uid: "",
    point: 0,
    channelLink: "",
  });

  // 프로필 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getUserProfile(auth.currentUser.uid);
        if (userData) {
          setProfile({
            ...userData,
            email: auth.currentUser.email,
            uid: auth.currentUser.uid,
          });
        }
      } catch (err) {
        setError("프로필을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // 프로필 업데이트
  const updateProfile = async (newData) => {
    if (!auth.currentUser) throw new Error("로그인이 필요합니다.");

    try {
      setLoading(true);
      
      // 채널 링크 유효성 검사
      if (newData.channelLink && !validateChannelLink(newData.channelLink)) {
        throw new Error("유효한 유튜브 채널 링크가 아닙니다.");
      }

      await updateUserProfile(auth.currentUser.uid, newData);
      setProfile(prev => ({ ...prev, ...newData }));
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 프로필 이미지 업데이트
  const updateProfileImage = async (imageFile) => {
    if (!auth.currentUser) throw new Error("로그인이 필요합니다.");
    if (!imageFile) throw new Error("이미지 파일이 필요합니다.");

    try {
      setLoading(true);
      const imageUrl = await uploadProfileImage(auth.currentUser.uid, imageFile);
      await updateProfile({ profileImage: imageUrl });
      return imageUrl;
    } catch (err) {
      setError("프로필 이미지 업로드에 실패했습니다.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    profile,
    updateProfile,
    updateProfileImage,
  };
} 
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { updateUserProfile, getUserProfile } from '../../../services/userService';

export function useHomeVideoSelectionState() {
  const { currentUser } = useAuth();
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [isVideoSelectionCompleted, setIsVideoSelectionCompleted] = useState(false);

  const handleVideoSelection = async (videos) => {
    setSelectedVideos(videos);
    
    // 영상 선택/해제 시에는 완료 상태를 변경하지 않음
    // 완료 상태는 handleVideoSelectionComplete에서만 처리
    
    // Firestore에 영상 목록만 저장 (완료 상태는 건드리지 않음)
    if (currentUser?.uid) {
      await updateUserProfile(currentUser.uid, { 
        myVideos: videos
      });
    }
  };

  // 영상 선택 완료 처리 (선택 완료 버튼 클릭 시에만 호출)
  const handleVideoSelectionComplete = async (videos) => {
    setSelectedVideos(videos);
    setIsVideoSelectionCompleted(true);
    
    // Firestore에 영상 목록과 완료 상태 모두 저장
    if (currentUser?.uid) {
      await updateUserProfile(currentUser.uid, { 
        myVideos: videos,
        videoSelectionCompleted: true
      });
    }
    
    // localStorage에도 완료 상태 저장
    localStorage.setItem('video_selection_completed', 'true');
  };

  useEffect(() => {
    if (currentUser?.uid) {
      getUserProfile(currentUser.uid).then(profile => {
        if (profile?.myVideos) {
          setSelectedVideos(profile.myVideos);
        }
        if (profile?.videoSelectionCompleted) {
          setIsVideoSelectionCompleted(true);
          localStorage.setItem('video_selection_completed', 'true');
        }
      });
    }
  }, [currentUser]);

  // 상태 초기화 함수
  const resetVideoSelectionState = async () => {
    setSelectedVideos([]);
    setIsVideoSelectionCompleted(false);
    
    if (currentUser?.uid) {
      await updateUserProfile(currentUser.uid, { 
        myVideos: [],
        videoSelectionCompleted: false
      });
    }
    
    localStorage.removeItem('video_selection_completed');
  };

  return {
    selectedVideos,
    setSelectedVideos,
    handleVideoSelection,
    handleVideoSelectionComplete,
    isVideoSelectionCompleted,
    resetVideoSelectionState,
  };
} 
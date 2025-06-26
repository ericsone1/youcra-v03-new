// 🎯 사용자 카테고리 관리 훅
// 원본: Home_ORIGINAL_BACKUP.js에서 추출

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

export const useUserCategory = (currentUser) => {
  const [userCategory, setUserCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 사용자 카테고리 정보 가져오기
  useEffect(() => {
    const fetchUserCategory = async () => {
      if (!currentUser?.uid) {
        setUserCategory(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().youtubeChannel?.category) {
          setUserCategory(userDoc.data().youtubeChannel.category);
        } else {
          setUserCategory(null);
        }
      } catch (error) {
        console.error('사용자 카테고리 로드 오류:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCategory();
  }, [currentUser]);

  return { userCategory, loading, error };
}; 
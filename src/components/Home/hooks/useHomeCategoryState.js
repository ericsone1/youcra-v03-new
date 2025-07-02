import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { updateUserProfile, getUserProfile } from '../../../services/userService';

export function useHomeCategoryState() {
  const { currentUser } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleCategoriesChange = async (categories) => {
    setSelectedCategories(categories);
    // Firestore에 저장
    if (currentUser?.uid) {
      await updateUserProfile(currentUser.uid, { categories });
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      getUserProfile(currentUser.uid).then(profile => {
        if (profile?.categories) {
          setSelectedCategories(profile.categories);
        }
      });
    }
  }, [currentUser]);

  return {
    selectedCategories,
    setSelectedCategories,
    handleCategoriesChange,
  };
} 
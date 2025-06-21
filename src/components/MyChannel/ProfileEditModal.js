import React, { useState, useRef, useEffect } from 'react';
import { auth, storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

const ProfileEditModal = ({ isOpen, onClose, user, profile, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    nickname: '',
    introduction: '',
    profileImage: '',
    coverImage: ''
  });
  
  const [previews, setPreviews] = useState({
    profileImage: null,
    coverImage: null
  });
  
  const [uploading, setUploading] = useState(false);
  const [saveErrors, setSaveErrors] = useState({});
  
  const profileImageRef = useRef(null);
  const coverImageRef = useRef(null);

  // 프로필 데이터 초기화
  useEffect(() => {
    if (profile) {
      setFormData({
        nickname: profile.nickname || '',
        introduction: profile.introduction || '',
        profileImage: profile.profileImage || '',
        coverImage: profile.coverImage || ''
      });
    }
  }, [profile]);

  // 폼 입력 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 메시지 제거
    if (saveErrors[field]) {
      setSaveErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // 이미지 파일 선택 핸들러
  const handleImageSelect = (type, file) => {
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하로 선택해주세요');
      return;
    }

    // 미리보기 설정
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({
        ...prev,
        [type]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // 이미지 업로드 (경로 직접 지정 방식으로 변경)
  const uploadImage = async (file, fullPath) => {
    try {
      const imageRef = ref(storage, fullPath);
      await uploadBytes(imageRef, file);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nickname.trim()) {
      errors.nickname = '닉네임을 입력해주세요';
    } else if (formData.nickname.length > 20) {
      errors.nickname = '닉네임은 20자 이하로 입력해주세요';
    }
    
    if (formData.introduction.length > 500) {
      errors.introduction = '자기소개는 500자 이하로 입력해주세요';
    }
    
    setSaveErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    try {
      let updatedData = { ...formData };

      // 프로필 이미지 업로드
      if (profileImageRef.current?.files[0]) {
        const imagePath = `profiles/${user.uid}/profile.jpg`;
        const profileImageUrl = await uploadImage(profileImageRef.current.files[0], imagePath);
        updatedData.profileImage = profileImageUrl;
      }

      // 커버 이미지 업로드
      if (coverImageRef.current?.files[0]) {
        const imagePath = `covers/${user.uid}/cover.jpg`;
        const coverImageUrl = await uploadImage(coverImageRef.current.files[0], imagePath);
        updatedData.coverImage = coverImageUrl;
      }

      // Firestore 업데이트
      const userRef = doc(db, 'users', user.uid);
      
      const updatePayload = {
        nickname: updatedData.nickname,
        introduction: updatedData.introduction,
        profileImage: updatedData.profileImage,
        coverImage: updatedData.coverImage,
        updatedAt: new Date()
      };

      await updateDoc(userRef, updatePayload);

      // 부모 컴포넌트에 업데이트 알림
      if (onProfileUpdate) {
        onProfileUpdate(updatedData);
      }

      alert('프로필이 성공적으로 업데이트되었습니다!');
      onClose();
    } catch (error) {
      console.error('❌ 프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">프로필 편집</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={uploading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 내용 */}
        <div className="p-6 space-y-6">
          {/* 커버 이미지 섹션 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              커버 이미지
            </label>
            <div className="relative w-full h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg overflow-hidden">
              {(previews.coverImage || formData.coverImage) && (
                <img 
                  src={previews.coverImage || formData.coverImage} 
                  alt="커버 이미지" 
                  className="w-full h-full object-cover"
                />
              )}
              <button
                onClick={() => coverImageRef.current?.click()}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs"
              >
                📷 변경
              </button>
            </div>
            <input
              ref={coverImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageSelect('coverImage', e.target.files[0])}
            />
          </div>

          {/* 프로필 이미지 섹션 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프로필 이미지
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-500 overflow-hidden">
                {(previews.profileImage || formData.profileImage) ? (
                  <img 
                    src={previews.profileImage || formData.profileImage} 
                    alt="프로필" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  formData.nickname?.slice(0, 2) || "🙂"
                )}
              </div>
              <button
                onClick={() => profileImageRef.current?.click()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                이미지 변경
              </button>
            </div>
            <input
              ref={profileImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageSelect('profileImage', e.target.files[0])}
            />
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              닉네임 *
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => handleInputChange('nickname', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                saveErrors.nickname ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
            />
            {saveErrors.nickname && (
              <p className="text-red-500 text-xs mt-1">{saveErrors.nickname}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">{formData.nickname.length}/20자</p>
          </div>

          {/* 자기소개 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              자기소개
            </label>
            <textarea
              value={formData.introduction}
              onChange={(e) => handleInputChange('introduction', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 ${
                saveErrors.introduction ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="자신을 소개해보세요"
              maxLength={500}
            />
            {saveErrors.introduction && (
              <p className="text-red-500 text-xs mt-1">{saveErrors.introduction}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">{formData.introduction.length}/500자</p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={uploading}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                저장 중...
              </>
            ) : (
              '저장하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal; 
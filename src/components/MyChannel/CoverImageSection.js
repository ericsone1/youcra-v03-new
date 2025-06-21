import React, { useState, useRef } from 'react';
import { auth, storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

const CoverImageSection = ({ user, profile, setProfile, saving, setSaving, isBackground = false, isKakaoStyle = false }) => {
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef(null);

  // 커버이미지 변경 핸들러
  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하로 선택해주세요');
      return;
    }

    // 미리보기 설정
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Firebase Storage에 업로드
    setUploading(true);
    try {
      const coverRef = ref(storage, `covers/${user.uid}_${Date.now()}`);
      await uploadBytes(coverRef, file);
      const coverUrl = await getDownloadURL(coverRef);
      
      // 프로필 상태 업데이트
      setProfile(prev => ({
        ...prev,
        coverImage: coverUrl
      }));
      
      // Firestore에 커버이미지 URL 저장
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        coverImage: coverUrl
      });
      
      alert('커버이미지가 성공적으로 변경되었습니다!');
    } catch (error) {
      console.error('커버이미지 업로드 실패:', error);
      alert('커버이미지 업로드에 실패했습니다.');
      setCoverPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const currentCoverImage = coverPreview || profile?.coverImage;

  return (
    <div className={`relative w-full ${isKakaoStyle ? 'h-64 sm:h-80' : isBackground ? 'h-80 sm:h-96' : 'h-32 sm:h-40'} bg-gradient-to-r from-blue-400 to-purple-500 ${isKakaoStyle ? '' : isBackground ? 'rounded-2xl' : 'rounded-t-2xl'} overflow-hidden`}>
      {/* 커버이미지 또는 기본 그라데이션 */}
      {currentCoverImage ? (
        <img 
          src={currentCoverImage} 
          alt="커버이미지" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
          {!isBackground && !isKakaoStyle && (
            <div className="text-white text-center">
              <div className="text-2xl mb-2">🎨</div>
              <div className="text-sm opacity-80">커버이미지를 설정해보세요</div>
            </div>
          )}
        </div>
      )}
      
      {/* 업로딩 오버레이 */}
      {uploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <div className="text-sm">업로드 중...</div>
          </div>
        </div>
      )}
      
      {/* 파일 입력 */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={coverInputRef}
        onChange={handleCoverChange}
      />
    </div>
  );
};

export default CoverImageSection; 
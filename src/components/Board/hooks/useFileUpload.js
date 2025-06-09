import { useState } from 'react';
import { storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function useFileUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // 파일 선택 핸들러
  const handleFileSelect = (event, onTypeChange) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하만 업로드 가능합니다.');
      return;
    }

    setSelectedFile(file);
    
    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    // 파일 타입에 따라 게시글 타입 자동 설정
    if (file.type.startsWith('image/')) {
      onTypeChange('image');
    } else if (file.type.startsWith('video/')) {
      onTypeChange('video');
    }
  };

  // 파일 업로드
  const uploadFile = async () => {
    if (!selectedFile) return '';

    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, `posts/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const fileUrl = await getDownloadURL(snapshot.ref);
      
      return fileUrl;
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // 파일 초기화
  const resetFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploading(false);
  };

  return {
    selectedFile,
    previewUrl,
    uploading,
    handleFileSelect,
    uploadFile,
    resetFile
  };
} 
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 테스트용 영상 업로드 함수
 */
export const uploadTestVideo = async (userId, displayName) => {
  try {
    console.log('🧪 [TestVideoUpload] 테스트 영상 업로드 시작:', { userId, displayName });
    
    const testVideo = {
      title: "테스트 영상 - " + displayName,
      videoId: "dQw4w9WgXcQ", // Rick Roll 영상 ID
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      duration: 212,
      durationDisplay: "3:32",
      channel: displayName,
      channelTitle: displayName,
      views: "1000 조회",
      publishedAt: new Date().toISOString(),
      description: "테스트용 영상입니다.",
      ucraViewCount: 0,
      registeredBy: userId,
      uploaderUid: userId,
      uploaderName: displayName,
      uploaderEmail: "test@example.com",
      registeredAt: serverTimestamp(),
      type: "long"
    };
    
    const docRef = await addDoc(collection(db, 'videos'), testVideo);
    console.log('✅ [TestVideoUpload] 테스트 영상 업로드 성공:', docRef.id);
    
    // 사용자의 myVideos 컬렉션에도 저장
    try {
      await addDoc(collection(db, 'users', userId, 'myVideos'), {
        ...testVideo,
        rootVideoId: docRef.id
      });
      console.log('✅ [TestVideoUpload] myVideos 컬렉션에도 저장 완료');
    } catch (error) {
      console.warn('⚠️ [TestVideoUpload] myVideos 저장 실패:', error);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('❌ [TestVideoUpload] 테스트 영상 업로드 실패:', error);
    throw error;
  }
};

// 개발환경에서만 전역으로 사용 가능하도록 설정
if (process.env.NODE_ENV === 'development') {
  window.uploadTestVideo = uploadTestVideo;
} 
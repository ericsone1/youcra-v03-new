import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { auth, db, storage } from '../../../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function usePosts(category = null) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 게시글 목록 실시간 구독 (로그인 여부와 관계없이 게시글은 모두 볼 수 있음)
  useEffect(() => {
    // 인증 로딩이 완료된 후에 데이터 로드
    if (authLoading) {
      return;
    }

    console.log("게시판 데이터 로딩 시작...");
    
    // 모든 게시글을 가져온 후 클라이언트에서 필터링
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("게시글 데이터 수신:", snapshot.docs.length + "개");
      
      const allPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 카테고리 필터링 (클라이언트 사이드)
      const filteredPosts = category 
        ? allPosts.filter(post => post.category === category)
        : allPosts;
      
      console.log("필터된 게시글:", filteredPosts.length + "개");
      setPosts(filteredPosts);
      setLoading(false);
    }, (error) => {
      console.error("게시글 로딩 오류:", error);
      // 오류 발생 시 빈 배열로 설정하고 로딩 완료
      setPosts([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category, authLoading]);

  // 게시글 작성
  const createPost = async (postData, file = null) => {
    if (!isAuthenticated || !auth.currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    let fileUrl = '';
    
    // 파일 업로드 (이미지/영상인 경우)
    if (file && (postData.type === 'image' || postData.type === 'video')) {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `posts/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      fileUrl = await getDownloadURL(snapshot.ref);
    }

    const newPostData = {
      title: postData.title.trim(),
      content: postData.content.trim(),
      type: postData.type,
      category: postData.category || 'free',
      author: {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || '익명',
        photoURL: auth.currentUser.photoURL || ''
      },
      createdAt: serverTimestamp(),
      likes: 0,
      comments: 0,
      views: 0
    };

    // 협업모집 게시판인 경우 말머리 추가
    if (postData.category === 'collaboration' && postData.collaborationType) {
      newPostData.collaborationType = postData.collaborationType;
    }

    // 홍보게시판인 경우 채널 URL 추가
    if (postData.category === 'promotion' && postData.channelUrl) {
      newPostData.channelUrl = postData.channelUrl;
    }

    // 파일 URL 추가
    if (fileUrl) {
      if (postData.type === 'image') {
        newPostData.imageUrl = fileUrl;
      } else if (postData.type === 'video') {
        newPostData.videoUrl = fileUrl;
      }
    }

    // 링크 타입인 경우 링크 URL 추가
    if (postData.type === 'link' && postData.linkUrl) {
      newPostData.linkUrl = postData.linkUrl;
    }

    // Firestore에 저장
    await addDoc(collection(db, "posts"), newPostData);
  };

  // 게시글 수정
  const updatePost = async (postId, updatedData, file = null) => {
    if (!isAuthenticated || !auth.currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    let fileUrl = '';
    
    // 새 파일이 있는 경우 업로드
    if (file && (updatedData.type === 'image' || updatedData.type === 'video')) {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `posts/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      fileUrl = await getDownloadURL(snapshot.ref);
    }

    const updateData = {
      title: updatedData.title.trim(),
      content: updatedData.content.trim(),
      type: updatedData.type,
      category: updatedData.category,
      updatedAt: serverTimestamp()
    };

    // 협업모집 게시판인 경우 말머리 업데이트
    if (updatedData.category === 'collaboration' && updatedData.collaborationType) {
      updateData.collaborationType = updatedData.collaborationType;
    }

    // 홍보게시판인 경우 채널 URL 업데이트
    if (updatedData.category === 'promotion' && updatedData.channelUrl) {
      updateData.channelUrl = updatedData.channelUrl;
    }

    // 새 파일 URL 추가
    if (fileUrl) {
      if (updatedData.type === 'image') {
        updateData.imageUrl = fileUrl;
      } else if (updatedData.type === 'video') {
        updateData.videoUrl = fileUrl;
      }
    }

    // 링크 타입인 경우 링크 URL 업데이트
    if (updatedData.type === 'link' && updatedData.linkUrl) {
      updateData.linkUrl = updatedData.linkUrl;
    }

    // Firestore에서 업데이트
    await updateDoc(doc(db, "posts", postId), updateData);
  };

  // 게시글 좋아요 토글
  const toggleLike = async (postId) => {
    if (!isAuthenticated || !auth.currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const likeDocRef = doc(db, "posts", postId, "likes", auth.currentUser.uid);
      const likeDoc = await getDoc(likeDocRef);
      const postRef = doc(db, "posts", postId);
      
      if (likeDoc.exists()) {
        // 좋아요 취소
        await deleteDoc(likeDocRef);
        await updateDoc(postRef, {
          likes: posts.find(p => p.id === postId)?.likes - 1 || 0
        });
      } else {
        // 좋아요 추가
        await setDoc(likeDocRef, {
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        await updateDoc(postRef, {
          likes: (posts.find(p => p.id === postId)?.likes || 0) + 1
        });
      }
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
      throw error;
    }
  };

  // 게시글 삭제
  const deletePost = async (postId, authorUid) => {
    if (!isAuthenticated || !auth.currentUser || auth.currentUser.uid !== authorUid) {
      throw new Error('권한이 없습니다.');
    }

    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, "posts", postId));
      } catch (error) {
        console.error('게시글 삭제 오류:', error);
        throw error;
      }
    }
  };

  return {
    posts,
    loading,
    createPost,
    updatePost,
    toggleLike,
    deletePost
  };
} 
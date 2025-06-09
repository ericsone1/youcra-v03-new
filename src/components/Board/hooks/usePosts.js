import { useState, useEffect } from 'react';
import { auth, db } from '../../../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';

export default function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 게시글 목록 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 게시글 작성
  const createPost = async (postData, fileUrl = '') => {
    if (!auth.currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    const newPostData = {
      title: postData.title.trim(),
      content: postData.content.trim(),
      type: postData.type,
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

  // 게시글 좋아요 토글
  const toggleLike = async (postId) => {
    if (!auth.currentUser) {
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
    if (!auth.currentUser || auth.currentUser.uid !== authorUid) {
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
    toggleLike,
    deletePost
  };
} 
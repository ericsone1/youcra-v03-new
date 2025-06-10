import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { auth, db } from '../../../firebase';

export default function useComments(postId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 댓글 목록 실시간 구독
  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "posts", postId, "comments"), 
      orderBy("createdAt", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  // 댓글 작성
  const addComment = async (content) => {
    if (!auth.currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    if (!content.trim()) {
      throw new Error('댓글 내용을 입력해주세요.');
    }

    try {
      // 댓글 추가
      await addDoc(collection(db, "posts", postId, "comments"), {
        content: content.trim(),
        author: {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || '익명',
          photoURL: auth.currentUser.photoURL || ''
        },
        createdAt: serverTimestamp()
      });

      // 게시글의 댓글 수 증가
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: increment(1)
      });

    } catch (error) {
      console.error('댓글 작성 오류:', error);
      throw error;
    }
  };

  // 댓글 삭제
  const deleteComment = async (commentId, authorUid) => {
    if (!auth.currentUser || auth.currentUser.uid !== authorUid) {
      throw new Error('권한이 없습니다.');
    }

    try {
      // 댓글 삭제
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));

      // 게시글의 댓글 수 감소
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: increment(-1)
      });

    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      throw error;
    }
  };

  return {
    comments,
    loading,
    addComment,
    deleteComment
  };
} 
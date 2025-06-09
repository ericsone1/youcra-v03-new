import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

export function useMyBlog() {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [blogData, setBlogData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '일상' });

  // 블로그 데이터 로드
  useEffect(() => {
    if (currentUser) {
      loadBlogData();
    }
  }, [currentUser]);

  const loadBlogData = async () => {
    try {
      setIsLoading(true);
      
      // 블로그 정보 가져오기
      const blogRef = doc(db, 'blogs', currentUser.uid);
      const blogSnap = await getDoc(blogRef);
      
      if (blogSnap.exists()) {
        setBlogData(blogSnap.data());
        await loadPosts();
      } else {
        setBlogData(null);
      }
    } catch (error) {
      console.error('블로그 데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const postsRef = collection(db, 'blogs', currentUser.uid, 'posts');
      const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
      const postsSnap = await getDocs(postsQuery);
      
      const postsData = postsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPosts(postsData);
    } catch (error) {
      console.error('포스트 로드 오류:', error);
    }
  };

  const createBlog = async (blogInfo) => {
    try {
      const blogData = {
        title: blogInfo.title,
        description: blogInfo.description,
        category: blogInfo.category,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorUid: currentUser.uid,
        authorName: currentUser.displayName || '익명',
        postsCount: 0,
        viewsCount: 0,
        isPublic: true
      };

      await setDoc(doc(db, 'blogs', currentUser.uid), blogData);
      setBlogData(blogData);
      setShowCreateForm(false);
      alert('블로그가 성공적으로 생성되었습니다! 🎉');
    } catch (error) {
      console.error('블로그 생성 오류:', error);
      alert('블로그 생성 중 오류가 발생했습니다.');
    }
  };

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const postData = {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorUid: currentUser.uid,
        authorName: currentUser.displayName || '익명',
        viewsCount: 0,
        likesCount: 0,
        isPublic: true
      };

      const postsRef = collection(db, 'blogs', currentUser.uid, 'posts');
      await addDoc(postsRef, postData);

      // 블로그 포스트 카운트 업데이트
      await setDoc(doc(db, 'blogs', currentUser.uid), {
        ...blogData,
        postsCount: (blogData.postsCount || 0) + 1,
        updatedAt: new Date()
      }, { merge: true });

      setNewPost({ title: '', content: '', category: '일상' });
      setShowPostForm(false);
      await loadBlogData();
      alert('포스트가 성공적으로 작성되었습니다! ✨');
    } catch (error) {
      console.error('포스트 작성 오류:', error);
      alert('포스트 작성 중 오류가 발생했습니다.');
    }
  };

  // 핸들러들
  const handleBack = () => navigate('/my');
  const handleLogin = () => navigate('/login');
  const handleCreatePost = () => setShowPostForm(true);
  const handleClosePostForm = () => setShowPostForm(false);

  return {
    // 상태
    currentUser,
    loading,
    isAuthenticated,
    blogData,
    posts,
    isLoading,
    showCreateForm,
    setShowCreateForm,
    showPostForm,
    setShowPostForm,
    newPost,
    setNewPost,

    // 핸들러
    loadBlogData,
    createBlog,
    createPost,
    handleBack,
    handleLogin,
    handleCreatePost,
    handleClosePostForm,
  };
} 
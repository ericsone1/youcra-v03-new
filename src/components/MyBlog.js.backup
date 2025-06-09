import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import BottomTabBar from './MyChannel/BottomTabBar';

const MyBlog = () => {
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

  // 로딩 중
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">블로그 로딩 중...</p>
        <BottomTabBar />
      </div>
    );
  }

  // 로그인 필요
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 pb-24">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl mx-auto mb-4">
            📝
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">내 블로그</h2>
          <p className="text-gray-600 mb-6">블로그를 이용하려면 로그인이 필요합니다</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-purple-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-purple-600 transition"
          >
            로그인하기
          </button>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  // 블로그가 없는 경우 - 생성 화면
  if (!blogData) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col pb-24">
        <CreateBlogForm onCreateBlog={createBlog} onCancel={() => navigate('/my')} />
        <BottomTabBar />
      </div>
    );
  }

  // 메인 블로그 화면
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col pb-24">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/my')}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{blogData.title}</h1>
                <p className="text-gray-600 text-sm">{blogData.description}</p>
              </div>
            </div>
            <button
              onClick={() => setShowPostForm(true)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-600 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              글쓰기
            </button>
          </div>
        </div>
      </div>

      {/* 블로그 통계 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{blogData.postsCount || 0}</div>
            <div className="text-sm text-gray-500">총 포스트</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{blogData.viewsCount || 0}</div>
            <div className="text-sm text-gray-500">총 조회수</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{blogData.category}</div>
            <div className="text-sm text-gray-500">카테고리</div>
          </div>
        </div>

        {/* 포스트 목록 */}
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">첫 포스트를 작성해보세요!</h3>
              <p className="text-gray-600 mb-4">당신의 이야기를 세상과 공유해보세요.</p>
              <button
                onClick={() => setShowPostForm(true)}
                className="bg-purple-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-600 transition"
              >
                첫 글 쓰기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 포스트 작성 모달 */}
      {showPostForm && (
        <PostForm
          newPost={newPost}
          setNewPost={setNewPost}
          onSubmit={createPost}
          onCancel={() => setShowPostForm(false)}
        />
      )}

      <BottomTabBar />
    </div>
  );
};

// 블로그 생성 폼 컴포넌트
const CreateBlogForm = ({ onCreateBlog, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '일상'
  });

  const categories = ['일상', '기술', '여행', '음식', '취미', '리뷰', '기타'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('블로그 제목과 설명을 모두 입력해주세요.');
      return;
    }
    onCreateBlog(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            📝
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">내 블로그 만들기</h2>
          <p className="text-gray-600">당신만의 특별한 블로그를 시작해보세요!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">블로그 제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="블로그 제목을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">블로그 설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="블로그에 대한 간단한 설명을 작성해주세요"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">주요 카테고리</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-200 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-purple-600 transition"
            >
              블로그 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 포스트 카드 컴포넌트
const PostCard = ({ post }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{post.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3">{post.content}</p>
        </div>
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium ml-4">
          {post.category}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{formatDate(post.createdAt)}</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.viewsCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.likesCount || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

// 포스트 작성 폼 컴포넌트  
const PostForm = ({ newPost, setNewPost, onSubmit, onCancel }) => {
  const categories = ['일상', '기술', '여행', '음식', '취미', '리뷰', '기타'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">새 포스트 작성</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                placeholder="포스트 제목을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <select
                value={newPost.category}
                onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="포스트 내용을 작성해주세요..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                onClick={onSubmit}
                className="flex-1 bg-purple-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-purple-600 transition"
              >
                발행하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBlog;
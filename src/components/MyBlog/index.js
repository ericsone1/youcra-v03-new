import React from 'react';
import BottomTabBar from '../MyChannel/BottomTabBar';
import BlogHeader from './MyBlog/components/BlogHeader';
import BlogStats from './MyBlog/components/BlogStats';
import PostList from './MyBlog/components/PostList';
import CreateBlogForm from './MyBlog/components/CreateBlogForm';
import PostForm from './MyBlog/components/PostForm';
import { useMyBlog } from './MyBlog/hooks/useMyBlog';

const MyBlog = () => {
  const {
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
  } = useMyBlog();

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
            onClick={handleLogin}
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
        <CreateBlogForm 
          onCreateBlog={createBlog} 
          onCancel={handleBack} 
        />
        <BottomTabBar />
      </div>
    );
  }

  // 메인 블로그 화면
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col pb-24">
      <BlogHeader
        blogData={blogData}
        onBack={handleBack}
        onCreatePost={handleCreatePost}
      />

      {/* 블로그 통계 및 포스트 목록 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <BlogStats blogData={blogData} />
        <PostList 
          posts={posts} 
          onCreatePost={handleCreatePost} 
        />
      </div>

      {/* 포스트 작성 모달 */}
      {showPostForm && (
        <PostForm
          newPost={newPost}
          setNewPost={setNewPost}
          onSubmit={createPost}
          onCancel={handleClosePostForm}
        />
      )}

      <BottomTabBar />
    </div>
  );
};

export default MyBlog; 
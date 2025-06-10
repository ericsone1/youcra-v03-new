import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import BoardHeader from './Board/components/BoardHeader';
import PostForm from './Board/components/PostForm';
import PostList from './Board/components/PostList';

// Hooks
import usePosts from './Board/hooks/usePosts';

function Board() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // 게시글 관리 훅
  const { posts, loading, createPost, toggleLike, deletePost } = usePosts();

  // 게시글 작성 핸들러
  const handleCreatePost = async (postData, fileUrl) => {
    await createPost(postData, fileUrl);
    setShowCreateForm(false);
  };

  // 좋아요 핸들러
  const handleLikeToggle = async (postId) => {
    try {
      await toggleLike(postId);
    } catch (error) {
      alert(error.message);
    }
  };

  // 삭제 핸들러
  const handleDeletePost = async (postId, authorUid) => {
    try {
      await deletePost(postId, authorUid);
      alert('게시글이 삭제되었습니다.');
    } catch (error) {
      alert(error.message);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">게시판 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* 헤더 */}
        <BoardHeader 
          showCreateForm={showCreateForm}
          onToggleForm={() => setShowCreateForm(!showCreateForm)}
        />

        {/* 게시글 작성 폼 */}
        <PostForm 
          show={showCreateForm}
          onSubmit={handleCreatePost}
          onCancel={() => setShowCreateForm(false)}
        />

        {/* 게시글 목록 */}
        <PostList 
          posts={posts}
          onLike={handleLikeToggle}
          onDelete={handleDeletePost}
        />
      </div>
    </div>
  );
}

export default Board; 
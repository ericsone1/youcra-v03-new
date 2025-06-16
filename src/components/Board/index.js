import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Components
import BoardHeader from './components/BoardHeader';
import PostForm from './components/PostForm';
import PostList from './components/PostList';
import CategoryTabs from './components/CategoryTabs';

// Hooks
import usePosts from './hooks/usePosts';

// Utils
import { BOARD_CATEGORIES } from './utils/boardCategories';

function Board() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('collaboration');
  const [editingPost, setEditingPost] = useState(null);
  
  // 게시글 관리 훅 (카테고리 필터링 포함)
  const { posts, loading, createPost, updatePost, toggleLike, deletePost } = usePosts(selectedCategory);

  // 게시글 작성 핸들러
  const handleCreatePost = async (postData, fileUrl) => {
    if (!isAuthenticated) {
      alert('로그인 후 게시글을 작성할 수 있습니다.');
      navigate('/login');
      return;
    }
    await createPost({ ...postData, category: selectedCategory }, fileUrl);
    setShowCreateForm(false);
  };

  // 게시글 수정 핸들러
  const handleUpdatePost = async (postData, fileUrl) => {
    if (!isAuthenticated) {
      alert('로그인 후 게시글을 수정할 수 있습니다.');
      navigate('/login');
      return;
    }
    await updatePost(editingPost.id, { ...postData, category: selectedCategory }, fileUrl);
    setEditingPost(null);
  };

  // 게시글 수정 시작
  const handleEditPost = (post) => {
    if (!isAuthenticated) {
      alert('로그인 후 게시글을 수정할 수 있습니다.');
      navigate('/login');
      return;
    }
    setEditingPost(post);
    setShowCreateForm(false);
  };

  // 좋아요 핸들러
  const handleLikeToggle = async (postId) => {
    if (!isAuthenticated) {
      alert('로그인 후 좋아요를 누를 수 있습니다.');
      navigate('/login');
      return;
    }
    try {
      await toggleLike(postId);
    } catch (error) {
      alert(error.message);
    }
  };

  // 삭제 핸들러
  const handleDeletePost = async (postId, authorUid) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    try {
      await deletePost(postId, authorUid);
      alert('게시글이 삭제되었습니다.');
    } catch (error) {
      alert(error.message);
    }
  };

  // 글쓰기 버튼 클릭 핸들러
  const handleCreateButtonClick = () => {
    if (!isAuthenticated) {
      alert('로그인 후 게시글을 작성할 수 있습니다.');
      navigate('/login');
      return;
    }
    setShowCreateForm(!showCreateForm);
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCreateForm(false);
    setEditingPost(null);
  };

  // 현재 선택된 카테고리 정보
  const currentCategory = BOARD_CATEGORIES.find(cat => cat.id === selectedCategory);

  // 카테고리별 스타일
  const getCategoryStyle = (category, isSelected) => {
    const baseClasses = "flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 min-w-fit flex-shrink-0";
    
    if (isSelected) {
      const colorStyles = {
        blue: 'bg-blue-500 text-white shadow-lg',
        green: 'bg-green-500 text-white shadow-lg',
        purple: 'bg-purple-500 text-white shadow-lg',
        orange: 'bg-orange-500 text-white shadow-lg',
        red: 'bg-red-500 text-white shadow-lg'
      };
      return `${baseClasses} ${colorStyles[category.color] || 'bg-blue-500 text-white shadow-lg'}`;
    }
    return `${baseClasses} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  };

  // 로딩 상태 (인증 로딩은 포함하지 않음 - 게시판은 비로그인도 볼 수 있음)
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
        {/* 메인 헤더 */}
        <BoardHeader 
          currentCategory={currentCategory}
          showCreateForm={showCreateForm}
          onToggleForm={handleCreateButtonClick}
          isAuthenticated={isAuthenticated}
        />

        {/* 카테고리 탭 */}
        <CategoryTabs 
          categories={BOARD_CATEGORIES}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* 로그인 유도 메시지 (비로그인 상태) */}
        {!isAuthenticated && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white text-center">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-lg font-bold mb-2">게시판에 참여해보세요!</h3>
              <p className="text-blue-100 text-sm mb-4">
                게시글을 읽는 것은 누구나 가능하지만,<br/>
                글 작성, 댓글, 좋아요는 로그인이 필요해요
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow"
              >
                로그인 / 회원가입
              </button>
            </div>
          </div>
        )}

        {/* 인기게시물 카드 */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                🔥 <span>인기게시물</span>
              </h3>
              <span className="text-sm text-gray-500">실시간 HOT</span>
            </div>
            
            <div className="space-y-3">
              {posts.slice(0, 3).map((post, index) => (
                <div key={post.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <span className="text-lg font-bold text-orange-500">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate">{post.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{post.author?.displayName}</span>
                      <span>•</span>
                      <span>좋아요 {post.likes || 0}</span>
                    </div>
                  </div>
                  <span className="text-2xl">{BOARD_CATEGORIES.find(cat => cat.id === post.category)?.icon}</span>
                </div>
              ))}
              
              {posts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>아직 게시글이 없습니다</p>
                  <p className="text-sm">첫 번째 게시글을 작성해보세요!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 게시글 작성/수정 폼 (로그인 시에만) */}
        {isAuthenticated && (
          <PostForm 
            show={showCreateForm || editingPost}
            category={selectedCategory}
            editingPost={editingPost}
            onSubmit={editingPost ? handleUpdatePost : handleCreatePost}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingPost(null);
            }}
          />
        )}

        {/* 게시글 목록 */}
        <PostList 
          posts={posts}
          category={selectedCategory}
          onLike={handleLikeToggle}
          onDelete={handleDeletePost}
          onEdit={handleEditPost}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}

export default Board; 
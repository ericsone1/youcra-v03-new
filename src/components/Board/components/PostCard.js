import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { auth } from '../../../firebase';
import { formatTime, getTypeIcon } from '../utils/formatters';
import CommentSection from './CommentSection';

// 협업 타입 라벨
const COLLABORATION_LABELS = {
  channel: '공동채널운영',
  content: '컨텐츠협업',
  commission: '컨텐츠의뢰'
};

function PostCard({ post, onLike, onDelete, onEdit, isAuthenticated }) {
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    if (!isAuthenticated) {
      alert('로그인 후 좋아요를 누를 수 있습니다.');
      return;
    }
    try {
      onLike(post.id);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = () => {
    try {
      onDelete(post.id, post.author.uid);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = () => {
    try {
      onEdit(post);
    } catch (error) {
      alert(error.message);
    }
  };

  // 댓글 토글
  const handleToggleComments = () => {
    if (!isAuthenticated) {
      alert('로그인 후 댓글을 확인할 수 있습니다.');
      return;
    }
    setShowComments(!showComments);
  };

  // 말머리 색상 가져오기
  const getTagColor = (collaborationType) => {
    const colors = {
      channel: 'bg-purple-100 text-purple-800',
      content: 'bg-blue-100 text-blue-800',
      commission: 'bg-green-100 text-green-800'
    };
    return colors[collaborationType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      {/* 작성자 정보 */}
      <div className="flex items-center justify-between mb-4">
        <Link to={`/profile/0/${post.author.uid}`} className="flex items-center gap-3 group">
          {post.author.photoURL ? (
            <img 
              src={post.author.photoURL} 
              alt={post.author.displayName} 
              className="w-10 h-10 rounded-full object-cover transition-transform duration-300 group-hover:scale-110" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold transition-transform duration-300 group-hover:scale-110">
              {post.author.displayName?.slice(0, 2).toUpperCase() || '??'}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{post.author.displayName}</div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>{formatTime(post.createdAt)}</span>
              <span>{getTypeIcon(post.type)}</span>
            </div>
          </div>
        </Link>
        
        {/* 수정/삭제 버튼 (작성자만) */}
        {isAuthenticated && auth.currentUser?.uid === post.author.uid && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              ✏️ 수정
            </button>
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              🗑️ 삭제
            </button>
          </div>
        )}
      </div>

      {/* 말머리 (협업모집 게시판) */}
      {post.category === 'collaboration' && post.collaborationType && (
        <div className="mb-3">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTagColor(post.collaborationType)}`}>
            {COLLABORATION_LABELS[post.collaborationType]}
          </span>
        </div>
      )}

      {/* 게시글 제목 */}
      <h3 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h3>

      {/* 홍보게시판 - 채널 링크 */}
      {post.category === 'promotion' && post.channelUrl && (
        <div className="mb-3">
          <a
            href={post.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm hover:bg-red-100 transition-colors"
          >
            <span>📺</span>
            <span className="text-red-600 font-medium">유튜브 채널 구경하기</span>
            <span className="text-red-400">↗</span>
          </a>
        </div>
      )}

      {/* 게시글 내용 */}
      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

      {/* 미디어 컨텐츠 */}
      {post.type === 'image' && post.imageUrl && (
        <img src={post.imageUrl} alt="게시글 이미지" className="w-full max-h-80 object-cover rounded-lg mb-4" />
      )}
      
      {post.type === 'video' && post.videoUrl && (
        <video src={post.videoUrl} controls className="w-full max-h-80 rounded-lg mb-4" />
      )}
      
      {post.type === 'link' && post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>🔗</span>
            <span className="text-blue-600 font-medium truncate">{post.linkUrl}</span>
          </div>
        </a>
      )}

      {/* 액션 버튼들 */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={handleLike}
          disabled={!isAuthenticated}
          className={`flex items-center gap-2 transition-colors ${
            isAuthenticated 
              ? 'text-gray-600 hover:text-red-500 cursor-pointer' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
          title={!isAuthenticated ? '로그인 후 이용 가능' : ''}
        >
          <span>❤️</span>
          <span>{post.likes || 0}</span>
        </button>
        
        <button 
          onClick={handleToggleComments}
          disabled={!isAuthenticated}
          className={`flex items-center gap-2 transition-colors ${
            !isAuthenticated 
              ? 'text-gray-400 cursor-not-allowed'
              : showComments 
                ? 'text-blue-500' 
                : 'text-gray-600 hover:text-blue-500 cursor-pointer'
          }`}
          title={!isAuthenticated ? '로그인 후 이용 가능' : ''}
        >
          <span>💬</span>
          <span>{post.comments || 0}</span>
        </button>
        
        <span className="flex items-center gap-2 text-gray-500">
          <span>👀</span>
          <span>{post.views || 0}</span>
        </span>
      </div>

      {/* 댓글 섹션 (로그인 시에만) */}
      {isAuthenticated && (
        <CommentSection 
          postId={post.id}
          isOpen={showComments}
          onToggle={handleToggleComments}
        />
      )}
    </motion.div>
  );
}

export default PostCard; 
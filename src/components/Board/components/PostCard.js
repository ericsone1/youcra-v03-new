import React from 'react';
import { motion } from 'framer-motion';
import { auth } from '../../../firebase';
import { formatTime, getTypeIcon } from '../utils/formatters';

function PostCard({ post, onLike, onDelete }) {
  const handleLike = () => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      {/* 작성자 정보 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
            {post.author.displayName?.slice(0, 2).toUpperCase() || '??'}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{post.author.displayName}</div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>{formatTime(post.createdAt)}</span>
              <span>{getTypeIcon(post.type)}</span>
            </div>
          </div>
        </div>
        
        {/* 삭제 버튼 (작성자만) */}
        {auth.currentUser?.uid === post.author.uid && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            🗑️ 삭제
          </button>
        )}
      </div>

      {/* 게시글 제목 */}
      <h3 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h3>

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
          className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
        >
          <span>❤️</span>
          <span>{post.likes || 0}</span>
        </button>
        
        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
          <span>💬</span>
          <span>{post.comments || 0}</span>
        </button>
        
        <span className="flex items-center gap-2 text-gray-500">
          <span>👀</span>
          <span>{post.views || 0}</span>
        </span>
      </div>
    </motion.div>
  );
}

export default PostCard; 
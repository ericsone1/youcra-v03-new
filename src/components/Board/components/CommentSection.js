import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../../../firebase';
import { formatTime } from '../utils/formatters';
import useComments from '../hooks/useComments';

function CommentSection({ postId, isOpen, onToggle }) {
  const { comments, loading, addComment, deleteComment } = useComments(postId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 댓글 작성
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addComment(newComment);
      setNewComment('');
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId, authorUid) => {
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      try {
        await deleteComment(commentId, authorUid);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 border-t border-gray-100 pt-4"
        >
          {/* 댓글 작성 폼 */}
          {auth.currentUser ? (
            <form onSubmit={handleSubmitComment} className="mb-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {auth.currentUser.displayName?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="2"
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">{newComment.length}/500</span>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submitting}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {submitting ? '작성 중...' : '댓글 달기'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 text-sm">댓글을 작성하려면 로그인이 필요합니다.</p>
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">댓글 로딩 중...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {comment.author?.displayName?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">
                          {comment.author?.displayName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(comment.createdAt)}
                        </span>
                      </div>
                      {/* 삭제 버튼 (작성자만) */}
                      {auth.currentUser?.uid === comment.author?.uid && (
                        <button
                          onClick={() => handleDeleteComment(comment.id, comment.author.uid)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommentSection; 
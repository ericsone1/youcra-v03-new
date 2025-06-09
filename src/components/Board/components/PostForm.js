import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POST_TYPES } from '../utils/formatters';
import useFileUpload from '../hooks/useFileUpload';

function PostForm({ show, onSubmit, onCancel }) {
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'text',
    linkUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const {
    selectedFile,
    previewUrl,
    uploading,
    handleFileSelect,
    uploadFile,
    resetFile
  } = useFileUpload();

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = '';
      
      // 파일 업로드 (이미지/영상인 경우)
      if (selectedFile && (newPost.type === 'image' || newPost.type === 'video')) {
        fileUrl = await uploadFile();
      }

      // 게시글 생성
      await onSubmit(newPost, fileUrl);

      // 폼 초기화
      setNewPost({ title: '', content: '', type: 'text', linkUrl: '' });
      resetFile();
      
      alert('게시글이 성공적으로 작성되었습니다!');
    } catch (error) {
      console.error('게시글 작성 오류:', error);
      alert('게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    setNewPost({ title: '', content: '', type: 'text', linkUrl: '' });
    resetFile();
    onCancel();
  };

  // 파일 선택 핸들러 (타입 변경 포함)
  const onFileSelect = (event) => {
    handleFileSelect(event, (type) => {
      setNewPost(prev => ({ ...prev, type }));
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">새 게시글 작성</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 게시글 타입 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">게시글 타입</label>
              <div className="flex gap-2">
                {POST_TYPES.map(({ type, label, color }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewPost(prev => ({ ...prev, type }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newPost.type === type
                        ? `bg-${color}-500 text-white`
                        : `bg-gray-100 text-gray-600 hover:bg-${color}-100`
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="제목을 입력하세요"
                maxLength={100}
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                placeholder="내용을 입력하세요"
                maxLength={1000}
              />
            </div>

            {/* 링크 URL (링크 타입인 경우) */}
            {newPost.type === 'link' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">링크 URL</label>
                <input
                  type="url"
                  value={newPost.linkUrl}
                  onChange={(e) => setNewPost(prev => ({ ...prev, linkUrl: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {/* 파일 업로드 (이미지/영상 타입인 경우) */}
            {(newPost.type === 'image' || newPost.type === 'video') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newPost.type === 'image' ? '이미지 업로드' : '영상 업로드'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={newPost.type === 'image' ? 'image/*' : 'video/*'}
                  onChange={onFileSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* 미리보기 */}
                {previewUrl && (
                  <div className="mt-2">
                    {newPost.type === 'image' ? (
                      <img src={previewUrl} alt="미리보기" className="max-w-full h-40 object-cover rounded-lg" />
                    ) : (
                      <video src={previewUrl} controls className="max-w-full h-40 rounded-lg" />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400"
              >
                {submitting || uploading ? '업로드 중...' : '게시글 작성'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PostForm; 
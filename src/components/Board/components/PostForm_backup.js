import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POST_TYPES } from '../utils/formatters';

// 협업 타입 정의
const COLLABORATION_TYPES = [
  { id: 'channel', label: '공동채널운영', color: 'purple' },
  { id: 'content', label: '컨텐츠협업', color: 'blue' },
  { id: 'commission', label: '컨텐츠의뢰', color: 'green' }
];

function PostForm({ show, category, onSubmit, onCancel }) {
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'text',
    linkUrl: '',
    collaborationType: 'channel',
    channelUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // 파일 선택 핸들러
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하만 업로드 가능합니다.');
      return;
    }

    setSelectedFile(file);
    
    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    // 파일 타입에 따라 게시글 타입 자동 설정
    if (file.type.startsWith('image/')) {
      setNewPost(prev => ({ ...prev, type: 'image' }));
    } else if (file.type.startsWith('video/')) {
      setNewPost(prev => ({ ...prev, type: 'video' }));
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      // 게시글 생성 (파일을 직접 전달)
      await onSubmit(newPost, selectedFile);

      // 폼 초기화
      setNewPost({ 
        title: '', 
        content: '', 
        type: 'text', 
        linkUrl: '',
        collaborationType: 'channel',
        channelUrl: ''
      });
      setSelectedFile(null);
      setPreviewUrl('');
      
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
    setNewPost({ 
      title: '', 
      content: '', 
      type: 'text', 
      linkUrl: '',
      collaborationType: 'channel',
      channelUrl: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
    onCancel();
  };

  // 카테고리별 제목 및 설명
  const getCategoryInfo = () => {
    switch(category) {
      case 'promotion':
        return {
          title: '📢 홍보게시글 작성',
          description: '유튜브 채널이나 채팅방을 홍보해보세요!'
        };
      case 'suggestion':
        return {
          title: '💡 건의사항 작성',
          description: '앱 개선 아이디어나 버그를 신고해주세요.'
        };
      case 'collaboration':
        return {
          title: '🤝 협업모집 작성',
          description: '함께 성장할 파트너를 찾아보세요!'
        };
      case 'tips':
        return {
          title: '🎬 제작팁 공유',
          description: '영상 제작 노하우를 공유해주세요!'
        };
      default:
        return {
          title: '🎉 자유게시글 작성',
          description: '자유롭게 소통해보세요!'
        };
    }
  };

  const categoryInfo = getCategoryInfo();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">{categoryInfo.title}</h2>
            <p className="text-sm text-gray-600">{categoryInfo.description}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 협업모집 게시판 - 말머리 선택 */}
            {category === 'collaboration' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">협업 유형</label>
                <div className="flex gap-2">
                  {COLLABORATION_TYPES.map(({ id, label, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setNewPost(prev => ({ ...prev, collaborationType: id }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.collaborationType === id
                          ? `bg-${color}-500 text-white`
                          : `bg-gray-100 text-gray-600 hover:bg-${color}-100`
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                placeholder={category === 'promotion' ? '예: 구독자 1만명 달성! 유튜브 채널 구경오세요~' : '제목을 입력하세요'}
                maxLength={100}
              />
            </div>

            {/* 홍보게시판 - 채널 URL */}
            {category === 'promotion' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  유튜브 채널 URL (선택사항)
                </label>
                <input
                  type="url"
                  value={newPost.channelUrl}
                  onChange={(e) => setNewPost(prev => ({ ...prev, channelUrl: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://youtube.com/@your-channel"
                />
              </div>
            )}

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                placeholder={
                  category === 'suggestion' 
                    ? '발생한 문제나 개선 아이디어를 자세히 설명해주세요.'
                    : category === 'collaboration'
                    ? '협업 내용, 조건, 연락 방법 등을 자세히 적어주세요.'
                    : '내용을 입력하세요'
                }
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
                  {category === 'suggestion' && <span className="text-red-500"> (스크린샷 첨부 권장)</span>}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={newPost.type === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileSelect}
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
                disabled={submitting}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400"
              >
                {submitting ? '업로드 중...' : '게시글 작성'}
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
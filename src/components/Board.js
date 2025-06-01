import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';

function Board() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'text' // text, image, video, link
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // 게시글 목록 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  // 게시글 작성
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = '';
      
      // 파일 업로드 (이미지/영상인 경우)
      if (selectedFile && (newPost.type === 'image' || newPost.type === 'video')) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${selectedFile.name}`;
        const storageRef = ref(storage, `posts/${fileName}`);
        
        const snapshot = await uploadBytes(storageRef, selectedFile);
        fileUrl = await getDownloadURL(snapshot.ref);
      }

      // 게시글 데이터 구성
      const postData = {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        type: newPost.type,
        author: {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || '익명',
          photoURL: auth.currentUser.photoURL || ''
        },
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        views: 0
      };

      // 파일 URL 추가
      if (fileUrl) {
        if (newPost.type === 'image') {
          postData.imageUrl = fileUrl;
        } else if (newPost.type === 'video') {
          postData.videoUrl = fileUrl;
        }
      }

      // 링크 타입인 경우 링크 URL 추가
      if (newPost.type === 'link' && newPost.linkUrl) {
        postData.linkUrl = newPost.linkUrl;
      }

      // Firestore에 저장
      await addDoc(collection(db, "posts"), postData);

      // 폼 초기화
      setNewPost({ title: '', content: '', type: 'text' });
      setSelectedFile(null);
      setPreviewUrl('');
      setShowCreateForm(false);
      
      alert('게시글이 성공적으로 작성되었습니다!');
    } catch (error) {
      console.error('게시글 작성 오류:', error);
      alert('게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 게시글 좋아요 토글
  const handleLikeToggle = async (postId) => {
    if (!auth.currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const likeDocRef = doc(db, "posts", postId, "likes", auth.currentUser.uid);
      const likeDoc = await getDoc(likeDocRef);
      const postRef = doc(db, "posts", postId);
      
      if (likeDoc.exists()) {
        // 좋아요 취소
        await deleteDoc(likeDocRef);
        await updateDoc(postRef, {
          likes: posts.find(p => p.id === postId)?.likes - 1 || 0
        });
      } else {
        // 좋아요 추가
        await setDoc(likeDocRef, {
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        await updateDoc(postRef, {
          likes: (posts.find(p => p.id === postId)?.likes || 0) + 1
        });
      }
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (postId, authorUid) => {
    if (!auth.currentUser || auth.currentUser.uid !== authorUid) {
      alert('권한이 없습니다.');
      return;
    }

    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        alert('게시글이 삭제되었습니다.');
      } catch (error) {
        console.error('게시글 삭제 오류:', error);
        alert('게시글 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return date.toLocaleDateString();
  };

  // 게시글 타입별 아이콘
  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎬';
      case 'link': return '🔗';
      default: return '📝';
    }
  };

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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span>
              자유게시판
            </h1>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span>✏️</span>
              글쓰기
            </button>
          </div>
          <p className="text-gray-600 text-sm">유크라 사용자들과 자유롭게 소통해보세요!</p>
        </div>

        {/* 게시글 작성 폼 */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-6"
            >
              <h2 className="text-lg font-bold text-gray-800 mb-4">새 게시글 작성</h2>
              
              <form onSubmit={handleCreatePost} className="space-y-4">
                {/* 게시글 타입 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">게시글 타입</label>
                  <div className="flex gap-2">
                    {[
                      { type: 'text', label: '📝 텍스트', color: 'blue' },
                      { type: 'image', label: '🖼️ 이미지', color: 'green' },
                      { type: 'video', label: '🎬 영상', color: 'purple' },
                      { type: 'link', label: '🔗 링크', color: 'orange' }
                    ].map(({ type, label, color }) => (
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
                      value={newPost.linkUrl || ''}
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
                    disabled={uploading}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                  >
                    {uploading ? '업로드 중...' : '게시글 작성'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewPost({ title: '', content: '', type: 'text' });
                      setSelectedFile(null);
                      setPreviewUrl('');
                    }}
                    className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">첫 번째 게시글을 작성해보세요!</h3>
              <p className="text-gray-600">아직 작성된 게시글이 없습니다.</p>
            </div>
          ) : (
            posts.map((post) => (
              <motion.div
                key={post.id}
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
                      onClick={() => handleDeletePost(post.id, post.author.uid)}
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
                    onClick={() => handleLikeToggle(post.id)}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Board; 
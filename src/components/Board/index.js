import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

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
  const [isCreatingDummy, setIsCreatingDummy] = useState(false);
  
  // 게시글 관리 훅 (카테고리 필터링 포함)
  const { posts, loading, createPost, updatePost, toggleLike, deletePost } = usePosts(selectedCategory);

  // 더미 게시물 데이터
  const dummyPosts = [
    // 협업모집 게시판
    {
      title: "🎮 게임 컨텐츠 공동채널 운영 멤버 모집!",
      content: "안녕하세요! 저희는 게임 컨텐츠를 전문으로 하는 채널을 운영하고 있습니다.\n\n현재 팀 구성:\n- 기획자 1명\n- 편집자 1명\n- 썸네일 디자이너 1명\n\n모집 대상:\n- 게임 실력이 뛰어나신 분\n- 재미있는 리액션과 토크가 가능하신 분\n- 꾸준히 활동 가능하신 분\n\n🎯 목표: 구독자 10만 달성\n📧 연락처: game.channel@gmail.com\n💬 디스코드: GameTeam#1234",
      category: "collaboration",
      collaborationType: "channel",
      type: "text",
      author: {
        uid: "admin_dummy",
        email: "admin@youcra.com", 
        displayName: "게임마스터",
        photoURL: ""
      }
    },
    {
      title: "🎬 영화 리뷰 채널 편집자 구합니다",
      content: "영화 리뷰 컨텐츠를 제작하는 개인 크리에이터입니다.\n\n현재 상황:\n- 주 2회 업로드 (화, 금)\n- 구독자 3만명\n- 월 수익 200-300만원\n\n찾는 분:\n- 프리미어 프로/파이널컷 숙련자\n- 영화에 관심이 많으신 분\n- 장기적 파트너십 원하시는 분\n\n조건:\n- 편집비: 영상당 15-20만원\n- 수익 배분 가능 (협의)\n- 재택근무\n\n✉️ 포트폴리오 첨부해서 연락주세요!",
      category: "collaboration", 
      collaborationType: "content",
      type: "text",
      author: {
        uid: "admin_dummy2",
        email: "movie@youcra.com",
        displayName: "영화광",
        photoURL: ""
      }
    },
    // 홍보게시판
    {
      title: "🔥 요리 초보자를 위한 '쉬운 레시피' 채널 홍보",
      content: "안녕하세요! 요리 초보자도 쉽게 따라할 수 있는 레시피를 소개하는 채널입니다.\n\n📺 채널 특징:\n- 10분 이내 간단 요리\n- 재료비 1만원 이하\n- 실패 없는 레시피만 선별\n- 매주 화, 목, 토 업로드\n\n🎯 최근 인기 영상:\n- '계란 하나로 만드는 5가지 요리'\n- '라면을 200% 맛있게 끓이는 법'\n- '전자레인지로 만드는 케이크'\n\n구독자 여러분들의 레시피 요청도 받고 있어요!\n많은 관심 부탁드립니다 🙏",
      category: "promotion",
      channelUrl: "https://youtube.com/@easycooking",
      type: "text", 
      author: {
        uid: "admin_dummy3",
        email: "cooking@youcra.com",
        displayName: "쿠킹셰프",
        photoURL: ""
      }
    },
    {
      title: "🎵 K-POP 댄스 커버 채널 & 채팅방 홍보",
      content: "K-POP 댄스 커버 전문 채널과 팬들과 소통하는 채팅방을 운영하고 있습니다!\n\n💃 채널 내용:\n- 최신 K-POP 안무 커버\n- 안무 튜토리얼\n- 댄서들과의 콜라보\n- 라이브 방송\n\n🎪 채팅방 특징:\n- 실시간 안무 피드백\n- 댄스 챌린지 이벤트\n- 멤버들끼리 커버 영상 공유\n- 월 1회 오프라인 모임\n\n현재 멤버 200명+\n초보자도 환영합니다! 함께 춤춰요 💫",
      category: "promotion",
      channelUrl: "https://youtube.com/@kpopdance",
      chatRoomLink: "https://ucrachat.com/chat/kpop-dance",
      type: "text",
      author: {
        uid: "admin_dummy4", 
        email: "dance@youcra.com",
        displayName: "댄스퀸",
        photoURL: ""
      }
    },
    // 건의사항
    {
      title: "💡 [기능 건의] 채팅방 내 음성 채팅 기능 추가 요청",
      content: "안녕하세요! 유크라를 정말 잘 사용하고 있습니다.\n\n건의사항:\n채팅방에서 텍스트 뿐만 아니라 음성으로도 소통할 수 있으면 좋겠어요.\n\n예상 기능:\n- 음성 채팅 버튼 추가\n- 최대 10명까지 동시 음성 채팅\n- 방장이 음성 채팅 허용/차단 설정\n- 음성 품질 조절 옵션\n\n이유:\n- 게임하면서 채팅하기 불편함\n- 요리/운동 영상 보면서 손 못 쓸 때\n- 더 생동감 있는 소통 가능\n\n🙏 검토 부탁드립니다!",
      category: "suggestion",
      type: "text",
      author: {
        uid: "admin_dummy5",
        email: "user1@gmail.com",
        displayName: "음성채팅희망자",
        photoURL: ""
      }
    },
    {
      title: "🐛 [버그 신고] 영상 재생 중 앱이 가끔 멈춤 현상",
      content: "앱 사용 중 발견한 버그를 신고드립니다.\n\n🔍 버그 상황:\n- 채팅방에서 유튜브 영상 재생 시\n- 5-10분 후 갑자기 앱이 멈춤\n- 새로고침해야 다시 정상 작동\n\n📱 환경 정보:\n- 디바이스: iPhone 14 Pro\n- iOS: 17.2\n- 브라우저: Safari\n- 발생 빈도: 주 2-3회\n\n🎬 재현 방법:\n1. 채팅방 입장\n2. 긴 영상(30분+) 재생\n3. 채팅 활발히 참여\n4. 5-10분 후 앱 정지\n\n📸 스크린샷 첨부 가능합니다.\n빠른 수정 부탁드려요!",
      category: "suggestion",
      type: "text", 
      author: {
        uid: "admin_dummy6",
        email: "user2@gmail.com", 
        displayName: "버그헌터",
        photoURL: ""
      }
    }
  ];

  // 더미 게시물 생성 함수
  const createDummyPosts = async () => {
    setIsCreatingDummy(true);
    try {
      for (const post of dummyPosts) {
        await addDoc(collection(db, "posts"), {
          ...post,
          createdAt: serverTimestamp(),
          likes: Math.floor(Math.random() * 20), // 0-19 랜덤 좋아요
          comments: Math.floor(Math.random() * 10), // 0-9 랜덤 댓글
          views: Math.floor(Math.random() * 100) + 50 // 50-149 랜덤 조회수
        });
      }
      alert('✅ 더미 게시물 6개가 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('더미 게시물 생성 오류:', error);
      alert('❌ 더미 게시물 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingDummy(false);
    }
  };

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

        {/* 개발용 더미 게시물 생성 버튼 */}
        {process.env.NODE_ENV === 'development' && posts.length === 0 && (
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-yellow-800">🚀 게시판이 비어있어요!</h3>
                <p className="text-sm text-yellow-600">더미 게시물을 생성하여 게시판을 활성화해보세요</p>
              </div>
              <button
                onClick={createDummyPosts}
                disabled={isCreatingDummy}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isCreatingDummy 
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {isCreatingDummy ? '⏳ 생성중...' : '📝 더미 게시물 생성'}
              </button>
            </div>
          </div>
        )}

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
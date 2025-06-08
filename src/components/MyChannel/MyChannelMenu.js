import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabBar from './BottomTabBar';

const MyChannelMenu = () => {
  const navigate = useNavigate();

  const menuItems = [
    // 첫 번째 줄
    {
      id: 'blog',
      icon: '📝',
      title: '내 블로그',
      subtitle: '나만의 이야기',
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/my/blog')
    },
    {
      id: 'videos',
      icon: '▶️',
      title: '내 유튜브',
      subtitle: '업로드 관리',
      color: 'from-red-500 to-red-600',
      action: () => navigate('/my/videos')
    },
    {
      id: 'chatrooms',
      icon: '💬',
      title: '내 채팅방',
      subtitle: '방 관리',
      color: 'from-green-500 to-green-600',
      action: () => navigate('/my/chatrooms')
    },
    {
      id: 'stats',
      icon: '📊',
      title: '활동 통계',
      subtitle: '포인트 내역',
      color: 'from-orange-500 to-orange-600',
      action: () => navigate('/my/stats')
    },

    // 두 번째 줄
    {
      id: 'profile',
      icon: '👤',
      title: '프로필 편집',
      subtitle: '개인정보',
      color: 'from-blue-500 to-blue-600',
      action: () => navigate('/my/profile')
    },
    {
      id: 'channels',
      icon: '🔗',
      title: '채널 관리',
      subtitle: '연동 채널',
      color: 'from-indigo-500 to-indigo-600',
      action: () => navigate('/my/channels')
    },
    {
      id: 'points',
      icon: '💎',
      title: '포인트 관리',
      subtitle: '적립 내역',
      color: 'from-yellow-500 to-yellow-600',
      action: () => navigate('/my/points')
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: '설정',
      subtitle: '계정 설정',
      color: 'from-gray-500 to-gray-600',
      action: () => navigate('/my/settings')
    },

    // 세 번째 줄
    {
      id: 'notice',
      icon: '📢',
      title: '공지사항',
      subtitle: '업데이트 소식',
      color: 'from-teal-500 to-teal-600',
      action: () => navigate('/notice')
    },
    {
      id: 'support',
      icon: '💬',
      title: '고객센터',
      subtitle: '문의하기',
      color: 'from-cyan-500 to-cyan-600',
      action: () => navigate('/support')
    },
    {
      id: 'events',
      icon: '🎉',
      title: '이벤트',
      subtitle: '진행중인 이벤트',
      color: 'from-pink-500 to-rose-500',
      action: () => navigate('/events')
    },
    {
      id: 'backup',
      icon: '💾',
      title: '데이터 백업',
      subtitle: '내 정보 백업',
      color: 'from-slate-500 to-slate-600',
      action: () => navigate('/my/backup')
    }
  ];

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col pb-24">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/my')}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">내 채널</h1>
                <p className="text-sm text-gray-500">채널 관리 메뉴</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 그리드 메뉴 */}
      <div className="flex-1 px-4 py-6">
        <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
          {menuItems.map((item) => (
            <MenuButton key={item.id} item={item} />
          ))}
        </div>

        {/* 하단 여백 */}
        <div className="h-8"></div>
      </div>

      <BottomTabBar />
    </div>
  );
};

// 개별 메뉴 버튼 컴포넌트
const MenuButton = ({ item }) => {
  return (
    <button
      onClick={item.action}
      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center min-h-[100px] group"
    >
      {/* 아이콘 배경 */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xl mb-2 group-hover:scale-110 transition-transform duration-200`}>
        {item.icon}
      </div>
      
      {/* 제목 */}
      <div className="text-sm font-bold text-gray-800 mb-1 text-center leading-tight">
        {item.title}
      </div>
      
      {/* 부제목 */}
      <div className="text-xs text-gray-500 text-center leading-tight">
        {item.subtitle}
      </div>
    </button>
  );
};

export default MyChannelMenu; 
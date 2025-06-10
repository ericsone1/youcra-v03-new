import React from 'react';
import PostCard from './PostCard';

function PostList({ posts, category, onLike, onDelete, onEdit }) {
  const getCategoryEmptyState = (category) => {
    const emptyStates = {
      promotion: {
        icon: '📢',
        title: '첫 번째 홍보글을 작성해보세요!',
        description: '유튜브 채널이나 채팅방을 홍보해보세요.'
      },
      suggestion: {
        icon: '💡',
        title: '앱 개선 아이디어를 제안해주세요!',
        description: '버그 신고나 기능 개선 아이디어를 기다리고 있어요.'
      },
      collaboration: {
        icon: '🤝',
        title: '협업 파트너를 찾아보세요!',
        description: '함께 성장할 동료를 모집해보세요.'
      },
      tips: {
        icon: '🎬',
        title: '영상 제작 노하우를 공유해주세요!',
        description: '다른 크리에이터들에게 도움이 되는 팁을 알려주세요.'
      },
      free: {
        icon: '🎉',
        title: '첫 번째 게시글을 작성해보세요!',
        description: '자유롭게 소통하고 재미있는 이야기를 나눠보세요.'
      }
    };
    return emptyStates[category] || emptyStates.free;
  };

  if (posts.length === 0) {
    const emptyState = getCategoryEmptyState(category);
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">{emptyState.icon}</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{emptyState.title}</h3>
        <p className="text-gray-600">{emptyState.description}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={onLike}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default PostList; 

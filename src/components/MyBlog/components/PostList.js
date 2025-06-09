import React from 'react';
import PostCard from './PostCard';

function PostList({ posts, onCreatePost }) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">첫 포스트를 작성해보세요!</h3>
        <p className="text-gray-600 mb-4">당신의 이야기를 세상과 공유해보세요.</p>
        <button
          onClick={onCreatePost}
          className="bg-purple-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-600 transition"
        >
          첫 글 쓰기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default PostList; 
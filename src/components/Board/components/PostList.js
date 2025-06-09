import React from 'react';
import PostCard from './PostCard';
import EmptyState from './EmptyState';

function PostList({ posts, onLike, onDelete }) {
  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={onLike}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default PostList; 
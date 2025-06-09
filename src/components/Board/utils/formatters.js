// 시간 포맷팅 함수
export const formatTime = (timestamp) => {
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
export const getTypeIcon = (type) => {
  switch (type) {
    case 'image': return '🖼️';
    case 'video': return '🎬';
    case 'link': return '🔗';
    default: return '📝';
  }
};

// 게시글 타입별 설정
export const POST_TYPES = [
  { type: 'text', label: '📝 텍스트', color: 'blue' },
  { type: 'image', label: '🖼️ 이미지', color: 'green' },
  { type: 'video', label: '🎬 영상', color: 'purple' },
  { type: 'link', label: '🔗 링크', color: 'orange' }
]; 
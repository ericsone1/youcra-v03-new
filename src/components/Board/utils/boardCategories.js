export const BOARD_CATEGORIES = [
  {
    id: 'collaboration',
    name: '협업모집',
    icon: '🤝',
    color: 'orange',
    description: '함께 작업할 파트너를 찾아보세요',
    fields: ['collaborationType', 'contactInfo']
  },
  {
    id: 'promotion',
    name: '홍보게시판',
    icon: '🎯',
    color: 'blue',
    description: 'YouTube 채널이나 채팅방을 홍보해보세요',
    fields: ['channelUrl', 'chatRoomLink']
  },
  {
    id: 'suggestion',
    name: '건의사항',
    icon: '💡',
    color: 'green',
    description: '앱 개선 아이디어나 버그 신고를 해주세요',
    fields: ['screenshots', 'videos']
  },
  {
    id: 'free',
    name: '자유게시판',
    icon: '💬',
    color: 'purple',
    description: '자유롭게 이야기를 나눠보세요',
    fields: []
  },
  {
    id: 'tips',
    name: '영상제작 팁',
    icon: '🎬',
    color: 'red',
    description: 'YouTube 제작 노하우를 공유해주세요',
    fields: ['difficulty', 'category']
  }
];

export const COLLABORATION_TYPES = [
  { id: 'channel', label: '공동채널운영', color: 'bg-blue-100 text-blue-800' },
  { id: 'content', label: '컨텐츠협업', color: 'bg-green-100 text-green-800' },
  { id: 'commission', label: '컨텐츠 의뢰', color: 'bg-purple-100 text-purple-800' }
];

export const TIP_DIFFICULTIES = [
  { id: 'beginner', label: '초급자', color: 'bg-green-100 text-green-800' },
  { id: 'intermediate', label: '중급자', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'advanced', label: '고급자', color: 'bg-red-100 text-red-800' }
];

export const TIP_CATEGORIES = [
  { id: 'filming', label: '촬영', color: 'bg-blue-100 text-blue-800' },
  { id: 'editing', label: '편집', color: 'bg-purple-100 text-purple-800' },
  { id: 'thumbnail', label: '썸네일', color: 'bg-pink-100 text-pink-800' },
  { id: 'seo', label: 'SEO/검색최적화', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'analytics', label: '분석/수익화', color: 'bg-green-100 text-green-800' }
]; 
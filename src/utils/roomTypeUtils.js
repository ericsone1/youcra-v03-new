// 방 타입별 정보
export const getRoomTypeInfo = (roomType) => {
  const types = {
    "collaboration": { name: "🤝 협업방", color: "bg-blue-100 text-blue-700", shortName: "협업" },
    "subscribe": { name: "📺 맞구독방", color: "bg-red-100 text-red-700", shortName: "맞구독" },
    "youtube": { name: "🎬 YouTube", color: "bg-red-100 text-red-800", shortName: "YouTube" },
    "gaming": { name: "🎮 게임방", color: "bg-purple-100 text-purple-700", shortName: "게임" },
    "study": { name: "📚 스터디방", color: "bg-green-100 text-green-700", shortName: "스터디" },
    "chat": { name: "💬 자유채팅", color: "bg-indigo-100 text-indigo-700", shortName: "자유채팅" },
    "fan": { name: "⭐ 팬클럽방", color: "bg-yellow-100 text-yellow-800", shortName: "팬클럽" },
    "event": { name: "🎉 이벤트방", color: "bg-pink-100 text-pink-700", shortName: "이벤트" }
  };
  return types[roomType] || { name: "💬 채팅방", color: "bg-gray-100 text-gray-700", shortName: "채팅방" };
};

// 모든 방 타입 목록 가져오기
export const getAllRoomTypes = () => {
  return [
    { id: "collaboration", name: "🤝 협업방", desc: "프로젝트나 스터디를 함께해요" },
    { id: "subscribe", name: "📺 맞구독방", desc: "서로 구독하며 소통해요" },
    { id: "youtube", name: "🎬 YouTube 시청방", desc: "영상을 함께 시청해요" },
    { id: "gaming", name: "🎮 게임방", desc: "게임 이야기를 나눠요" },
    { id: "study", name: "📚 스터디방", desc: "함께 공부하며 성장해요" },
    { id: "chat", name: "💬 자유채팅방", desc: "자유롭게 대화해요" },
    { id: "fan", name: "⭐ 팬클럽방", desc: "좋아하는 것에 대해 이야기해요" },
    { id: "event", name: "🎉 이벤트방", desc: "특별한 이벤트를 진행해요" }
  ];
}; 
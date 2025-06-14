import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function ChatRoomVideos() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  // TODO: 실제 영상 데이터 연동은 이후 단계에서 추가
  const videos = [
    { id: 1, title: '유튜브 영상 1', channel: '채널A', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
    { id: 2, title: '유튜브 영상 2', channel: '채널B', thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg' },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center font-bold text-lg">시청하기</div>
        <div className="w-8" />
      </header>
      <main className="flex-1 pt-20 pb-8 px-4 overflow-y-auto">
        <div className="space-y-4">
          {videos.map(video => (
            <div key={video.id} className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 shadow">
              <img src={video.thumbnail} alt={video.title} className="w-20 h-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base truncate">{video.title}</div>
                <div className="text-gray-500 text-xs truncate">{video.channel}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ChatRoomVideos; 
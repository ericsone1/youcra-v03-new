import React from 'react';

export default function VideoSelectionSection({ selectedVideos, videoSelectionDone, onVideoSelect }) {
  // 예시: 영상 리스트(임시)
  const allVideos = [
    { id: '1', title: '게임 영상1' },
    { id: '2', title: '음악 영상2' },
    { id: '3', title: '스포츠 영상3' },
    { id: '4', title: '교육 영상4' },
  ];

  return (
    <section className="p-4 bg-gray-50 rounded-lg mb-4">
      <h2 className="text-lg font-semibold mb-2">시청할 영상 선택</h2>
      <div className="flex flex-wrap gap-2 mb-2">
        {allVideos.map((video) => (
          <button
            key={video.id}
            className={`px-3 py-1 rounded border ${selectedVideos.some((v) => v.id === video.id) ? 'bg-blue-200 border-blue-400' : 'bg-white border-gray-300'}`}
            onClick={() => {
              if (selectedVideos.some((v) => v.id === video.id)) {
                onVideoSelect(selectedVideos.filter((v) => v.id !== video.id));
              } else {
                onVideoSelect([...selectedVideos, video]);
              }
            }}
          >
            {video.title}
          </button>
        ))}
      </div>
      {videoSelectionDone ? (
        <span className="text-green-600 text-sm">영상 선택 완료!</span>
      ) : (
        <span className="text-gray-500 text-sm">1개 이상 영상을 선택하세요.</span>
      )}
    </section>
  );
} 
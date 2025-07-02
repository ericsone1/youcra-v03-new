import React from 'react';

export default function ChannelRegisterCardSection({ channelRegistered, channelInfo, onRegister, onEdit }) {
  return (
    <section className="p-4 bg-white rounded-lg shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">채널 등록</h2>
      {channelRegistered && channelInfo ? (
        <div>
          <div className="mb-2">등록된 채널: <span className="font-bold">{channelInfo.name}</span></div>
          <button
            className="px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm mr-2"
            onClick={onEdit}
          >
            채널 수정
          </button>
        </div>
      ) : (
        <button
          className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm"
          onClick={() => {
            // 예시: 임시 채널 등록
            onRegister({ name: '내 유튜브 채널' });
          }}
        >
          채널 등록하기
        </button>
      )}
    </section>
  );
} 
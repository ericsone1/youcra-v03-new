import React from 'react';
import Modal from "react-modal";

function CreateRoomModal({
  isOpen,
  onClose,
  newRoomName,
  setNewRoomName,
  newRoomHashtags,
  setNewRoomHashtags,
  onCreateRoom,
  creating,
  parseHashtags
}) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center z-50"
      overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      ariaHideApp={false}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs flex flex-col items-center">
        <h3 className="font-bold text-xl mb-4">새 채팅방 만들기</h3>
        
        <input
          className="w-full border rounded-lg px-3 py-2 mb-4 text-lg"
          placeholder="채팅방 이름 입력"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          maxLength={30}
          autoFocus
        />
        
        <input
          className="w-full border rounded-lg px-3 py-2 mb-4 text-lg"
          placeholder="#게임 #음악 #일상 (띄어쓰기로 구분)"
          value={newRoomHashtags}
          onChange={(e) => setNewRoomHashtags(e.target.value)}
          maxLength={50}
        />
        
        {/* 해시태그 미리보기 */}
        {newRoomHashtags && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-1">입력된 태그:</div>
            <div className="flex flex-wrap gap-1">
              {parseHashtags(newRoomHashtags).map((tag, idx) => (
                <span 
                  key={idx} 
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold text-lg hover:bg-blue-600 transition mb-2"
          onClick={onCreateRoom}
          disabled={creating || !newRoomName.trim()}
        >
          {creating ? "생성 중..." : "방 만들기"}
        </button>
        
        <button
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-bold text-lg hover:bg-gray-300 transition"
          onClick={onClose}
          disabled={creating}
        >
          취소
        </button>
      </div>
    </Modal>
  );
}

export default CreateRoomModal; 
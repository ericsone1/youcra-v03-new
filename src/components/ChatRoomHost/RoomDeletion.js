import React from "react";

const RoomDeletion = ({
  roomData,
  showDeleteConfirm,
  setShowDeleteConfirm,
  deleteConfirmName,
  setDeleteConfirmName,
  deletingRoom,
  onDeleteRoom,
  onCancelDelete
}) => {
  return (
    <section>
      <h2 className="font-bold text-base mb-2 text-red-600">⚠️ 방 삭제</h2>
      {!showDeleteConfirm ? (
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full bg-red-500 text-white py-2 rounded font-bold hover:bg-red-600 transition"
        >
          채팅방 삭제
        </button>
      ) : (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 space-y-4">
          <div className="text-center">
            <div className="text-red-600 font-bold text-lg mb-2">⚠️ 위험한 작업</div>
            <div className="text-sm text-gray-700 mb-4">
              이 작업은 <span className="font-bold">되돌릴 수 없습니다</span>.<br/>
              모든 메시지, 참여자, 영상이 영구 삭제됩니다.
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-red-700">
              확인을 위해 방 이름을 입력하세요:
            </label>
            <div className="text-xs text-gray-600 mb-2">
              입력해야 할 방 이름: <span className="font-bold text-red-600">"{roomData?.name}"</span>
            </div>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="방 이름을 정확히 입력하세요"
              disabled={deletingRoom}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onDeleteRoom}
              disabled={deletingRoom || deleteConfirmName !== roomData?.name}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingRoom ? "삭제 중..." : "영구 삭제"}
            </button>
            <button
              onClick={onCancelDelete}
              disabled={deletingRoom}
              className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-bold hover:bg-gray-600 transition disabled:opacity-50"
            >
              취소
            </button>
          </div>
          
          {deleteConfirmName && deleteConfirmName !== roomData?.name && (
            <div className="text-xs text-red-500 text-center">
              방 이름이 일치하지 않습니다.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default RoomDeletion; 
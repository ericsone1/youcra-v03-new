import React from "react";

const RoomSettings = ({
  roomData,
  editingSettings,
  setEditingSettings,
  editedName,
  setEditedName,
  editedDesc,
  setEditedDesc,
  editedHashtags,
  setEditedHashtags,
  editedMaxParticipants,
  setEditedMaxParticipants,
  savingSettings,
  onSaveSettings,
  onCancelEdit
}) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-base">🔒 방 설정 변경</h2>
        {!editingSettings && (
          <button
            onClick={() => setEditingSettings(true)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
          >
            편집
          </button>
        )}
      </div>
      
      {editingSettings ? (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* 방 이름 편집 */}
          <div>
            <label className="block text-sm font-semibold mb-1">방 이름</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="방 이름을 입력하세요"
              maxLength={50}
            />
          </div>

          {/* 방 설명 편집 */}
          <div>
            <label className="block text-sm font-semibold mb-1">방 설명</label>
            <textarea
              value={editedDesc}
              onChange={(e) => setEditedDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="방 설명을 입력하세요"
              rows="3"
              maxLength={200}
            />
          </div>

          {/* 해시태그 편집 */}
          <div>
            <label className="block text-sm font-semibold mb-1">해시태그</label>
            <input
              type="text"
              value={editedHashtags}
              onChange={(e) => setEditedHashtags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#태그1 #태그2 #태그3"
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-1">공백으로 구분하여 입력하세요</div>
          </div>

          {/* 최대 참여자 수 편집 */}
          <div>
            <label className="block text-sm font-semibold mb-1">최대 참여자 수</label>
            <input
              type="number"
              value={editedMaxParticipants}
              onChange={(e) => setEditedMaxParticipants(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="100"
            />
          </div>

          {/* 저장/취소 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={onSaveSettings}
              disabled={savingSettings}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            >
              {savingSettings ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={onCancelEdit}
              disabled={savingSettings}
              className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm mb-2"><span className="font-semibold">방 이름:</span> {roomData?.name}</div>
          <div className="text-sm mb-2"><span className="font-semibold">설명:</span> {roomData?.desc || "설명 없음"}</div>
          <div className="text-sm mb-2">
            <span className="font-semibold">해시태그:</span> {
              roomData?.hashtags && roomData.hashtags.length > 0 
                ? roomData.hashtags.map(tag => `#${tag}`).join(" ")
                : "해시태그 없음"
            }
          </div>
          <div className="text-sm"><span className="font-semibold">최대 참여자:</span> {roomData?.maxParticipants || 10}명</div>
        </div>
      )}
    </section>
  );
};

export default RoomSettings; 
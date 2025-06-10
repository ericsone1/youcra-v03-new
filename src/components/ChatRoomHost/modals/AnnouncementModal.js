import React from "react";

const AnnouncementModal = ({
  show,
  editingAnnouncement,
  announcementTitle,
  setAnnouncementTitle,
  announcementContent,
  setAnnouncementContent,
  announcementImportant,
  setAnnouncementImportant,
  savingAnnouncement,
  onSaveAnnouncement,
  onCancel
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-sm mx-4 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4 text-blue-600">
          📢 {editingAnnouncement ? "공지사항 편집" : "공지사항 추가"}
        </h3>
        
        <div className="space-y-4">
          {/* 제목 입력 */}
          <div>
            <label className="block text-sm font-semibold mb-2">제목</label>
            <input
              type="text"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="공지사항 제목을 입력하세요"
              maxLength={100}
            />
          </div>

          {/* 내용 입력 */}
          <div>
            <label className="block text-sm font-semibold mb-2">내용</label>
            <textarea
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="공지사항 내용을 입력하세요"
              rows="5"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {announcementContent.length}/500자
            </div>
          </div>

          {/* 중요도 설정 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="important"
              checked={announcementImportant}
              onChange={(e) => setAnnouncementImportant(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="important" className="text-sm font-semibold">
              중요 공지사항으로 설정
            </label>
          </div>
          
          {announcementImportant && (
            <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
              중요 공지사항은 노란색 배경으로 강조됩니다.
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={onSaveAnnouncement}
            disabled={savingAnnouncement || !announcementTitle.trim() || !announcementContent.trim()}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingAnnouncement ? "저장 중..." : (editingAnnouncement ? "수정하기" : "등록하기")}
          </button>
          <button
            onClick={onCancel}
            disabled={savingAnnouncement}
            className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal; 
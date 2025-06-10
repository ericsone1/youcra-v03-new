import React from "react";

const AnnouncementManagement = ({
  announcements,
  onShowAnnouncementModal,
  onEditAnnouncement,
  onDeleteAnnouncement,
  onToggleImportant
}) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-base">📢 공지사항 관리</h2>
        <button
          onClick={onShowAnnouncementModal}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
        >
          공지 추가
        </button>
      </div>
      
      <div className="space-y-2">
        {announcements.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-500">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`rounded-lg p-3 border ${
                announcement.important
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold">
                      {announcement.title}
                    </h3>
                    {announcement.important && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">중요</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  <div className="text-xs text-gray-500">
                    작성: {announcement.createdAt?.toDate ? announcement.createdAt.toDate().toLocaleString() : "알 수 없음"}
                    {announcement.updatedAt?.toDate && announcement.updatedAt.toDate().getTime() !== announcement.createdAt?.toDate().getTime() && (
                      <span className="ml-2">
                        (수정: {announcement.updatedAt.toDate().toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <button
                    onClick={() => onToggleImportant(announcement.id, announcement.important)}
                    className={`px-2 py-1 text-xs rounded transition ${
                      announcement.important
                        ? "bg-gray-500 text-white hover:bg-gray-600"
                        : "bg-yellow-500 text-white hover:bg-yellow-600"
                    }`}
                  >
                    {announcement.important ? "중요해제" : "중요설정"}
                  </button>
                  <button
                    onClick={() => onEditAnnouncement(announcement)}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => onDeleteAnnouncement(announcement.id, announcement.title)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default AnnouncementManagement; 
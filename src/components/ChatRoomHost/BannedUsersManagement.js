import React from "react";

const BannedUsersManagement = ({
  bannedUsers,
  onUnbanUser
}) => {
  return (
    <section>
      <h2 className="font-bold text-base mb-2">🚫 차단된 사용자</h2>
      <div className="space-y-2">
        {bannedUsers.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-500">
            차단된 사용자가 없습니다.
          </div>
        ) : (
          bannedUsers.map((bannedUser) => (
            <div key={bannedUser.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-red-700">
                      {bannedUser.email}
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">차단됨</span>
                    </div>
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    차단일: {bannedUser.bannedAt?.toDate ? bannedUser.bannedAt.toDate().toLocaleString() : "알 수 없음"}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    사유: {bannedUser.reason || "사유 없음"}
                  </div>
                </div>
                <button
                  onClick={() => onUnbanUser(bannedUser)}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                >
                  차단해제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default BannedUsersManagement; 
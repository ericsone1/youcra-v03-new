import React from "react";

const TransferOwnershipModal = ({
  show,
  participants,
  selectedTransferUser,
  setSelectedTransferUser,
  transferConfirmText,
  setTransferConfirmText,
  transferringOwnership,
  formatJoinTime,
  myUid,
  myEmail,
  onTransferOwnership,
  onCancel
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-sm mx-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-yellow-600 mb-2">👑 방장 권한 위임</h3>
          <p className="text-sm text-gray-600">
            다른 참여자에게 방장 권한을 위임합니다.
          </p>
        </div>

        {!selectedTransferUser ? (
          // 사용자 선택 단계
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">위임할 사용자를 선택하세요:</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {participants
                .filter(p => p.id !== myUid && p.email !== myEmail)
                .map((participant) => (
                  <button
                    key={participant.id}
                    onClick={() => setSelectedTransferUser(participant)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition"
                  >
                    <div className="font-semibold text-sm">{participant.email}</div>
                    <div className="text-xs text-gray-500">
                      입장: {formatJoinTime(participant.joinedAt)}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : (
          // 확인 단계
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-yellow-800 mb-1">선택된 사용자:</p>
              <p className="text-sm text-yellow-700">{selectedTransferUser.email}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-semibold mb-2">⚠️ 주의사항</p>
              <ul className="text-xs text-red-600 space-y-1">
                <li>• 권한 위임 후 더 이상 방장이 아닙니다</li>
                <li>• 방 관리 페이지에 접근할 수 없습니다</li>
                <li>• 이 작업은 되돌릴 수 없습니다</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                확인을 위해 "권한 위임"을 입력하세요:
              </label>
              <input
                type="text"
                value={transferConfirmText}
                onChange={(e) => setTransferConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="권한 위임"
                disabled={transferringOwnership}
              />
            </div>

            {transferConfirmText && transferConfirmText !== "권한 위임" && (
              <div className="text-xs text-red-500 text-center">
                "권한 위임"을 정확히 입력해주세요.
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-6">
          {!selectedTransferUser ? (
            <button
              onClick={onCancel}
              className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
            >
              취소
            </button>
          ) : (
            <>
              <button
                onClick={() => setSelectedTransferUser(null)}
                disabled={transferringOwnership}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-50"
              >
                뒤로
              </button>
              <button
                onClick={onTransferOwnership}
                disabled={transferringOwnership || transferConfirmText !== "권한 위임"}
                className="flex-1 bg-yellow-600 text-white py-2 rounded-lg font-semibold hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferringOwnership ? "위임 중..." : "권한 위임"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferOwnershipModal; 
import React from "react";

const BanUserModal = ({
  show,
  selectedBanUser,
  banReason,
  setBanReason,
  banning,
  onBanUser,
  onCancel
}) => {
  if (!show || !selectedBanUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-sm mx-4">
        <h3 className="text-lg font-bold mb-4 text-orange-600">🚫 사용자 차단</h3>
        
        <div className="mb-4">
          <div className="text-sm text-gray-700 mb-2">
            <span className="font-semibold">{selectedBanUser.email}</span>님을 차단하시겠습니까?
          </div>
          <div className="text-xs text-gray-500 mb-4">
            차단된 사용자는 이 채팅방에 다시 입장할 수 없습니다.
          </div>
          
          <label className="block text-sm font-semibold mb-2">차단 사유</label>
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="차단 사유를 입력해주세요"
            rows="3"
            maxLength={200}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onBanUser}
            disabled={banning || !banReason.trim()}
            className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {banning ? "차단 중..." : "차단하기"}
          </button>
          <button
            onClick={onCancel}
            disabled={banning}
            className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default BanUserModal; 
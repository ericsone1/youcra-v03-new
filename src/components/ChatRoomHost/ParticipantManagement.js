import React, { useState } from "react";

const ParticipantManagement = ({
  participants,
  myUid,
  myEmail,
  formatJoinTime,
  onKickParticipant,
  onShowTransferModal,
  onShowBanModal,
  setSelectedTransferUser,
  setSelectedBanUser
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleMenu = (participantId) => {
    setOpenMenuId(openMenuId === participantId ? null : participantId);
  };

  const closeMenu = () => {
    setOpenMenuId(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-base">👥 참여자 관리</h2>
        {participants.length > 1 && (
          <button
            onClick={onShowTransferModal}
            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
          >
            권한 위임
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {participants.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-500">
            참여자가 없습니다.
          </div>
        ) : (
          participants.map((participant) => {
            const isOwnerParticipant = participant.id === myUid || participant.email === myEmail;
            return (
              <div key={participant.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* 프로필 이미지 */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                    {participant.profileImage ? (
                      <img 
                        src={participant.profileImage} 
                        alt={participant.displayName || participant.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {(participant.displayName || participant.email).slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* 사용자 정보 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">
                        {participant.displayName || participant.email}
                      {isOwnerParticipant && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">방장</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                      {participant.displayName && participant.email !== participant.displayName && (
                        <div>{participant.email}</div>
                      )}
                    입장: {formatJoinTime(participant.joinedAt)}
                    </div>
                  </div>
                </div>
                {!isOwnerParticipant && (
                  <div className="relative">
                    {/* 점 3개 메뉴 버튼 */}
                    <button
                      onClick={() => toggleMenu(participant.id)}
                      className="p-1 hover:bg-gray-200 rounded transition"
                    >
                      <span className="text-gray-600 text-lg">⋯</span>
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {openMenuId === participant.id && (
                      <>
                        {/* 배경 클릭 시 메뉴 닫기 */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={closeMenu}
                        ></div>
                        
                        {/* 메뉴 옵션들 */}
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-36">
                          <div className="py-1">
                    <button
                      onClick={() => {
                        setSelectedTransferUser(participant);
                        onShowTransferModal();
                                closeMenu();
                      }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                              <span>👑</span>
                              방장 위임
                    </button>
                            <button
                              onClick={() => {
                                // TODO: 부방장 위임 기능 구현
                                alert("부방장 기능은 준비 중입니다.");
                                closeMenu();
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <span>🥈</span>
                              부방장 위임
                            </button>
                            <hr className="my-1" />
                    <button
                      onClick={() => {
                        setSelectedBanUser(participant);
                        onShowBanModal();
                                closeMenu();
                      }}
                              className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                    >
                              <span>🚫</span>
                      차단
                    </button>
                    <button
                              onClick={() => {
                                onKickParticipant(participant.id, participant.email);
                                closeMenu();
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                              <span>⚠️</span>
                      강퇴
                    </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ParticipantManagement; 
import React from "react";

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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">
                      {participant.email}
                      {isOwnerParticipant && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">방장</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    입장: {formatJoinTime(participant.joinedAt)}
                  </div>
                </div>
                {!isOwnerParticipant && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedTransferUser(participant);
                        onShowTransferModal();
                      }}
                      className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition"
                    >
                      권한위임
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBanUser(participant);
                        onShowBanModal();
                      }}
                      className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition"
                    >
                      차단
                    </button>
                    <button
                      onClick={() => onKickParticipant(participant.id, participant.email)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                    >
                      강퇴
                    </button>
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
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

// 커스텀 훅들
import { useRoomData } from "../hooks/useRoomData";
import { useParticipants } from "../hooks/useParticipants";
import { useBannedUsers } from "../hooks/useBannedUsers";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { useRoomDeletion } from "../hooks/useRoomDeletion";

// 컴포넌트들
import ParticipantManagement from "./ChatRoomHost/ParticipantManagement";
import BannedUsersManagement from "./ChatRoomHost/BannedUsersManagement";
import AnnouncementManagement from "./ChatRoomHost/AnnouncementManagement";
import RoomSettings from "./ChatRoomHost/RoomSettings";
import RoomDeletion from "./ChatRoomHost/RoomDeletion";

// 더미 유저 관련 import 제거됨

// 모달들
import TransferOwnershipModal from "./ChatRoomHost/modals/TransferOwnershipModal";
import BanUserModal from "./ChatRoomHost/modals/BanUserModal";
import AnnouncementModal from "./ChatRoomHost/modals/AnnouncementModal";

function ChatRoomHost() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  
  // 시청인증 설정 state
  const [certificationEnabled, setCertificationEnabled] = useState(true);
  const [watchMode, setWatchMode] = useState('partial'); // 'partial' | 'full'

  // 커스텀 훅들 사용
  const roomHook = useRoomData(roomId, navigate);
  const participantsHook = useParticipants(roomId, roomHook.isOwner, roomHook.myUid, roomHook.myEmail);
  const bannedUsersHook = useBannedUsers(roomId, roomHook.isOwner, roomHook.myUid, roomHook.myEmail);
  const announcementsHook = useAnnouncements(roomId, roomHook.isOwner, roomHook.myUid, roomHook.myEmail);
  const roomDeletionHook = useRoomDeletion(roomId, roomHook.roomData, navigate);



  // 시청인증 설정 자동 저장
  const handleSaveCertificationSettings = async (enabled, mode) => {
    try {
      await setDoc(doc(db, "chatRooms", roomId), {
        watchSettings: {
          enabled: enabled,
          watchMode: mode,
          updatedAt: new Date()
        }
      }, { merge: true });
      // console.log("시청 설정이 자동 저장되었습니다.");
    } catch (error) {
      console.error("시청 설정 저장 오류:", error);
      alert("설정 저장 중 오류가 발생했습니다.");
    }
  };

  // 토글 변경 시 자동 저장
  const handleToggleChange = async (newEnabled) => {
    setCertificationEnabled(newEnabled);
    await handleSaveCertificationSettings(newEnabled, watchMode);
  };

  // 시청 방식 변경 시 자동 저장
  const handleWatchModeChange = async (newMode) => {
    setWatchMode(newMode);
    await handleSaveCertificationSettings(certificationEnabled, newMode);
  };

  // 더미 유저 추가 함수 제거됨

  // 로딩 중이거나 방장이 아닌 경우
  if (roomHook.loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">권한 확인 중...</div>
        </div>
      </div>
    );
  }

  if (!roomHook.isOwner) {
    return null; // 이미 위에서 리다이렉션 처리됨
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-20">
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
        }
        
        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
        }
        
        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }
      `}</style>
      
      {/* 헤더 */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/chat/${roomId}`} className="text-white hover:bg-blue-700 p-1 rounded">
            ←
          </Link>
          <div>
            <h1 className="font-bold text-lg">방 관리</h1>
            <div className="text-sm opacity-90">{roomHook.roomData?.name}</div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-4 space-y-6">
        {/* 시청 방식 설정 - 카카오톡 스타일 (최상단 배치) */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <span className="text-xl">📺</span>
              영상 시청 방식 설정
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* 시청인증 기능 활성화/비활성화 - 토글 스위치 */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-gray-800">시청인증 기능 활성화</div>
                <div className="text-sm text-gray-500">사용자들의 영상 시청 방식을 관리합니다</div>
              </div>
              
                              {/* 커스텀 토글 스위치 */}
                <button
                  onClick={() => handleToggleChange(!certificationEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    certificationEnabled 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                      : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      certificationEnabled ? 'transform translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {/* 시청 방식 설정 - 카카오톡 스타일 선택지 */}
              {certificationEnabled && (
                <>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="font-medium text-gray-800 mb-3">콘텐츠 시청방식 선택</div>
                    <div className="text-sm text-gray-600 mb-4">
                      방장님이 원하는 시청 방식을 선택해주세요. 사용자들은 이 설정에 따라 영상을 시청하게 됩니다.
                    </div>
                    <div className="space-y-3">
                      <label 
                        className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                          watchMode === 'partial' 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200' 
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            watchMode === 'partial' ? 'border-blue-500' : 'border-gray-300'
                          }`}>
                            {watchMode === 'partial' && (
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            )}
                          </div>
                          <input 
                            type="radio" 
                            name="watchMode" 
                            value="partial" 
                            checked={watchMode === 'partial'}
                            onChange={(e) => handleWatchModeChange(e.target.value)}
                            className="sr-only" 
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚡</span>
                            <span className="font-medium text-gray-800">부분 시청 허용</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            3분 이상 시청하면 충분해요!<br/>
                            <span className="text-xs">(3분 미만 영상은 끝까지 시청 필요)</span>
                          </div>
                        </div>
                      </label>

                      <label 
                        className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                          watchMode === 'full' 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-emerald-200' 
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            watchMode === 'full' ? 'border-emerald-500' : 'border-gray-300'
                          }`}>
                            {watchMode === 'full' && (
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            )}
                          </div>
                          <input 
                            type="radio" 
                            name="watchMode" 
                            value="full"
                            checked={watchMode === 'full'}
                            onChange={(e) => handleWatchModeChange(e.target.value)}
                            className="sr-only" 
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎯</span>
                            <span className="font-medium text-gray-800">전체 시청 필수</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            모든 영상을 끝까지 완주해야 해요!
                          </div>
                        </div>
                      </label>
                    </div>
                                    </div>
                </>
              )}
                      </div>
          </section>

        {/* 더미 유저 추가 섹션 제거됨 */}

        {/* 참여자 관리 */}
        <ParticipantManagement
          participants={participantsHook.participants}
          myUid={roomHook.myUid}
          myEmail={roomHook.myEmail}
          formatJoinTime={participantsHook.formatJoinTime}
          onKickParticipant={participantsHook.handleKickParticipant}
          onShowTransferModal={() => participantsHook.setShowTransferModal(true)}
          onShowBanModal={() => bannedUsersHook.setShowBanModal(true)}
          setSelectedTransferUser={participantsHook.setSelectedTransferUser}
          setSelectedBanUser={bannedUsersHook.setSelectedBanUser}
        />

        {/* 차단된 사용자 관리 */}
        <BannedUsersManagement
          bannedUsers={bannedUsersHook.bannedUsers}
          onUnbanUser={bannedUsersHook.handleUnbanUser}
        />

        {/* 공지사항 관리 */}
        <AnnouncementManagement
          announcements={announcementsHook.announcements}
          onShowAnnouncementModal={() => announcementsHook.setShowAnnouncementModal(true)}
          onEditAnnouncement={announcementsHook.handleEditAnnouncement}
          onDeleteAnnouncement={announcementsHook.handleDeleteAnnouncement}
          onToggleImportant={announcementsHook.handleToggleImportant}
        />

        {/* 방 설정 변경 */}
        <RoomSettings
          roomData={roomHook.roomData}
          editingSettings={roomHook.editingSettings}
          setEditingSettings={roomHook.setEditingSettings}
          editedName={roomHook.editedName}
          setEditedName={roomHook.setEditedName}
          editedDesc={roomHook.editedDesc}
          setEditedDesc={roomHook.setEditedDesc}
          editedHashtags={roomHook.editedHashtags}
          setEditedHashtags={roomHook.setEditedHashtags}
          editedMaxParticipants={roomHook.editedMaxParticipants}
          setEditedMaxParticipants={roomHook.setEditedMaxParticipants}
          savingSettings={roomHook.savingSettings}
          onSaveSettings={roomHook.handleSaveSettings}
          onCancelEdit={roomHook.handleCancelEdit}
        />



        {/* 방 삭제 */}
        <RoomDeletion
          roomData={roomHook.roomData}
          showDeleteConfirm={roomDeletionHook.showDeleteConfirm}
          setShowDeleteConfirm={roomDeletionHook.setShowDeleteConfirm}
          deleteConfirmName={roomDeletionHook.deleteConfirmName}
          setDeleteConfirmName={roomDeletionHook.setDeleteConfirmName}
          deletingRoom={roomDeletionHook.deletingRoom}
          onDeleteRoom={roomDeletionHook.handleDeleteRoom}
          onCancelDelete={roomDeletionHook.handleCancelDelete}
        />
      </div>

      {/* 모달들 */}
      <TransferOwnershipModal
        show={participantsHook.showTransferModal}
        participants={participantsHook.participants}
        selectedTransferUser={participantsHook.selectedTransferUser}
        setSelectedTransferUser={participantsHook.setSelectedTransferUser}
        transferConfirmText={participantsHook.transferConfirmText}
        setTransferConfirmText={participantsHook.setTransferConfirmText}
        transferringOwnership={participantsHook.transferringOwnership}
        formatJoinTime={participantsHook.formatJoinTime}
        myUid={roomHook.myUid}
        myEmail={roomHook.myEmail}
        onTransferOwnership={participantsHook.handleTransferOwnership}
        onCancel={participantsHook.handleCancelTransfer}
      />

      <BanUserModal
        show={bannedUsersHook.showBanModal}
        selectedBanUser={bannedUsersHook.selectedBanUser}
        banReason={bannedUsersHook.banReason}
        setBanReason={bannedUsersHook.setBanReason}
        banning={bannedUsersHook.banning}
        onBanUser={bannedUsersHook.handleBanUser}
        onCancel={bannedUsersHook.handleCancelBan}
      />

      <AnnouncementModal
        show={announcementsHook.showAnnouncementModal}
        editingAnnouncement={announcementsHook.editingAnnouncement}
        announcementTitle={announcementsHook.announcementTitle}
        setAnnouncementTitle={announcementsHook.setAnnouncementTitle}
        announcementContent={announcementsHook.announcementContent}
        setAnnouncementContent={announcementsHook.setAnnouncementContent}
        announcementImportant={announcementsHook.announcementImportant}
        setAnnouncementImportant={announcementsHook.setAnnouncementImportant}
        savingAnnouncement={announcementsHook.savingAnnouncement}
        onSaveAnnouncement={announcementsHook.handleSaveAnnouncement}
        onCancel={announcementsHook.handleCancelAnnouncement}
      />
    </div>
  );
}

export default ChatRoomHost; 
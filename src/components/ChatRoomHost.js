import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";

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

// 모달들
import TransferOwnershipModal from "./ChatRoomHost/modals/TransferOwnershipModal";
import BanUserModal from "./ChatRoomHost/modals/BanUserModal";
import AnnouncementModal from "./ChatRoomHost/modals/AnnouncementModal";

function ChatRoomHost() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [videoList, setVideoList] = useState([]);
  const [videoListState, setVideoListState] = useState([]);

  // 커스텀 훅들 사용
  const roomHook = useRoomData(roomId, navigate);
  const participantsHook = useParticipants(roomId, roomHook.isOwner, roomHook.myUid, roomHook.myEmail);
  const bannedUsersHook = useBannedUsers(roomId, roomHook.isOwner, roomHook.myUid, roomHook.myEmail);
  const announcementsHook = useAnnouncements(roomId, roomHook.isOwner, roomHook.myUid, roomHook.myEmail);
  const roomDeletionHook = useRoomDeletion(roomId, roomHook.roomData, navigate);

  // 영상 리스트 실시간 구독 (아직 분리 안함)
  useEffect(() => {
    if (!roomId || !roomHook.isOwner) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVideoList(list);
      setVideoListState(list);
    });
    return () => unsub();
  }, [roomId, roomHook.isOwner]);

  // 영상 삭제 (아직 분리 안함)
  const handleDeleteVideo = async (videoId) => {
    if (window.confirm("정말 이 영상을 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "chatRooms", roomId, "videos", videoId));
    }
  };

  // 영상 순서 변경 (아직 분리 안함)
  const handleMoveVideo = async (idx, dir) => {
    const newList = [...videoListState];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newList.length) return;
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    setVideoListState(newList);
  };

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
    <div className="max-w-md mx-auto bg-white min-h-screen">
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

        {/* 영상 관리 */}
        <section>
          <Link to={`/chat/${roomId}/host/videos`} className="block font-bold text-base mb-2 text-blue-600 hover:underline cursor-pointer">🎥 영상 관리</Link>
          <div className="flex flex-col gap-2">
            {videoListState.length === 0 && <div className="text-gray-400">등록된 영상이 없습니다.</div>}
            {videoListState.map((video, idx) => (
              <div key={video.id} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                <img src={video.thumbnail} alt="썸네일" className="w-16 h-10 object-cover rounded" />
                <div className="truncate font-bold flex-1">{video.title}</div>
                <button disabled={idx === 0} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200" onClick={() => handleMoveVideo(idx, -1)}>▲</button>
                <button disabled={idx === videoListState.length - 1} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200" onClick={() => handleMoveVideo(idx, 1)}>▼</button>
                <button className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600" onClick={() => handleDeleteVideo(video.id)}>삭제</button>
              </div>
            ))}
          </div>
        </section>

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
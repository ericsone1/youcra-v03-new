import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, getDocs, getDoc, updateDoc } from "firebase/firestore";

function ChatRoomHost() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [videoList, setVideoList] = useState([]);
  const [videoListState, setVideoListState] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 방 설정 편집 상태
  const [editingSettings, setEditingSettings] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDesc, setEditedDesc] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [editedMaxParticipants, setEditedMaxParticipants] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // 방 삭제 관련 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deletingRoom, setDeletingRoom] = useState(false);
  
  // 방장 권한 위임 관련 상태
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferUser, setSelectedTransferUser] = useState(null);
  const [transferConfirmText, setTransferConfirmText] = useState("");
  const [transferringOwnership, setTransferringOwnership] = useState(false);
  
  // 참여자 차단 관련 상태
  const [bannedUsers, setBannedUsers] = useState([]);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedBanUser, setSelectedBanUser] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);

  // 공지사항 관리 관련 상태
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementImportant, setAnnouncementImportant] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // 방장 확인 로직 - UID 기반으로 수정
  const myEmail = auth.currentUser?.email;
  const myUid = auth.currentUser?.uid;
  const isOwner = roomData && myUid && (
    roomData.createdBy === myUid ||      // UID 기반 비교 (핵심)
    roomData.ownerEmail === myEmail      // 이메일 기반 백업
  );

  // 채팅방 정보 및 권한 확인
  useEffect(() => {
    if (!roomId || !auth.currentUser) return;

    const fetchRoomData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        if (roomDoc.exists()) {
          const data = roomDoc.data();
          setRoomData(data);
          
          // 편집 폼 초기값 설정
          setEditedName(data.name || "");
          setEditedDesc(data.desc || "");
          setEditedHashtags(data.hashtags ? data.hashtags.join(" #") : "");
          setEditedMaxParticipants(data.maxParticipants || 10);
          
          // 방장이 아니면 접근 차단 - UID 기반으로 수정
          const isOwnerCheck = myUid && (
            data.createdBy === myUid || 
            data.ownerEmail === myEmail
          );
          
          if (!isOwnerCheck) {
            alert("방장만 접근할 수 있습니다.");
            navigate(`/chat/${roomId}`);
            return;
          }
        } else {
          alert("채팅방을 찾을 수 없습니다.");
          navigate("/chat");
          return;
        }
      } catch (error) {
        console.error("방 정보 확인 오류:", error);
        alert("방 정보를 확인할 수 없습니다.");
        navigate(`/chat/${roomId}`);
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, navigate, myEmail, myUid]);

  // 참여자 목록 실시간 구독
  useEffect(() => {
    if (!roomId || !isOwner) return;
    
    const participantsQuery = query(
      collection(db, "chatRooms", roomId, "participants"), 
      orderBy("joinedAt", "desc")
    );
    
    const unsubParticipants = onSnapshot(participantsQuery, (snapshot) => {
      const participantsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setParticipants(participantsList);
    });

    return () => unsubParticipants();
  }, [roomId, isOwner]);

  // 차단된 사용자 목록 실시간 구독
  useEffect(() => {
    if (!roomId || !isOwner) return;
    
    const bannedQuery = query(
      collection(db, "chatRooms", roomId, "banned"), 
      orderBy("bannedAt", "desc")
    );
    
    const unsubBanned = onSnapshot(bannedQuery, (snapshot) => {
      const bannedList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setBannedUsers(bannedList);
    });

    return () => unsubBanned();
  }, [roomId, isOwner]);

  // 영상 리스트 실시간 구독
  useEffect(() => {
    if (!roomId || !isOwner) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVideoList(list);
      setVideoListState(list);
    });
    return () => unsub();
  }, [roomId, isOwner]);

  // 공지사항 목록 실시간 구독
  useEffect(() => {
    if (!roomId || !isOwner) return;
    
    const announcementsQuery = query(
      collection(db, "chatRooms", roomId, "announcements"), 
      orderBy("createdAt", "desc")
    );
    
    const unsubAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      const announcementsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsList);
    });

    return () => unsubAnnouncements();
  }, [roomId, isOwner]);

  // 로딩 중이거나 방장이 아닌 경우
  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">권한 확인 중...</div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null; // 이미 위에서 리다이렉션 처리됨
  }

  // 해시태그 파싱 함수
  const parseHashtags = (hashtagString) => {
    if (!hashtagString.trim()) return [];
    return hashtagString
      .split(/\s+/)
      .map(tag => tag.replace(/^#+/, '').trim())
      .filter(tag => tag.length > 0);
  };

  // 방 설정 저장
  const handleSaveSettings = async () => {
    if (!editedName.trim()) {
      alert("방 이름을 입력해주세요.");
      return;
    }

    if (editedMaxParticipants < 1 || editedMaxParticipants > 100) {
      alert("최대 참여자 수는 1~100명 사이여야 합니다.");
      return;
    }

    setSavingSettings(true);
    try {
      const updatedData = {
        name: editedName.trim(),
        desc: editedDesc.trim(),
        hashtags: parseHashtags(editedHashtags),
        maxParticipants: editedMaxParticipants
      };

      await updateDoc(doc(db, "chatRooms", roomId), updatedData);
      
      // 로컬 상태 업데이트
      setRoomData(prev => ({
        ...prev,
        ...updatedData
      }));
      
      setEditingSettings(false);
      alert("방 설정이 저장되었습니다.");
    } catch (error) {
      console.error("방 설정 저장 오류:", error);
      alert("방 설정 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingSettings(false);
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditedName(roomData?.name || "");
    setEditedDesc(roomData?.desc || "");
    setEditedHashtags(roomData?.hashtags ? roomData.hashtags.join(" #") : "");
    setEditedMaxParticipants(roomData?.maxParticipants || 10);
    setEditingSettings(false);
  };

  // 참여자 강퇴
  const handleKickParticipant = async (participantId, participantEmail) => {
    // 방장 본인은 강퇴할 수 없음
    if (participantId === myUid || participantEmail === myEmail) {
      alert("방장은 강퇴할 수 없습니다.");
      return;
    }
    
    if (!window.confirm(`정말 ${participantEmail}님을 강퇴하시겠습니까?`)) return;
    
    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "participants", participantId));
      alert("참여자가 강퇴되었습니다.");
    } catch (error) {
      console.error("강퇴 중 오류:", error);
      alert("강퇴 중 오류가 발생했습니다.");
    }
  };

  // 영상 삭제
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("정말 이 영상을 삭제할까요?")) return;
    await deleteDoc(doc(db, "chatRooms", roomId, "videos", videoId));
  };

  // 영상 순서 변경
  const handleMoveVideo = async (idx, dir) => {
    const newList = [...videoListState];
    const target = newList[idx];
    newList.splice(idx, 1);
    newList.splice(idx + dir, 0, target);
    setVideoListState(newList);
    // Firestore registeredAt swap
    const a = newList[idx];
    const b = newList[idx + dir];
    if (a && b) {
      const aRef = doc(db, "chatRooms", roomId, "videos", a.id);
      const bRef = doc(db, "chatRooms", roomId, "videos", b.id);
      const aTime = a.registeredAt;
      const bTime = b.registeredAt;
      await setDoc(aRef, { registeredAt: bTime }, { merge: true });
      await setDoc(bRef, { registeredAt: aTime }, { merge: true });
    }
  };

  // 시간 포맷팅 함수
  const formatJoinTime = (timestamp) => {
    if (!timestamp) return "알 수 없음";
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000) 
      : new Date(timestamp);
    return date.toLocaleString();
  };

  // 방 삭제 함수
  const handleDeleteRoom = async () => {
    if (deleteConfirmName !== roomData?.name) {
      alert("방 이름을 정확히 입력해주세요.");
      return;
    }

    if (!window.confirm("정말로 이 채팅방을 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!\n- 모든 메시지가 삭제됩니다\n- 모든 참여자가 제거됩니다\n- 모든 영상이 삭제됩니다")) {
      return;
    }

    setDeletingRoom(true);
    try {
      // 1. 메시지 삭제
      const messagesSnapshot = await getDocs(collection(db, "chatRooms", roomId, "messages"));
      const messageDeletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(messageDeletePromises);

      // 2. 참여자 삭제
      const participantsSnapshot = await getDocs(collection(db, "chatRooms", roomId, "participants"));
      const participantDeletePromises = participantsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(participantDeletePromises);

      // 3. 영상 삭제
      const videosSnapshot = await getDocs(collection(db, "chatRooms", roomId, "videos"));
      const videoDeletePromises = videosSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(videoDeletePromises);

      // 4. 채팅방 자체 삭제
      await deleteDoc(doc(db, "chatRooms", roomId));

      alert("채팅방이 완전히 삭제되었습니다.");
      navigate("/chat");
    } catch (error) {
      console.error("방 삭제 중 오류:", error);
      alert("방 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingRoom(false);
    }
  };

  // 삭제 확인 취소
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmName("");
  };

  // 방장 권한 위임 함수
  const handleTransferOwnership = async () => {
    if (!selectedTransferUser) {
      alert("위임할 사용자를 선택해주세요.");
      return;
    }

    if (transferConfirmText !== "권한 위임") {
      alert("'권한 위임'을 정확히 입력해주세요.");
      return;
    }

    if (!window.confirm(`정말로 ${selectedTransferUser.email}님에게 방장 권한을 위임하시겠습니까?\n\n⚠️ 이 작업 후에는 방 관리 권한을 잃게 됩니다!`)) {
      return;
    }

    setTransferringOwnership(true);
    try {
      // 채팅방 데이터 업데이트 (새 방장 정보로)
      await updateDoc(doc(db, "chatRooms", roomId), {
        createdBy: selectedTransferUser.id,
        ownerEmail: selectedTransferUser.email,
        transferredAt: new Date(),
        previousOwner: myEmail
      });

      alert(`${selectedTransferUser.email}님에게 방장 권한이 위임되었습니다.`);
      
      // 일반 채팅방으로 리다이렉션 (더 이상 방장이 아니므로)
      navigate(`/chat/${roomId}`);
    } catch (error) {
      console.error("권한 위임 중 오류:", error);
      alert("권한 위임 중 오류가 발생했습니다.");
    } finally {
      setTransferringOwnership(false);
    }
  };

  // 권한 위임 취소
  const handleCancelTransfer = () => {
    setShowTransferModal(false);
    setSelectedTransferUser(null);
    setTransferConfirmText("");
  };

  // 참여자 차단
  const handleBanUser = async () => {
    if (!selectedBanUser) {
      alert("차단할 사용자를 선택해주세요.");
      return;
    }

    if (!banReason.trim()) {
      alert("차단 사유를 입력해주세요.");
      return;
    }

    setBanning(true);
    try {
      // 1. 차단 목록에 추가
      await setDoc(doc(db, "chatRooms", roomId, "banned", selectedBanUser.id), {
        email: selectedBanUser.email,
        uid: selectedBanUser.id,
        bannedBy: myUid,
        bannedByEmail: myEmail,
        bannedAt: new Date(),
        reason: banReason.trim(),
        originalJoinedAt: selectedBanUser.joinedAt
      });

      // 2. 참여자 목록에서 제거
      await deleteDoc(doc(db, "chatRooms", roomId, "participants", selectedBanUser.id));

      alert(`${selectedBanUser.email}님이 차단되었습니다.`);
      handleCancelBan();
    } catch (error) {
      console.error("차단 중 오류:", error);
      alert("차단 중 오류가 발생했습니다.");
    } finally {
      setBanning(false);
    }
  };

  // 차단 해제
  const handleUnbanUser = async (bannedUser) => {
    if (!window.confirm(`정말 ${bannedUser.email}님의 차단을 해제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "banned", bannedUser.id));
      alert(`${bannedUser.email}님의 차단이 해제되었습니다.`);
    } catch (error) {
      console.error("차단 해제 중 오류:", error);
      alert("차단 해제 중 오류가 발생했습니다.");
    }
  };

  // 차단 모달 취소
  const handleCancelBan = () => {
    setShowBanModal(false);
    setSelectedBanUser(null);
    setBanReason("");
  };

  // 공지사항 저장
  const handleSaveAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      alert("공지사항 제목을 입력해주세요.");
      return;
    }

    if (!announcementContent.trim()) {
      alert("공지사항 내용을 입력해주세요.");
      return;
    }

    setSavingAnnouncement(true);
    try {
      const announcementData = {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        important: announcementImportant,
        createdBy: myUid,
        createdByEmail: myEmail,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingAnnouncement) {
        // 기존 공지사항 수정
        await updateDoc(doc(db, "chatRooms", roomId, "announcements", editingAnnouncement.id), {
          ...announcementData,
          createdAt: editingAnnouncement.createdAt // 생성일은 유지
        });
        alert("공지사항이 수정되었습니다.");
      } else {
        // 새 공지사항 추가
        await setDoc(doc(collection(db, "chatRooms", roomId, "announcements")), announcementData);
        alert("공지사항이 등록되었습니다.");
      }

      handleCancelAnnouncement();
    } catch (error) {
      console.error("공지사항 저장 중 오류:", error);
      alert("공지사항 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // 공지사항 삭제
  const handleDeleteAnnouncement = async (announcementId, title) => {
    if (!window.confirm(`정말 "${title}" 공지사항을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "announcements", announcementId));
      alert("공지사항이 삭제되었습니다.");
    } catch (error) {
      console.error("공지사항 삭제 중 오류:", error);
      alert("공지사항 삭제 중 오류가 발생했습니다.");
    }
  };

  // 공지사항 편집 시작
  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementTitle(announcement.title);
    setAnnouncementContent(announcement.content);
    setAnnouncementImportant(announcement.important || false);
    setShowAnnouncementModal(true);
  };

  // 공지사항 모달 취소
  const handleCancelAnnouncement = () => {
    setShowAnnouncementModal(false);
    setEditingAnnouncement(null);
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementImportant(false);
  };

  // 공지사항 중요도 토글
  const handleToggleImportant = async (announcementId, currentImportant) => {
    try {
      await updateDoc(doc(db, "chatRooms", roomId, "announcements", announcementId), {
        important: !currentImportant,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("중요도 변경 중 오류:", error);
      alert("중요도 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-0">
      {/* 상단바 */}
      <div className="flex items-center p-4 border-b">
        <button onClick={() => navigate(-1)} className="mr-2 text-lg text-gray-500">←</button>
        <div className="font-bold text-lg flex-1 text-center">방장 관리</div>
      </div>
      
      <div className="p-4 flex flex-col gap-6">
        {/* 방 정보 */}
        <section>
          <h2 className="font-bold text-base mb-2">📋 방 정보</h2>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm"><span className="font-semibold">방 이름:</span> {roomData?.name}</div>
            <div className="text-sm mt-1"><span className="font-semibold">생성일:</span> {formatJoinTime(roomData?.createdAt)}</div>
            <div className="text-sm mt-1"><span className="font-semibold">참여자 수:</span> {participants.length}명</div>
            {roomData?.hashtags && roomData.hashtags.length > 0 && (
              <div className="text-sm mt-1">
                <span className="font-semibold">해시태그:</span> {roomData.hashtags.map(tag => `#${tag}`).join(" ")}
              </div>
            )}
          </div>
        </section>

        {/* 참여자 관리 */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-base">👥 참여자 관리</h2>
            {participants.length > 1 && (
              <button
                onClick={() => setShowTransferModal(true)}
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
              participants.map((participant, index) => {
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
                            setShowTransferModal(true);
                          }}
                          className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition"
                        >
                          권한위임
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBanUser(participant);
                            setShowBanModal(true);
                          }}
                          className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition"
                        >
                          차단
                        </button>
                        <button
                          onClick={() => handleKickParticipant(participant.id, participant.email)}
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

        {/* 차단된 사용자 관리 */}
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
                      onClick={() => handleUnbanUser(bannedUser)}
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

        {/* 공지사항 관리 */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-base">📢 공지사항 관리</h2>
            <button
              onClick={() => setShowAnnouncementModal(true)}
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
                        onClick={() => handleToggleImportant(announcement.id, announcement.important)}
                        className={`px-2 py-1 text-xs rounded transition ${
                          announcement.important
                            ? "bg-gray-500 text-white hover:bg-gray-600"
                            : "bg-yellow-500 text-white hover:bg-yellow-600"
                        }`}
                      >
                        {announcement.important ? "중요해제" : "중요설정"}
                      </button>
                      <button
                        onClick={() => handleEditAnnouncement(announcement)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id, announcement.title)}
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

        {/* 방 설정 변경 */}
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
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {savingSettings ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={handleCancelEdit}
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
        <section>
          <h2 className="font-bold text-base mb-2 text-red-600">⚠️ 방 삭제</h2>
          {!showDeleteConfirm ? (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500 text-white py-2 rounded font-bold hover:bg-red-600 transition"
            >
              채팅방 삭제
            </button>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 space-y-4">
              <div className="text-center">
                <div className="text-red-600 font-bold text-lg mb-2">⚠️ 위험한 작업</div>
                <div className="text-sm text-gray-700 mb-4">
                  이 작업은 <span className="font-bold">되돌릴 수 없습니다</span>.<br/>
                  모든 메시지, 참여자, 영상이 영구 삭제됩니다.
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-red-700">
                  확인을 위해 방 이름을 입력하세요:
                </label>
                <div className="text-xs text-gray-600 mb-2">
                  입력해야 할 방 이름: <span className="font-bold text-red-600">"{roomData?.name}"</span>
                </div>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="방 이름을 정확히 입력하세요"
                  disabled={deletingRoom}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDeleteRoom}
                  disabled={deletingRoom || deleteConfirmName !== roomData?.name}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingRoom ? "삭제 중..." : "영구 삭제"}
                </button>
                <button
                  onClick={handleCancelDelete}
                  disabled={deletingRoom}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-bold hover:bg-gray-600 transition disabled:opacity-50"
                >
                  취소
                </button>
              </div>
              
              {deleteConfirmName && deleteConfirmName !== roomData?.name && (
                <div className="text-xs text-red-500 text-center">
                  방 이름이 일치하지 않습니다.
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* 권한 위임 모달 */}
      {showTransferModal && (
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
                  onClick={handleCancelTransfer}
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
                    onClick={handleTransferOwnership}
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
      )}

      {/* 차단 모달 */}
      {showBanModal && selectedBanUser && (
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
                onClick={handleBanUser}
                disabled={banning || !banReason.trim()}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {banning ? "차단 중..." : "차단하기"}
              </button>
              <button
                onClick={handleCancelBan}
                disabled={banning}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공지사항 모달 */}
      {showAnnouncementModal && (
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
                onClick={handleSaveAnnouncement}
                disabled={savingAnnouncement || !announcementTitle.trim() || !announcementContent.trim()}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingAnnouncement ? "저장 중..." : (editingAnnouncement ? "수정하기" : "등록하기")}
              </button>
              <button
                onClick={handleCancelAnnouncement}
                disabled={savingAnnouncement}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRoomHost;
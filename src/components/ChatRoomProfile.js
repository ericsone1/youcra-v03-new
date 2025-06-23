import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth, storage } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getRoomTypeInfo, getAllRoomTypes } from "../utils/roomTypeUtils";

function ChatRoomProfile() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    profileImage: "",
    coverImage: "",
    roomType: "",
    isPrivate: false,
    password: "",
    hashtags: ""
  });
  const [uploading, setUploading] = useState(false);

  // 방 정보 및 방장 정보 불러오기
  useEffect(() => {
    async function fetchRoomAndOwner() {
      try {
        // 방 정보 가져오기
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        if (roomDoc.exists()) {
          const room = roomDoc.data();
          setRoomData(room);

          // 방장 정보 가져오기
          if (room.createdBy) {
            const ownerDoc = await getDoc(doc(db, "users", room.createdBy));
            if (ownerDoc.exists()) {
              setOwnerData(ownerDoc.data());
            }
          }
        }
      } catch (error) {
        console.error("방 정보 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRoomAndOwner();
  }, [roomId]);

  // 참여자 리스트 불러오기
  useEffect(() => {
    if (!roomId) return;
    const q = collection(db, "chatRooms", roomId, "participants");
    const unsub = onSnapshot(q, (snapshot) => {
      const participantsList = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setParticipants(participantsList);
      
      // 디버깅: 참여자 수 확인
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [채팅방 프로필] ${roomId} 참여자 수:`, snapshot.size);
        console.log('🔍 [채팅방 프로필] 참여자 목록:', participantsList.map(p => p.id));
        console.log('🔍 [채팅방 프로필] participants.length:', participantsList.length);
        console.log('🔍 [채팅방 프로필] snapshot.size:', snapshot.size);
      }
    });
    return () => unsub();
  }, [roomId]);

  // 영상 리스트 불러오기
  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const videosList = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setVideos(videosList);
    });
    return () => unsub();
  }, [roomId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-gray-600">채팅방 정보를 불러오는 중...</div>
      </div>
    </div>
  );

  if (!roomData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">😅</div>
        <div className="text-gray-600">채팅방 정보를 찾을 수 없습니다.</div>
      </div>
    </div>
  );

  const roomTypeInfo = getRoomTypeInfo(roomData.roomType);
  const isOwner = auth.currentUser?.uid === roomData.createdBy;

  // 방 정보 수정 모달 열기
  const openEditModal = () => {
    const hashtagsString = roomData.hashtags && roomData.hashtags.length > 0 
      ? roomData.hashtags.map(tag => `#${tag}`).join(' ') 
      : "";
    
    setEditFormData({
      name: roomData.name || "",
      description: roomData.description || roomData.desc || "",
      profileImage: roomData.profileImage || "",
      coverImage: roomData.coverImage || "",
      roomType: roomData.roomType || "chat",
      isPrivate: roomData.isPrivate || false,
      password: roomData.password || "",
      hashtags: hashtagsString
    });
    setIsEditModalOpen(true);
  };

  // 이미지 업로드 함수
  const uploadImage = async (file, path) => {
    try {
      const imageRef = ref(storage, `chatrooms/${roomId}/${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      throw error;
    }
  };

  // 프로필 이미지 변경
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 5MB 이하로 업로드해주세요.");
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file, "profile");
      setEditFormData(prev => ({ ...prev, profileImage: imageUrl }));
    } catch (error) {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // 커버 이미지 변경
  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 5MB 이하로 업로드해주세요.");
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file, "cover");
      setEditFormData(prev => ({ ...prev, coverImage: imageUrl }));
    } catch (error) {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // 해시태그 파싱 함수
  const parseHashtags = (text) => {
    const hashtagRegex = /#[\w가-힣]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
  };

  // 추천 해시태그 추가
  const addRecommendedHashtag = (tag) => {
    const currentTags = parseHashtags(editFormData.hashtags);
    if (!currentTags.includes(tag.toLowerCase())) {
      const newHashtags = editFormData.hashtags + (editFormData.hashtags ? " " : "") + "#" + tag;
      setEditFormData(prev => ({ ...prev, hashtags: newHashtags }));
    }
  };

  // 방 정보 저장
  const handleSaveRoomInfo = async () => {
    try {
      setUploading(true);
      
      // 유효성 검사
      if (!editFormData.name.trim()) {
        alert("방 이름을 입력해주세요.");
        return;
      }
      if (!editFormData.roomType) {
        alert("방 타입을 선택해주세요.");
        return;
      }
      if (editFormData.isPrivate && !editFormData.password.trim()) {
        alert("비밀방의 경우 비밀번호를 입력해주세요.");
        return;
      }
      if (editFormData.isPrivate && editFormData.password.length < 4) {
        alert("비밀번호는 4자리 이상 입력해주세요.");
        return;
      }

      const updateData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        roomType: editFormData.roomType,
        isPrivate: editFormData.isPrivate,
        password: editFormData.isPrivate ? editFormData.password : null,
        hashtags: parseHashtags(editFormData.hashtags),
        updatedAt: new Date()
      };

      if (editFormData.profileImage) {
        updateData.profileImage = editFormData.profileImage;
      }

      if (editFormData.coverImage) {
        updateData.coverImage = editFormData.coverImage;
      }

      await updateDoc(doc(db, "chatRooms", roomId), updateData);
      
      // 로컬 상태 업데이트
      setRoomData(prev => ({
        ...prev,
        ...updateData
      }));
      
      setIsEditModalOpen(false);
      alert("방 정보가 성공적으로 수정되었습니다!");
    } catch (error) {
      console.error("방 정보 수정 실패:", error);
      alert("방 정보 수정에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen pb-safe">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-gradient-to-r from-blue-100 to-indigo-100 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-2xl text-blue-600 hover:text-blue-800">
          ←
        </button>
        <div className="flex-1 text-center font-bold text-lg text-blue-800">채팅방 프로필</div>
        <div className="w-8" />
      </div>

      {/* 커버 이미지 */}
      <div className="relative h-52 bg-gradient-to-r from-blue-400 to-purple-500">
        {(roomData.coverImage || roomData.youtubeVideoId) && (
          <img 
            src={roomData.coverImage || `https://img.youtube.com/vi/${roomData.youtubeVideoId}/maxresdefault.jpg`} 
            alt="방 커버" 
            className="w-full h-full object-cover" 
          />
        )}
        {/* 방 프로필 이미지 */}
        <div className="absolute left-1/2 -bottom-10 transform -translate-x-1/2">
          <img 
            src={roomData.profileImage || "https://picsum.photos/seed/chatroom/120/120"} 
            alt="방 프로필" 
            className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-200 object-cover" 
          />
        </div>
      </div>

      {/* 방 정보 */}
      <div className="pt-14 pb-4 text-center px-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="font-bold text-lg">{roomData.name}</div>
          {/* 방장인 경우 수정 버튼 표시 */}
          {isOwner && (
            <button
              onClick={openEditModal}
              className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
              title="방 정보 수정"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          {roomTypeInfo.name} • 참여자 {participants.length}명
        </div>
        
        {/* 방 설명 */}
        {(roomData.description || roomData.desc) && (
          <div className="text-gray-600 text-sm mt-2 mb-3 px-2">
            {roomData.description || roomData.desc}
          </div>
        )}

        {/* 해시태그 */}
        {roomData.hashtags && roomData.hashtags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mb-3">
            {roomData.hashtags.slice(0, 5).map((tag, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 방장 정보 및 1:1 채팅 버튼 */}
      {ownerData && (
        <div className="px-4 mb-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  👑
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">
                    {ownerData.displayName || ownerData.email?.split('@')[0] || '방장'}
                  </div>
                  <div className="text-yellow-600 text-xs font-medium">방장</div>
                </div>
              </div>
              {!isOwner && (
                <button
                  onClick={() => navigate(`/dm/${roomData.createdBy}`)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-1"
                >
                  💬 1:1 채팅
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 채팅방 입장 버튼 */}
      <div className="px-4 mb-4">
        <button
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-3"
          onClick={() => navigate(`/chat/${roomId}`)}
        >
          🚪 채팅방 입장하기
        </button>
      </div>

      {/* 방 통계 */}
      <div className="px-4 mb-4">
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg p-4">
          <h3 className="font-bold text-blue-800 mb-3 text-center">방 통계</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{participants.length}</div>
              <div className="text-xs text-blue-500">참여자</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{videos.length}</div>
              <div className="text-xs text-blue-500">영상</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{roomData.viewCount || 0}</div>
              <div className="text-xs text-blue-500">조회수</div>
            </div>
          </div>
        </div>
      </div>

      {/* 방장 전용 관리 메뉴 */}
      {isOwner && (
        <div className="px-4 mb-4">
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg">
            <button
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-blue-50/50 transition-colors"
              onClick={() => navigate(`/chat/${roomId}/manage`)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <div>
                  <div className="font-medium text-blue-800 text-left">방 관리</div>
                  <div className="text-sm text-blue-600">방장 전용</div>
                </div>
              </div>
              <span className="text-blue-400">›</span>
            </button>
          </div>
        </div>
      )}

      {/* 방 정보 수정 모달 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200">
            <div className="sticky top-0 bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">방 정보 수정</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 방 타입 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🏷️ 방 타입 선택 (필수)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {                  getAllRoomTypes().map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, roomType: type.id }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        editFormData.roomType === type.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={uploading}
                    >
                      <div className="font-medium text-xs">{type.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 공개/비밀방 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🔒 방 공개 설정
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setEditFormData(prev => ({ ...prev, isPrivate: false, password: "" }))}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      !editFormData.isPrivate
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={uploading}
                  >
                    <div className="font-medium text-sm">🌍 공개방</div>
                    <div className="text-xs text-gray-500 mt-1">누구나 참여할 수 있어요</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setEditFormData(prev => ({ ...prev, isPrivate: true }))}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      editFormData.isPrivate
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={uploading}
                  >
                    <div className="font-medium text-sm">🔐 비밀방</div>
                    <div className="text-xs text-gray-500 mt-1">비밀번호가 있어야 참여할 수 있어요</div>
                  </button>
                </div>

                {/* 비밀번호 입력 (비밀방 선택 시만 표시) */}
                {editFormData.isPrivate && (
                  <div className="mt-3">
                    <input
                      type="password"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="비밀번호 (4자리 이상)"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                      maxLength={20}
                      disabled={uploading}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      * 비밀번호는 방 입장 시 필요합니다 ({editFormData.password.length}/20)
                    </div>
                  </div>
                )}
              </div>

              {/* 방 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  방 이름 (필수)
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="방 이름을 입력하세요"
                  maxLength={30}
                />
                <div className="text-xs text-gray-400 text-right mt-1">{editFormData.name.length}/30</div>
              </div>

              {/* 방 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  방 설명
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="방 설명을 입력하세요"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-gray-400 text-right mt-1">{editFormData.description.length}/200</div>
              </div>

              {/* 해시태그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ 해시태그
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#게임 #음악 #일상 (띄어쓰기로 구분)"
                  value={editFormData.hashtags}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                  maxLength={100}
                  disabled={uploading}
                />
                <div className="text-xs text-gray-400 text-right mb-3">{editFormData.hashtags.length}/100</div>
                
                {/* 현재 입력된 해시태그 미리보기 */}
                {editFormData.hashtags && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">입력된 태그:</div>
                    <div className="flex flex-wrap gap-1">
                      {parseHashtags(editFormData.hashtags).map((tag, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 추천 해시태그 */}
                <div>
                  <div className="text-xs text-gray-600 mb-2">인기 태그:</div>
                  <div className="flex flex-wrap gap-1">
                    {["게임", "음악", "영화", "드라마", "애니", "먹방", "여행", "일상", "스포츠", "공부", "취업", "연애", "친구", "힐링", "수다", "토론"].map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addRecommendedHashtag(tag)}
                        className="bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-800 px-2 py-1 rounded-full text-xs transition-colors duration-200"
                        disabled={uploading}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 프로필 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로필 이미지
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100">
                    {editFormData.profileImage ? (
                      <img 
                        src={editFormData.profileImage} 
                        alt="프로필 미리보기" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">📷</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      id="profile-image-input"
                    />
                    <label
                      htmlFor="profile-image-input"
                      className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm"
                    >
                      이미지 선택
                    </label>
                  </div>
                </div>
              </div>

              {/* 커버 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  커버 이미지
                </label>
                <div className="space-y-3">
                  <div className="w-full h-24 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100">
                    {editFormData.coverImage ? (
                      <img 
                        src={editFormData.coverImage} 
                        alt="커버 미리보기" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🖼️</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="hidden"
                      id="cover-image-input"
                    />
                    <label
                      htmlFor="cover-image-input"
                      className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm"
                    >
                      이미지 선택
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 모달 하단 버튼 */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  disabled={uploading}
                >
                  취소
                </button>
                <button
                  onClick={handleSaveRoomInfo}
                  disabled={uploading || !editFormData.name.trim() || !editFormData.roomType}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {uploading ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRoomProfile;
 
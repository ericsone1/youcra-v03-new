import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function ChatRoomCreate() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 새로 추가된 상태들
  const [roomType, setRoomType] = useState(""); // 방 타입
  const [isPrivate, setIsPrivate] = useState(false); // 공개/비밀 설정
  const [password, setPassword] = useState(""); // 비밀방 비밀번호
  
  const navigate = useNavigate();

  // 방 타입 옵션들
  const roomTypes = [
    { id: "collaboration", name: "🤝 협업방", desc: "프로젝트나 스터디를 함께해요" },
    { id: "subscribe", name: "📺 맞구독방", desc: "서로 구독하며 소통해요" }
  ];

  // 해시태그 파싱 함수
  const parseHashtags = (text) => {
    const hashtagRegex = /#[\w가-힣]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
  };

  // 해시태그 입력 처리
  const handleHashtagChange = (e) => {
    const value = e.target.value;
    setHashtags(value);
  };

  // 해시태그 추천 목록
  const popularHashtags = [
    "게임", "음악", "영화", "드라마", "애니", "먹방", "여행", "일상", 
    "스포츠", "공부", "취업", "연애", "친구", "힐링", "수다", "토론"
  ];

  // 썸네일 이미지 업로드 핸들러
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // 추천 해시태그 클릭 시 추가
  const addRecommendedHashtag = (tag) => {
    const currentTags = parseHashtags(hashtags);
    if (!currentTags.includes(tag.toLowerCase())) {
      const newHashtags = hashtags + (hashtags ? " " : "") + "#" + tag;
      setHashtags(newHashtags);
    }
  };

  // 방 타입별 기본 설명 자동 생성
  const getDefaultDescription = (type) => {
    const typeData = roomTypes.find(t => t.id === type);
    return typeData ? `${typeData.desc}\n\n환영합니다! 함께 즐거운 시간을 보내요 🎉` : "";
  };

  // 채팅방 생성 및 Firestore/Storage 저장
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (!name.trim()) {
      setError("채팅방 이름을 입력해주세요.");
      return;
    }
    if (!roomType) {
      setError("방 타입을 선택해주세요.");
      return;
    }
    if (isPrivate && !password.trim()) {
      setError("비밀방의 경우 비밀번호를 입력해주세요.");
      return;
    }
    if (isPrivate && password.length < 4) {
      setError("비밀번호는 4자리 이상 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      let thumbnailUrl = "";
      if (thumbnail) {
        const storageRef = ref(storage, `chatRoomThumbnails/${Date.now()}_${thumbnail.name}`);
        await uploadBytes(storageRef, thumbnail);
        thumbnailUrl = await getDownloadURL(storageRef);
      }

      // 해시태그 파싱
      const parsedHashtags = parseHashtags(hashtags);

      const docRef = await addDoc(collection(db, "chatRooms"), {
        name: name.trim(),
        desc: desc.trim() || getDefaultDescription(roomType),
        hashtags: parsedHashtags,
        profileImage: thumbnailUrl,
        roomType: roomType, // 방 타입 추가
        isPrivate: isPrivate, // 공개/비밀 설정
        password: isPrivate ? password : null, // 비밀번호 (비밀방인 경우만)
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || "anonymous",
        memberCount: 0,
        viewCount: 0
      });
      setLoading(false);
      navigate(`/chat/${docRef.id}`);
    } catch (err) {
      setError("채팅방 생성 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
        <div className="flex-1 text-center font-bold text-lg">채팅방 만들기</div>
        <button 
          onClick={handleCreate} 
          className="text-blue-500 font-bold text-base disabled:text-gray-400" 
          disabled={!name.trim() || !roomType || loading}
        >
          완료
        </button>
      </div>

      <form className="flex flex-col gap-6 p-4" onSubmit={handleCreate}>
        {/* 방 타입 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🏷️ 방 타입 선택 (필수)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {roomTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setRoomType(type.id);
                  if (!desc.trim()) {
                    setDesc(getDefaultDescription(type.id));
                  }
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  roomType === type.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="font-medium text-sm">{type.name}</div>
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
              onClick={() => {
                setIsPrivate(false);
                setPassword("");
              }}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                !isPrivate
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={loading}
            >
              <div className="font-medium">🌍 공개방</div>
              <div className="text-xs text-gray-500 mt-1">누구나 참여할 수 있어요</div>
            </button>
            
            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                isPrivate
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={loading}
            >
              <div className="font-medium">🔐 비밀방</div>
              <div className="text-xs text-gray-500 mt-1">비밀번호가 있어야 참여할 수 있어요</div>
            </button>
          </div>

          {/* 비밀번호 입력 (비밀방 선택 시만 표시) */}
          {isPrivate && (
            <div className="mt-3">
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2 text-base"
                placeholder="비밀번호 (4자리 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={20}
                disabled={loading}
              />
              <div className="text-xs text-gray-400 mt-1">
                * 비밀번호는 방 입장 시 필요합니다 ({password.length}/20)
              </div>
            </div>
          )}
        </div>

        {/* 썸네일 업로드 */}
        <div className="flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-700 mb-2">📷 썸네일 이미지</label>
          <label htmlFor="thumbnail-upload" className="cursor-pointer">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="썸네일 미리보기" className="w-32 h-32 object-cover rounded-xl border" />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center border">
                <span className="text-3xl text-gray-400">📷</span>
              </div>
            )}
            <input
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailChange}
              disabled={loading}
            />
          </label>
        </div>

        {/* 방 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">방 이름 (필수)</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-base mb-1"
            placeholder="채팅방 이름을 입력하세요"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            required
            disabled={loading}
          />
          <div className="text-xs text-gray-400 text-right">{name.length}/30</div>
        </div>
        
        {/* 방 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">방 설명</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-base mb-1"
            placeholder="방에 대한 설명을 입력하세요 (선택사항)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            maxLength={200}
            rows={4}
            disabled={loading}
          />
          <div className="text-xs text-gray-400 text-right">{desc.length}/200</div>
        </div>

        {/* 해시태그 입력 필드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏷️ 해시태그
          </label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-base mb-2"
            placeholder="#게임 #음악 #일상 (띄어쓰기로 구분)"
            value={hashtags}
            onChange={handleHashtagChange}
            maxLength={100}
            disabled={loading}
          />
          <div className="text-xs text-gray-400 text-right mb-3">{hashtags.length}/100</div>
          
          {/* 현재 입력된 해시태그 미리보기 */}
          {hashtags && (
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1">입력된 태그:</div>
              <div className="flex flex-wrap gap-1">
                {parseHashtags(hashtags).map((tag, idx) => (
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
              {popularHashtags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addRecommendedHashtag(tag)}
                  className="bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-800 px-2 py-1 rounded-full text-xs transition-colors duration-200"
                  disabled={loading}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold text-base hover:bg-blue-600 transition disabled:bg-gray-400"
          disabled={!name.trim() || !roomType || loading}
        >
          {loading ? "생성 중..." : "채팅방 만들기"}
        </button>
      </form>
    </div>
  );
}

export default ChatRoomCreate; 
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
  const navigate = useNavigate();

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

  // 채팅방 생성 및 Firestore/Storage 저장
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
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
        desc: desc.trim(),
        hashtags: parsedHashtags, // 해시태그 배열 추가
        profileImage: thumbnailUrl,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || "anonymous",
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
        <button onClick={handleCreate} className="text-blue-500 font-bold text-base" disabled={!name.trim() || loading}>완료</button>
      </div>
      {/* 썸네일 업로드 */}
      <div className="flex flex-col items-center mt-6 mb-4">
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
      {/* 입력 폼 */}
      <form className="flex flex-col gap-4 px-4" onSubmit={handleCreate}>
        <div>
          <input
            className="w-full border rounded-lg px-3 py-2 text-base mb-1"
            placeholder="채팅방 이름 (필수)"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            required
            disabled={loading}
          />
          <div className="text-xs text-gray-400 text-right">{name.length}/30</div>
        </div>
        
        <div>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-base mb-1"
            placeholder={"어떤 사람과 대화하고 싶으신가요?\n지켜야 할 규칙, 공지 사항 등을 안내해 주세요."}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            maxLength={200}
            rows={3}
            disabled={loading}
          />
          <div className="text-xs text-gray-400 text-right">{desc.length}/200</div>
        </div>

        {/* 해시태그 입력 필드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏷️ 해시태그 (관심사나 주제를 입력해주세요)
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

        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold text-base hover:bg-blue-600 transition mt-4"
          disabled={!name.trim() || loading}
        >
          {loading ? "생성 중..." : "채팅방 만들기"}
        </button>
      </form>
    </div>
  );
}

export default ChatRoomCreate; 
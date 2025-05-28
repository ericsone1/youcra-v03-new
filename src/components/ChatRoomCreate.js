import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function ChatRoomCreate() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 썸네일 이미지 업로드 핸들러
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
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
      const docRef = await addDoc(collection(db, "chatRooms"), {
        name: name.trim(),
        desc: desc.trim(),
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
            placeholder={"어떤 사람과 대화하고 싶으신가요?\n지켜야 할 규칙, 공지 사항 등을 안내해 주세요.\n#태그를 입력하면 관심사가 비슷한 사람에게 발견돼요."}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            maxLength={200}
            rows={4}
            disabled={loading}
          />
          <div className="text-xs text-gray-400 text-right">{desc.length}/200</div>
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
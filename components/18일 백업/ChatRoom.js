import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0") +
    " " +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0")
  );
}

const MAX_LENGTH = 200;

// URL을 자동으로 링크로 변환 + 유튜브 미리보기
function renderMessageWithPreview(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const lines = text.split("\n");
  const elements = [];
  lines.forEach((line, idx) => {
    const parts = line.split(urlRegex);
    parts.forEach((part, i) => {
      if (urlRegex.test(part)) {
        const ytMatch = part.match(youtubeRegex);
        if (ytMatch) {
          const videoId = ytMatch[1];
          elements.push(
            <a
              key={`link-${idx}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {part}
            </a>
          );
          elements.push(
            <div key={`yt-${idx}-${i}`} className="my-2">
              <iframe
                width="320"
                height="180"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded"
              ></iframe>
            </div>
          );
        } else {
          elements.push(
            <a
              key={`link-${idx}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {part}
            </a>
          );
        }
      } else {
        elements.push(<React.Fragment key={`txt-${idx}-${i}`}>{part}</React.Fragment>);
      }
    });
    if (idx !== lines.length - 1) elements.push(<br key={`br-${idx}`} />);
  });
  return elements;
}

function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [participants, setParticipants] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // 비로그인 접근 제한
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        alert("로그인 후 이용 가능합니다.");
        navigate("/");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 채팅방 이름 불러오기
  useEffect(() => {
    if (loading) return;
    const unsub = onSnapshot(doc(db, "chatRooms", roomId), (docSnap) => {
      if (docSnap.exists()) {
        setRoomName(docSnap.data().name);
      }
    });
    return () => unsub && unsub();
  }, [roomId, loading]);

  // 메시지 실시간 구독
  useEffect(() => {
    if (loading) return;
    const q = query(
      collection(db, "chatRooms", roomId, "messages"),
      orderBy("createdAt")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsub && unsub();
  }, [roomId, loading]);

  // 실시간 참여자 관리
  useEffect(() => {
    if (loading || !auth.currentUser) return;
    const user = auth.currentUser;
    const participantRef = doc(db, "chatRooms", roomId, "participants", user.uid);

    // 입장 시 등록
    setDoc(participantRef, {
      email: user.email,
      joinedAt: serverTimestamp(),
    });

    // 실시간 참여자 구독
    const unsub = onSnapshot(
      collection(db, "chatRooms", roomId, "participants"),
      (snapshot) => {
        setParticipants(snapshot.docs.map((doc) => doc.data().email));
      }
    );

    // 퇴장 시 삭제
    return () => {
      deleteDoc(participantRef);
      unsub();
    };
  }, [roomId, loading]);

  // 스크롤 자동 내리기
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [messages, loading, error]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading, messages, error]);

  // 이미지 미리보기
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // 메시지 전송
  const handleSend = async (e) => {
    e.preventDefault();
    if (sending) return;
    if (!newMsg.trim() && !imageFile) {
      setError("메시지나 이미지를 입력하세요!");
      return;
    }
    if (newMsg.length > MAX_LENGTH) {
      setError(`메시지는 ${MAX_LENGTH}자 이내로 입력하세요.`);
      return;
    }
    setError("");
    setSending(true);

    let imageUrl = null;
    if (imageFile) {
      try {
        const storageRef = ref(
          storage,
          `chatImages/${roomId}/${Date.now()}_${imageFile.name}`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      } catch (err) {
        setError("이미지 업로드 중 오류가 발생했습니다.");
        setSending(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, "chatRooms", roomId, "messages"), {
        text: newMsg,
        imageUrl: imageUrl || null,
        email: auth.currentUser.email,
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
      });
      setNewMsg("");
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setError("메시지 전송 중 오류가 발생했습니다.");
    }
    setSending(false);
  };

  // 메시지 삭제
  const handleDelete = async (msgId) => {
    if (window.confirm("정말 이 메시지를 삭제할까요?")) {
      await deleteDoc(doc(db, "chatRooms", roomId, "messages", msgId));
    }
  };

  // 뒤로가기
  const handleBack = () => {
    navigate("/chat");
  };

  // 내 메시지와 남의 메시지 구분
  const myUid = auth.currentUser?.uid;

  // Enter/Shift+Enter 처리
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleChange = (e) => {
    if (e.target.value.length <= MAX_LENGTH) {
      setNewMsg(e.target.value);
    } else {
      setNewMsg(e.target.value.slice(0, MAX_LENGTH));
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (newMsg.length + emoji.native.length > MAX_LENGTH) return;
    setNewMsg((prev) => prev + emoji.native);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
    } else {
      setError("이미지 파일만 첨부할 수 있습니다.");
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80 text-gray-500">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <button
        className="mb-4 text-blue-500 underline"
        onClick={handleBack}
      >
        ← 채팅방 리스트로 돌아가기
      </button>
      <h2 className="text-2xl font-bold mb-2">{roomName || "채팅방"}</h2>
      <div className="mb-2 text-sm text-gray-500">
        현재 접속자: {participants.join(", ") || "없음"}
      </div>
      <div
        className="h-80 overflow-y-auto border p-2 mb-4 bg-gray-50"
        style={{ minHeight: "320px" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${msg.uid === myUid ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-2 rounded relative ${
                msg.uid === myUid
                  ? "bg-blue-200 text-right"
                  : "bg-gray-200 text-left"
              }`}
            >
              <div className="text-xs text-gray-600 mb-1 flex justify-between items-center">
                <span>{msg.email}</span>
                <span className="ml-2">{formatTime(msg.createdAt)}</span>
              </div>
              <div>{renderMessageWithPreview(msg.text)}</div>
              {msg.imageUrl && (
                <div className="mt-2">
                  <img
                    src={msg.imageUrl}
                    alt="첨부 이미지"
                    className="max-w-xs max-h-48 rounded border"
                  />
                </div>
              )}
              {msg.uid === myUid && (
                <button
                  className="absolute top-1 right-1 text-xs text-red-500"
                  onClick={() => handleDelete(msg.id)}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <div className="flex-1 flex flex-col relative">
          <textarea
            ref={inputRef}
            className="p-2 border rounded resize-none"
            rows={2}
            placeholder="메시지 입력 (최대 200자, Enter: 전송, Shift+Enter: 줄바꿈)"
            value={newMsg}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
            maxLength={MAX_LENGTH}
          />
          <div className="flex justify-between items-center mt-1">
            <button
              type="button"
              className="text-2xl"
              onClick={() => setShowEmoji((prev) => !prev)}
              tabIndex={-1}
            >
              😊
            </button>
            <span className="text-xs text-gray-500">
              {newMsg.length} / {MAX_LENGTH}자
            </span>
          </div>
          {showEmoji && (
            <div className="absolute z-10" style={{ top: "60px", left: 0 }}>
              <Picker data={data} onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
          {/* 이미지 첨부 UI */}
          <div className="mt-2 flex items-center gap-2">
            <label className="cursor-pointer bg-gray-200 px-2 py-1 rounded text-sm">
              이미지 첨부
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={sending}
              />
            </label>
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="미리보기"
                  className="w-20 h-20 object-cover rounded border"
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-white rounded-full text-xs px-1"
                  onClick={handleRemoveImage}
                  tabIndex={-1}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          className="bg-blue-500 text-white px-4 rounded h-12"
          type="submit"
          disabled={sending}
        >
          {sending ? "전송 중..." : "전송"}
        </button>
      </form>
      {error && (
        <div className="mt-2 text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
}

export default ChatRoom;
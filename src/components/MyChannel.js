import React, { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Link, useNavigate } from "react-router-dom";
import GoogleAuth from "./GoogleAuth";

function MyChannel() {
  const user = auth.currentUser;
  const [profile, setProfile] = useState({
    nickname: "",
    profileImage: "",
    email: user?.email || "",
    uid: user?.uid || "",
    point: 0,
    channelLink: "",
  });
  const [newNickname, setNewNickname] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [newChannelLink, setNewChannelLink] = useState("");
  const [myRooms, setMyRooms] = useState([]);
  const [myRoomInfos, setMyRoomInfos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myMessages, setMyMessages] = useState([]);
  const fileInputRef = useRef();
  const nicknameInputRef = useRef();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const navigate = useNavigate();

  // 유저 정보 불러오기
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({
          ...profile,
          ...docSnap.data(),
        });
        setNewNickname(docSnap.data().nickname || "");
        setPreviewUrl(docSnap.data().profileImage || "");
        setNewChannelLink(docSnap.data().channelLink || "");
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [user]);

  // 내가 등록한 영상이 있는 방 roomId 리스트 구하기
  useEffect(() => {
    if (!user) return;
    const fetchMyRooms = async () => {
      const q = query(collection(db, "chatRooms"));
      const roomSnap = await getDocs(q);
      let roomIds = [];
      for (const roomDoc of roomSnap.docs) {
        const roomId = roomDoc.id;
        const videoQ = query(
          collection(db, "chatRooms", roomId, "videos"),
          where("registeredBy", "==", user.uid)
        );
        const videoSnap = await getDocs(videoQ);
        if (!videoSnap.empty) {
          roomIds.push(roomId);
        }
      }
      setMyRooms(roomIds);
    };
    fetchMyRooms();
  }, [user]);

  // 방 정보 가져오기
  useEffect(() => {
    if (myRooms.length === 0) {
      setMyRoomInfos([]);
      return;
    }
    const fetchRoomInfos = async () => {
      let infos = [];
      for (const roomId of myRooms) {
        const docRef = doc(db, "chatRooms", roomId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          infos.push({ id: roomId, ...docSnap.data() });
        }
      }
      setMyRoomInfos(infos);
    };
    fetchRoomInfos();
  }, [myRooms]);

  // 내 메시지/참여방 불러오기
  useEffect(() => {
    if (!user) return;
    const fetchMyMessages = async () => {
      // 모든 채팅방의 messages에서 내 uid로 쓴 메시지 가져오기
      const q = query(
        collection(db, "chatRooms"),
        where("members", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const msgs = [];
      const roomSet = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // roomId 추출 (경로: chatRooms/{roomId}/messages/{msgId})
        const pathParts = doc.ref.path.split("/");
        const roomId = pathParts[1];
        msgs.push({
          id: doc.id,
          roomId,
          ...data,
        });
        roomSet.add(roomId);
      });
      // 최신순 정렬
      msgs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyMessages(msgs);
    };
    fetchMyMessages();
  }, [user]);

  // 이미지 미리보기
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // 프로필 저장
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    let imageUrl = profile.profileImage;
    if (imageFile) {
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    const userData = {
      nickname: newNickname,
      profileImage: imageUrl,
      email: user.email,
      uid: user.uid,
    };
    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    setProfile(userData);
    setLoading(false);
    alert("프로필이 저장되었습니다!");
  };

  // 채널 링크 저장
  const handleSaveChannelLink = async () => {
    if (!user) return;
    setLoading(true);
    await setDoc(doc(db, "users", user.uid), { channelLink: newChannelLink }, { merge: true });
    setProfile((prev) => ({ ...prev, channelLink: newChannelLink }));
    setLoading(false);
    alert("채널 링크가 저장되었습니다!");
  };

  // 로그아웃
  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  // 닉네임 편집 완료 처리
  const handleNicknameSubmit = async () => {
    if (!user) return;
    setLoading(true);
    
    const userData = {
      nickname: newNickname,
      profileImage: profile.profileImage,
      email: user.email,
      uid: user.uid,
    };
    
    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    setProfile(prev => ({ ...prev, nickname: newNickname }));
    setIsEditingNickname(false);
    setLoading(false);
  };

  // Enter 키나 포커스 아웃 시 저장
  const handleNicknameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNicknameSubmit();
    } else if (e.key === 'Escape') {
      setNewNickname(profile.nickname || "");
      setIsEditingNickname(false);
    }
  };

  // 시간 포맷
  function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return (
      String(date.getFullYear()) +
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

  if (!user) {
    return (
      <div className="max-w-sm mx-auto p-8 flex flex-col items-center bg-white rounded-2xl shadow mt-8">
        <h2 className="text-2xl font-bold mb-6">마이채널</h2>
        
        <div className="mb-4 text-center">
          <p className="text-gray-600 mb-4">
            마이채널을 이용하려면 로그인이 필요합니다
          </p>
        </div>

        {/* Google 로그인 */}
        <div className="mb-4">
          <GoogleAuth onAuthChange={(isSignedIn, userData) => {
            if (isSignedIn) {
              console.log('Google 로그인 성공:', userData);
              // 필요시 추가 처리
            }
          }} />
        </div>

        {/* 또는 구분선 */}
        <div className="flex items-center w-full my-4">
          <hr className="flex-1 border-gray-300" />
          <span className="px-3 text-gray-500 text-sm">또는</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* 기존 로그인 링크 */}
        <Link
          to="/login"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 shadow transition-all duration-200"
        >
          이메일로 로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col pb-24">
      {/* 상단 프로필 카드 */}
      <div className="bg-white rounded-2xl shadow p-6 mx-4 mt-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-500 mb-2 overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt="프로필" className="w-full h-full object-cover" />
          ) : (
            profile.nickname?.slice(0, 2) || "CH"
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        <button
          className="text-xs text-blue-500 underline mb-2"
          onClick={() => fileInputRef.current.click()}
        >
          사진 변경
        </button>
        <div className="text-lg font-bold mb-1 flex items-center justify-center gap-2">
          {isEditingNickname ? (
            <input
              ref={nicknameInputRef}
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              onKeyDown={handleNicknameKeyDown}
              onBlur={handleNicknameSubmit}
              className="text-lg font-bold text-center bg-transparent border-b-2 border-blue-500 outline-none px-2 py-1 min-w-0"
              placeholder="닉네임 입력"
              maxLength={20}
              autoFocus
            />
          ) : (
            <span>{profile.nickname || "닉네임 없음"}</span>
          )}
          <button
            onClick={() => {
              if (!isEditingNickname) {
                setIsEditingNickname(true);
                setTimeout(() => {
                  nicknameInputRef.current?.focus();
                  nicknameInputRef.current?.select();
                }, 0);
              }
            }}
            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
            title="닉네임 수정"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-4 h-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
              />
            </svg>
          </button>
        </div>
        <div className="text-gray-500 text-sm mb-2">{profile.email}</div>
        
        <div className="flex gap-4 text-center mb-4">
          <div>
            <div className="font-bold text-blue-600 text-lg">{profile.point || 0}</div>
            <div className="text-xs text-gray-400">포인트</div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600 transition mb-2"
        >
          {loading ? "저장 중..." : "프로필 저장"}
        </button>
        <button
          onClick={handleLogout}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
        >
          로그아웃
        </button>
        {profile.channelLink && (
          <a
            href={profile.channelLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 w-full bg-blue-100 text-blue-700 text-center py-2 rounded-lg font-semibold hover:bg-blue-200 transition"
          >
            내 채널 바로가기
          </a>
        )}
      </div>

      {/* 내 영상이 있는 채팅방 리스트 */}
      <div className="mt-8 mx-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">내 영상을 시청중인 방 리스트</h3>
          <button
            onClick={handleSaveChannelLink}
            className="text-xs text-blue-500 underline"
          >
            채널 링크 수정
          </button>
        </div>
        <input
          type="text"
          value={newChannelLink}
          onChange={(e) => setNewChannelLink(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="유튜브/블로그 등 내 채널 링크"
        />
        {myRoomInfos.length === 0 ? (
          <div className="text-gray-400 text-center py-8 bg-white rounded-xl shadow">아직 등록한 영상이 있는 채팅방이 없습니다.</div>
        ) : (
          <ul className="space-y-3">
            {myRoomInfos.map((room) => (
              <li
                key={room.id}
                className="bg-white rounded-xl shadow flex items-center gap-4 p-4 cursor-pointer hover:bg-blue-50 transition"
                onClick={() => navigate(`/chat/${room.id}`)}
              >
                <div className="w-14 h-14 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-lg font-bold text-white shadow-md">
                  {room.name?.slice(0, 2).toUpperCase() || 'CH'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base">{room.name}</div>
                  <div className="text-xs text-gray-500">방 ID: {room.id}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 하단 탭바 */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around items-center h-16 z-50">
        <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
          <span className="text-xs">홈</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m10 0V6a4 4 0 00-8 0v2" /></svg>
          <span className="text-xs">채팅방</span>
        </Link>
        <Link to="/board" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <span className="text-xs">게시판</span>
        </Link>
        <Link to="/my" className="flex flex-col items-center text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-xs font-bold">마이채널</span>
        </Link>
      </footer>
    </div>
  );
}

export default MyChannel;
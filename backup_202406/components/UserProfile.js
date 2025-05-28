import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

function UserProfile() {
  const { roomId, uid } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [certifiedIds, setCertifiedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // 유저 정보 불러오기
  useEffect(() => {
    async function fetchUser() {
      const userDoc = await getDoc(doc(db, "users", uid));
      console.log("userDoc.exists:", userDoc.exists());
      console.log("userDoc.data:", userDoc.data());
      if (userDoc.exists()) {
        setUser(userDoc.data());
      } else {
        setUser(null);
      }
    }
    fetchUser();
  }, [uid]);

  // 영상 리스트 불러오기
  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "chatRooms", roomId, "videos"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setVideos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [roomId]);

  // 인증 영상 id 리스트 불러오기
  useEffect(() => {
    if (!roomId || !uid || videos.length === 0) {
      setCertifiedIds([]);
      return;
    }
    const unsubscribes = videos.map((video) => {
      const q = collection(db, "chatRooms", roomId, "videos", video.id, "certifications");
      return onSnapshot(q, (snapshot) => {
        const found = snapshot.docs.find((doc) => doc.data().uid === uid);
        setCertifiedIds((prev) => {
          if (found && !prev.includes(video.id)) {
            return [...prev, video.id];
          }
          if (!found && prev.includes(video.id)) {
            return prev.filter((id) => id !== video.id);
          }
          return prev;
        });
      });
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [roomId, videos, uid]);

  useEffect(() => {
    setLoading(false);
  }, [user]);

  if (loading) return <div>로딩 중...</div>;
  if (!user) return <div>유저 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mt-8">
      {/* 프로필 상단 */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={user.photoURL || `https://i.pravatar.cc/100?u=${user.email}`}
          alt="profile"
          className="w-24 h-24 rounded-full border mb-2"
        />
        <div className="font-bold text-lg">{user.displayName || user.email}</div>
        <div className="text-gray-500 text-sm">{user.email}</div>
        {/* 상태메시지 등 추가 가능 */}
      </div>
      {/* 시청 영상 리스트 */}
      <div className="mb-6">
        <div className="font-bold mb-2">이 방에서 시청한 영상</div>
        {videos.length === 0 && (
          <div className="text-sm text-gray-400">아직 등록된 영상이 없습니다.</div>
        )}
        <div className="flex flex-col gap-3">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50">
              <img src={video.thumbnail} alt="썸네일" className="w-20 h-12 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{video.title}</div>
                <div className="text-xs text-gray-500">{video.channel}</div>
              </div>
              {certifiedIds.includes(video.id) ? (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">인증</span>
              ) : (
                <span className="bg-gray-300 text-gray-600 text-xs px-2 py-1 rounded">미인증</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* 1:1 채팅 버튼 */}
      {auth.currentUser?.uid !== uid && (
        <button
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-600"
          onClick={() => navigate(`/dm/${uid}`)}
        >
          1:1 채팅하기
        </button>
      )}
    </div>
  );
}

export default UserProfile;

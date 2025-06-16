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
  const [registeredVideos, setRegisteredVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('watched'); // 'watched' | 'registered'

  // 유저 정보 불러오기
  useEffect(() => {
    async function fetchUser() {
      const userDoc = await getDoc(doc(db, "users", uid));
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
      const allVideos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVideos(allVideos);
      setRegisteredVideos(allVideos.filter(v => v.registeredBy === uid));
    });
    return () => unsub();
  }, [roomId, uid]);

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

  // 커버 이미지 (채널 배너 or 그라데이션)
  const coverUrl = user.youtubeChannel?.channelBanner || undefined;
  // 프로필 이미지 (없으면 이니셜)
  const profileUrl = user.profileImage || undefined;
  const profileInitial = user.email?.slice(0, 2).toUpperCase() || 'US';

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden pb-20">
      {/* 커버 */}
      <div className="relative h-52 bg-gradient-to-r from-blue-400 to-purple-500">
        {coverUrl && (
          <img src={coverUrl} alt="커버" className="w-full h-full object-cover" />
        )}
        {/* 프로필 이미지 */}
        <div className="absolute left-1/2 -bottom-10 transform -translate-x-1/2">
          {profileUrl ? (
            <img src={profileUrl} alt="프로필" className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-200 object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center text-2xl font-bold text-blue-600">
              {profileInitial}
            </div>
          )}
        </div>
      </div>
      <div className="pt-14 pb-4 text-center">
        <div className="font-bold text-lg">{user.displayName || user.email}</div>
        {user.youtubeChannel && (
          <div className="flex items-center justify-center gap-2 mt-1">
            <img src={user.youtubeChannel.channelThumbnail} alt="채널" className="w-8 h-8 rounded-full" />
            <span className="font-semibold text-sm">{user.youtubeChannel.channelTitle}</span>
            <span className="text-xs text-gray-500">구독자 {user.youtubeChannel.subscriberCount?.toLocaleString()}</span>
            <a href={`https://www.youtube.com/channel/${user.youtubeChannel.channelId}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">방문</a>
          </div>
        )}
      </div>
      {/* 1:1 채팅 버튼 (상단) */}
      {auth.currentUser?.uid !== uid && (
        <div className="px-4 mb-2">
          <button
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-600 shadow"
            onClick={() => navigate(`/dm/${uid}`)}
          >
            1:1 채팅하기
          </button>
        </div>
      )}
      {/* 탭 메뉴 */}
      <div className="px-4 mb-2">
        <div className="flex gap-2 mb-2">
          <button
            className={`flex-1 py-2 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'watched' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setActiveTab('watched')}
          >
            이 방에서 시청한 영상
          </button>
          <button
            className={`flex-1 py-2 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'registered' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setActiveTab('registered')}
          >
            이 방에 등록한 영상
          </button>
        </div>
        {/* 탭 컨텐츠 */}
        <div className="bg-gray-50 rounded-b-lg p-3 min-h-[120px]">
          {activeTab === 'watched' ? (
            videos.length === 0 ? (
              <div className="text-sm text-gray-400">아직 등록된 영상이 없습니다.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {videos.map((video) => {
                  const watched = certifiedIds.includes(video.id);
                  const percent = watched ? 100 : 0;
                  return (
                    <div key={video.id} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                      <img src={video.thumbnail} alt="썸네일" className="w-20 h-12 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-sm">{video.title}</div>
                        <div className="text-xs text-gray-500">{video.channel}</div>
                        <div className="w-full bg-gray-200 h-2 rounded mt-1">
                          <div className={`h-2 rounded ${watched ? 'bg-green-500' : 'bg-blue-400'}`} style={{ width: `${percent}%` }} />
                        </div>
                        <div className="text-xs text-right text-gray-500 mt-0.5">{percent}%</div>
                      </div>
                      {watched ? (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">인증</span>
                      ) : (
                        <span className="bg-gray-300 text-gray-600 text-xs px-2 py-1 rounded">미인증</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            registeredVideos.length === 0 ? (
              <div className="text-sm text-gray-400">이 사용자가 등록한 영상이 없습니다.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {registeredVideos.map((video) => (
                  <div key={video.id} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                    <img src={video.thumbnail} alt="썸네일" className="w-20 h-12 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-sm">{video.title}</div>
                      <div className="text-xs text-gray-500">{video.channel}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;

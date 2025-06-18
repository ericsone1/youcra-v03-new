import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useVideoPlayer } from '../contexts/VideoPlayerContext';
import BottomTabBar from './MyChannel/BottomTabBar';

function MyViewersPage() {
  const {
    roomId,
    selectedVideoIdx,
    videoList
  } = useVideoPlayer();

  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchViewers = async () => {
      if (!roomId || selectedVideoIdx === null || !videoList[selectedVideoIdx]) {
        setLoading(false);
        return;
      }

      try {
        const currentVideo = videoList[selectedVideoIdx];
        const videoId = currentVideo.id;

        // 참여자 목록 가져오기 (같은 방 유저 제외)
        const participantsSnap = await getDocs(collection(db, 'chatRooms', roomId, 'participants'));
        const participantUids = participantsSnap.docs.map((d) => d.id);

        // 인증한 유저 목록 가져오기
        const certSnap = await getDocs(collection(db, 'chatRooms', roomId, 'videos', videoId, 'certifications'));
        const certUids = certSnap.docs.map((d) => d.data().uid);

        // 참여자 제외
        const filteredUids = certUids.filter((uid) => !participantUids.includes(uid));

        // 유저 정보 가져오기
        const usersData = await Promise.all(
          filteredUids.map(async (uid) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                  uid,
                  nickname: data.nickname || data.email?.split('@')[0] || '익명',
                  photoURL: data.photoURL || null
                };
              }
            } catch (e) {
              console.error('유저 문서 오류', e);
            }
            return { uid, nickname: '익명', photoURL: null };
          })
        );

        setViewers(usersData);
      } catch (e) {
        console.error('시청자 가져오기 오류', e);
        setError('시청자 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchViewers();
  }, [roomId, selectedVideoIdx, videoList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-600">시청자 정보를 불러오는 중...</p>
        <BottomTabBar />
      </div>
    );
  }

  if (!roomId || selectedVideoIdx === null) {
    return (
      <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center pb-24 text-center px-4">
        <p className="text-gray-700 mb-4">홈 탭에서 재생 중인 영상이 없습니다.</p>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 flex flex-col pb-24">
      <div className="bg-white shadow p-4 flex items-center justify-between sticky top-0 z-20">
        <h1 className="text-lg font-bold text-gray-800">👥 인증 시청자</h1>
        <span className="text-sm text-gray-500">{viewers.length}명</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {viewers.length === 0 ? (
          <div className="p-8 text-center text-gray-600">아직 인증한 시청자가 없습니다.</div>
        ) : (
          viewers.map((u) => (
            <div key={u.uid} className="flex items-center gap-3 p-4 bg-white hover:bg-purple-50 transition-colors">
              {u.photoURL ? (
                <img src={u.photoURL} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {u.nickname.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-medium text-gray-800 truncate flex-1">{u.nickname}</span>
            </div>
          ))
        )}
      </div>

      <BottomTabBar />
    </div>
  );
}

export default MyViewersPage;
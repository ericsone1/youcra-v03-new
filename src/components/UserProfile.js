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
  addDoc,
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
  const [myChannel, setMyChannel] = useState(null); // 내 유튜브 채널 정보
  const [isSubscribedToMe, setIsSubscribedToMe] = useState(null); // 상대방이 내 채널 구독 여부
  const [isOwner, setIsOwner] = useState(false);

  // 유저 정보 불러오기
  useEffect(() => {
    async function fetchUser() {
      // uid 유효성 검사
      if (!uid || uid === 'undefined' || uid === 'null' || uid.trim() === '') {
        console.log('❌ [프로필] 유효하지 않은 uid:', uid);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [프로필] 상대방 사용자 정보 로딩 시작:', uid);
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData);
          console.log('✅ [프로필] 상대방 사용자 데이터:', userData);
          if (userData.youtubeChannel) {
            console.log('✅ [프로필] 상대방 유튜브 채널:', userData.youtubeChannel);
          } else {
            console.log('❌ [프로필] 상대방 유튜브 채널 없음');
          }
        } else {
          setUser(null);
          console.log('❌ [프로필] 상대방 사용자 문서 없음 - uid:', uid);
        }
      } catch (error) {
        console.error('❌ [프로필] 사용자 정보 로딩 오류:', error);
        setUser(null);
      }
    }
    fetchUser();
  }, [uid]);

  // 내 유튜브 채널 정보 불러오기
  useEffect(() => {
    async function fetchMyChannel() {
      if (!auth.currentUser) {
        console.log('🔍 [프로필] 로그인된 사용자 없음');
        return;
      }
      
      console.log('🔍 [프로필] 내 채널 정보 로딩 시작:', auth.currentUser.uid);
      const myUserDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (myUserDoc.exists()) {
        const myData = myUserDoc.data();
        console.log('✅ [프로필] 내 사용자 데이터:', myData);
        if (myData.youtubeChannel) {
          setMyChannel(myData.youtubeChannel);
          console.log('✅ [프로필] 내 유튜브 채널 정보 설정:', myData.youtubeChannel);
        } else {
          console.log('❌ [프로필] 내 유튜브 채널 정보 없음');
        }
      } else {
        console.log('❌ [프로필] 내 사용자 문서 없음');
      }
    }
    fetchMyChannel();
  }, []);

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

  // 상대방이 내 채널을 구독중인지 확인
  useEffect(() => {
    async function checkSubscription() {
      console.log('🔍 [프로필] 구독 여부 확인 시작');
      console.log('- 내 채널:', myChannel);
      console.log('- 상대방 유튜브 채널:', user?.youtubeChannel);
      console.log('- 현재 사용자 ID:', auth.currentUser?.uid);
      console.log('- 프로필 사용자 ID:', uid);
      
      if (!myChannel || !user?.youtubeChannel) {
        console.log('❌ [프로필] 구독 여부 확인 불가 - 채널 정보 부족');
        setIsSubscribedToMe(null);
        return;
      }

      try {
        console.log('✅ [프로필] 구독 여부 확인 진행');
        // TODO: 실제 YouTube API 연동 시 여기에 구독 여부 확인 로직 추가
        // 현재는 시뮬레이션된 로직 사용
        
        // 예시: 데이터베이스에서 구독 관계 확인
        // const subscriptionDoc = await getDoc(doc(db, "subscriptions", `${uid}_${myChannel.channelId}`));
        // setIsSubscribedToMe(subscriptionDoc.exists());
        
        // 임시로 랜덤하게 구독 여부 결정 (실제 구현 시 제거)
        const randomSubscribed = Math.random() > 0.5;
        setIsSubscribedToMe(randomSubscribed);
        
        console.log(`🎯 [프로필] 구독 여부 결과: 상대방(${user.displayName})이 내 채널(${myChannel.channelTitle}) 구독 여부:`, randomSubscribed);
      } catch (error) {
        console.error("❌ [프로필] 구독 여부 확인 오류:", error);
        setIsSubscribedToMe(null);
      }
    }

    checkSubscription();
  }, [myChannel, user]);

  // 방장 여부 확인
  useEffect(() => {
    async function checkOwner() {
      if (!roomId || !uid) {
        setIsOwner(false);
        return;
      }
      try {
        // 방 정보 확인
        const roomDoc = await getDoc(doc(db, 'chatRooms', roomId));
        const roomData = roomDoc.exists() ? roomDoc.data() : null;
        if (roomData && roomData.createdBy === uid) {
          setIsOwner(true);
          return;
        }
        // participants 서브컬렉션 role 확인
        const participantDoc = await getDoc(doc(db, 'chatRooms', roomId, 'participants', uid));
        if (participantDoc.exists()) {
          const pData = participantDoc.data();
          if (pData.role === 'owner') {
            setIsOwner(true);
            return;
          }
        }
        setIsOwner(false);
      } catch (err) {
        console.error('방장 여부 확인 오류:', err);
        setIsOwner(false);
      }
    }
    checkOwner();
  }, [roomId, uid]);

  useEffect(() => {
    setLoading(false);
  }, [user]);

  // 구독 요청 처리
  const handleSubscribeRequest = async () => {
    if (!auth.currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      await addDoc(collection(db, "subscribeRequests"), {
        fromUid: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || auth.currentUser.email,
        toUid: uid,
        createdAt: new Date(),
        notified: false,
      });
      alert("구독 요청을 보냈습니다!");
    } catch (err) {
      console.error("구독 요청 실패", err);
      alert("구독 요청 중 오류가 발생했습니다.");
    }
  };

  if (loading) return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-600">프로필을 불러오는 중...</div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden min-h-screen">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <button 
          onClick={() => navigate(-1)} 
          className="text-2xl text-gray-600 hover:text-blue-600 transition-colors" 
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="font-bold text-lg">프로필</h1>
        <div className="w-8" />
      </div>

      {/* 오류 메시지 */}
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-6xl mb-4">😵</div>
        <div className="text-gray-600 text-center px-4">
          <div className="font-medium mb-2">유저 정보를 찾을 수 없습니다</div>
          <div className="text-sm text-gray-500 mb-6">
            다음과 같은 이유일 수 있습니다:<br/>
            • 사용자가 프로필을 삭제했거나<br/>
            • 임시 사용자이거나<br/>
            • 연결 오류가 발생했습니다
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            이전으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );

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
        <div className="font-bold text-lg flex items-center justify-center gap-1">
          {user.displayName || user.email}
          {isOwner && (
            <span className="text-yellow-500 text-xl" title="방장">👑</span>
          )}
        </div>
        {user.youtubeChannel && (
          <div className="mt-1">
            <div className="flex items-center justify-center gap-2">
              <img src={user.youtubeChannel.channelThumbnail} alt="채널" className="w-8 h-8 rounded-full" />
              <span className="font-semibold text-sm">{user.youtubeChannel.channelTitle}</span>
              <span className="text-xs text-gray-500">구독자 {user.youtubeChannel.subscriberCount?.toLocaleString()}</span>
              <a href={`https://www.youtube.com/channel/${user.youtubeChannel.channelId}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">방문</a>
            </div>
            
            {/* 내 채널 구독 여부 표시 */}
            {myChannel && auth.currentUser?.uid !== uid && (
              <div className="flex items-center justify-center mt-2">
                {isSubscribedToMe === true && (
                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    <span>✅</span>
                    <span>내 채널({myChannel.channelTitle}) 구독중</span>
                  </div>
                )}
                {isSubscribedToMe === false && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                      <span>❌</span>
                      <span>내 채널({myChannel.channelTitle}) 미구독</span>
                    </div>
                    <button
                      onClick={handleSubscribeRequest}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold"
                    >
                      구독요청
                    </button>
                  </div>
                )}
                {isSubscribedToMe === null && myChannel && (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">
                    <span>🔍</span>
                    <span>구독 여부 확인 중...</span>
                  </div>
                )}
              </div>
            )}
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

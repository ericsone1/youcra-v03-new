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
  getDocs,
  deleteDoc,
} from "firebase/firestore";

function UserProfile() {
  const { roomId, uid } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [certifiedIds, setCertifiedIds] = useState([]);
  const [certificationCounts, setCertificationCounts] = useState({}); // 각 영상별 인증 횟수
  const [videoViewRates, setVideoViewRates] = useState({}); // 각 영상별 시청률 (전체 참여자 대비)
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
    
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData);
        } else {
          setUser(null);
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
        return;
      }
      
      const myUserDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (myUserDoc.exists()) {
        const myData = myUserDoc.data();
        if (myData.youtubeChannel) {
          setMyChannel(myData.youtubeChannel);
        }
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
      
      // registeredBy가 uid 또는 해당 사용자의 email과 일치하는 영상 필터링
      const userRegisteredVideos = allVideos.filter(v => {
        // 1. URL의 uid와 일치하는 경우 (가장 기본적인 uid 기준)
        const matchByUrlUid = v.registeredBy === uid;
        
        // 2. user 객체의 email과 일치하는 경우 (user 데이터가 로드된 후)
        const matchByUserEmail = user?.email && v.registeredBy === user.email;

        // 3. 현재 로그인한 사용자의 프로필인 경우, auth.currentUser의 email과 일치하는지 확인
        const isMyProfile = auth.currentUser?.uid === uid;
        const matchByCurrentUserEmail = isMyProfile && auth.currentUser?.email && v.registeredBy === auth.currentUser.email;

        return matchByUrlUid || matchByUserEmail || matchByCurrentUserEmail;
      });
      setRegisteredVideos(userRegisteredVideos);
    });
    return () => unsub();
  }, [roomId, uid, user]);

  // 인증 영상 id 리스트 및 인증 횟수 불러오기
  useEffect(() => {
    if (!roomId || !uid || videos.length === 0) {
      setCertifiedIds([]);
      setCertificationCounts({});
      return;
    }
    const unsubscribes = videos.map((video) => {
      const q = collection(db, "chatRooms", roomId, "videos", video.id, "certifications");
      return onSnapshot(q, (snapshot) => {
        const userCertifications = snapshot.docs.filter((doc) => doc.data().uid === uid);
        const certCount = userCertifications.length;
        
        setCertificationCounts((prev) => ({
          ...prev,
          [video.id]: certCount
        }));
        
        setCertifiedIds((prev) => {
          if (certCount > 0 && !prev.includes(video.id)) {
            return [...prev, video.id];
          }
          if (certCount === 0 && prev.includes(video.id)) {
            return prev.filter((id) => id !== video.id);
          }
          return prev;
        });
      });
    });
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [roomId, videos, uid]);

  // "등록한 영상" 탭이 활성화되면 시청률 계산
  useEffect(() => {
    if (activeTab === 'registered' && registeredVideos.length > 0) {
      calculateViewRates();
    }
  }, [activeTab, registeredVideos]); // registeredVideos가 업데이트되면 재계산

  // 각 영상별 시청률 계산 함수
  const calculateViewRates = async () => {
    if (!roomId || registeredVideos.length === 0) {
      setVideoViewRates({});
      return;
    }

    try {
      const participantsRef = collection(db, "chatRooms", roomId, "participants");
      const participantsSnap = await getDocs(participantsRef);
      const totalParticipants = participantsSnap.size;

      if (totalParticipants === 0) {
        setVideoViewRates({});
        return;
      }

      const rates = {};
      for (const video of registeredVideos) { // 'videos' 대신 'registeredVideos' 사용
        const certificationsRef = collection(db, "chatRooms", roomId, "videos", video.id, "certifications");
        const certificationsSnap = await getDocs(certificationsRef);
        
        const uniqueViewers = new Set(certificationsSnap.docs.map(doc => doc.data().uid));
        const viewerCount = uniqueViewers.size;
        const viewRate = Math.round((viewerCount / totalParticipants) * 100);
        
        rates[video.id] = { viewerCount, totalParticipants, viewRate };
      }
      
      setVideoViewRates(rates);
    } catch (error) {
      console.error('❌ [시청률] 계산 오류:', error);
      setVideoViewRates({});
    }
  };

  // 상대방이 내 채널을 구독중인지 확인
  useEffect(() => {
    async function checkSubscription() {
      if (!myChannel || !user?.youtubeChannel) {
        setIsSubscribedToMe(null);
        return;
      }

      try {
        // Firebase에서 구독 관계 확인
        // subscriptions 컬렉션에서 {구독자uid}_{채널id} 형태로 저장된 문서 확인
        const subscriptionId = `${uid}_${myChannel.channelId}`;
        const subscriptionDoc = await getDoc(doc(db, "subscriptions", subscriptionId));
        const isSubscribed = subscriptionDoc.exists();
        
        setIsSubscribedToMe(isSubscribed);
      } catch (error) {
        console.error("❌ [프로필] 구독 여부 확인 오류:", error);
        setIsSubscribedToMe(null);
      }
    }

    checkSubscription();
  }, [myChannel, user]);

  // 영상 삭제 함수
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('정말로 이 영상을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'chatRooms', roomId, 'videos', videoId));
      alert('영상이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('영상 삭제 오류:', error);
      alert('영상 삭제 중 오류가 발생했습니다.');
    }
  };

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
          <img 
            src={coverUrl} 
            alt="커버" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        
        {/* 뒤로가기 버튼 */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all duration-200 backdrop-blur-sm" 
          aria-label="뒤로가기"
          title="뒤로가기"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
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
        {user.youtubeChannel ? (
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
                    <span>내 채널 구독중입니다</span>
                  </div>
                )}
                {isSubscribedToMe === false && (
                  <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    <span>❌</span>
                    <span>미구독중</span>
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
            
            {/* 내가 채널 등록하지 않은 경우 */}
            {!myChannel && auth.currentUser?.uid !== uid && (
              <div className="flex items-center justify-center mt-2">
                <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs">
                  <span>⚠️</span>
                  <span>내 유튜브 채널이 등록되지 않았습니다</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                <span>📺</span>
                <span>
                  {auth.currentUser?.uid === uid 
                    ? "유튜브 채널이 등록되지 않았습니다" 
                    : "상대방이 유튜브 채널 등록이 되어있지 않습니다"
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 1:1 채팅 버튼 (상단) */}
      <div className="px-4 mb-2">
        <button
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-600 shadow"
          onClick={() => navigate(`/dm/${uid}`)}
        >
          {auth.currentUser?.uid === uid ? '나에게 채팅하기' : '1:1 채팅하기'}
        </button>
      </div>
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
                  const certCount = certificationCounts[video.id] || 0;
                  const percent = watched ? 100 : 0;
                  
                  // 인증 버튼 텍스트 결정
                  let certText = "미인증";
                  let certStyle = "text-gray-400";
                  
                  if (certCount > 0) {
                    if (certCount === 1) {
                      certText = "시청완료";
                    } else {
                      certText = `${certCount}회\n시청완료`;
                    }
                    certStyle = "text-green-600 font-bold";
                  }
                  
                  // 내가 등록한 영상인지 확인
                  const isMyVideo = video.registeredBy === auth.currentUser?.uid || 
                                   video.registeredBy === auth.currentUser?.email ||
                                   (auth.currentUser?.uid === uid && video.registeredBy === user?.email);
                  
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
                      
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-medium ${certStyle} whitespace-pre-line text-center`}>
                          {certText}
                        </span>
                        
                        {/* 삭제하기 버튼 (내가 등록한 영상인 경우에만 표시) */}
                        {isMyVideo && (
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                          >
                            삭제하기
                          </button>
                        )}
                      </div>
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
                {registeredVideos.map((video) => {
                  const viewData = videoViewRates[video.id];
                  const viewRate = viewData?.viewRate || 0;
                  const viewerCount = viewData?.viewerCount || 0;
                  const totalParticipants = viewData?.totalParticipants || 0;
                  const displayRate = Math.min(viewRate, 100); // UI 표시는 100%로 제한
                  
                  const isMyVideo = auth.currentUser?.uid === uid; // 내가 등록한 영상인지 확인
                  const watched = certifiedIds.includes(video.id);
                  
                  return (
                    <div key={video.id} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                      <img src={video.thumbnail} alt="썸네일" className="w-20 h-12 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-sm">{video.title}</div>
                        <div className="text-xs text-gray-500">{video.channel}</div>
                        
                        {/* 시청률 정보 */}
                        <div className="mt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">방 전체 시청률</span>
                            <span className="font-medium text-blue-600">{viewRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded mt-1 overflow-hidden">
                            <div 
                              className="h-1.5 rounded bg-gradient-to-r from-blue-400 to-blue-600" 
                              style={{ width: `${displayRate}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {viewerCount}명 / {totalParticipants}명 시청완료
                          </div>
                        </div>
                      </div>
                      
                      {/* 삭제하기 버튼 (내가 등록한 영상인 경우에만 표시) */}
                      {isMyVideo && (
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                          삭제하기
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;

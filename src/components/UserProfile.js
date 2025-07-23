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
  setDoc,
  where,
} from "firebase/firestore";
import { useWatchedVideos } from "../contexts/WatchedVideosContext";

function UserProfile() {
  const { roomId, uid } = useParams();
  const navigate = useNavigate();
  const { watchedMap, getWatchInfo } = useWatchedVideos();
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
  
  // 유크라 전체에서 시청한 영상 목록
  const [ucraWatchedVideos, setUcraWatchedVideos] = useState([]);
  const [ucraWatchedLoading, setUcraWatchedLoading] = useState(true);

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

  // 유크라 전체에서 시청한 영상 목록 불러오기
  useEffect(() => {
    async function fetchUcraWatchedVideos() {
      if (!uid) {
        console.log('❌ [프로필] uid가 없어서 시청 영상 로딩 중단');
        setUcraWatchedVideos([]);
        setUcraWatchedLoading(false);
        return;
      }

      try {
        setUcraWatchedLoading(true);
        console.log('🔍 [프로필] 유크라 시청 영상 로딩 시작:', { uid });
        
        // 현재 로그인한 사용자 정보 확인
        const currentUser = auth.currentUser;
        console.log('👤 [프로필] 현재 로그인한 사용자:', {
          currentUid: currentUser?.uid,
          profileUid: uid,
          isMyProfile: currentUser?.uid === uid
        });
        
        let watchedVideos = [];
        
        // 1. WatchedVideosContext에서 시청한 영상들 가져오기 (우선)
        console.log('📊 [프로필] WatchedVideosContext watchedMap:', watchedMap);
        
        const watchedVideoIds = Object.keys(watchedMap).filter(videoId => {
          const watchInfo = watchedMap[videoId];
          console.log('🎬 [프로필] WatchedVideosContext 영상 데이터:', { videoId, watchInfo });
          return watchInfo && watchInfo.certified;
        });
        
        console.log('✅ [프로필] WatchedVideosContext에서 시청 완료된 영상 ID 목록:', watchedVideoIds);
        
        // WatchedVideosContext에서 시청한 영상들이 어느 채팅방에 있는지 찾기
        if (watchedVideoIds.length > 0) {
          const roomsQuery = query(collection(db, "chatRooms"));
          const roomsSnapshot = await getDocs(roomsQuery);
          
          console.log('🏠 [프로필] 검색할 채팅방 수:', roomsSnapshot.docs.length);
          
          for (const videoId of watchedVideoIds) {
            console.log('🔍 [프로필] 영상 검색 시작:', { videoId });
            let found = false;
            
            for (const roomDoc of roomsSnapshot.docs) {
              const roomData = roomDoc.data();
              console.log('🔍 [프로필] 채팅방 검색 중:', { roomId: roomDoc.id, roomName: roomData.name });
              
              // videoId 필드로 검색 (문서 ID가 아닌 필드 값으로 검색)
              const videosQuery = query(
                collection(db, "chatRooms", roomDoc.id, "videos"),
                where("videoId", "==", videoId)
              );
              const videosSnapshot = await getDocs(videosQuery);
              
              console.log('📹 [프로필] videoId로 검색 결과:', { 
                videoId, 
                roomId: roomDoc.id, 
                foundCount: videosSnapshot.docs.length 
              });
              
              if (!videosSnapshot.empty) {
                const videoDoc = videosSnapshot.docs[0]; // 첫 번째 결과 사용
                const videoData = videoDoc.data();
                const watchInfo = watchedMap[videoId];
                
                console.log('🔍 [프로필] watchInfo 상세 확인:', { 
                  videoId, 
                  watchInfo,
                  watchedMapKeys: Object.keys(watchedMap),
                  hasWatchInfo: !!watchInfo,
                  watchInfoKeys: watchInfo ? Object.keys(watchInfo) : []
                });
                
                console.log('🎯 [프로필] WatchedVideosContext에서 시청한 영상 발견:', { 
                  videoId: videoId, 
                  title: videoData.title,
                  roomId: roomDoc.id,
                  roomName: roomData.name,
                  docId: videoDoc.id,
                  watchInfo: watchInfo
                });
                
                const videoToAdd = {
                  ...videoData,
                  id: videoDoc.id, // 실제 Firestore 문서 ID
                  videoId: videoId, // YouTube ID
                  roomId: roomDoc.id,
                  roomName: roomData.name || '제목 없음',
                  watchedAt: watchInfo?.watchedAt || Date.now(),
                  watchCount: watchInfo?.watchCount || 1,
                  certified: watchInfo?.certified || false
                };
                
                console.log('➕ [프로필] 영상 추가:', videoToAdd);
                watchedVideos.push(videoToAdd);
                found = true;
                break; // 영상을 찾았으면 다음 채팅방은 검색하지 않음
              }
            }
            
            if (!found) {
              console.log('⚠️ [프로필] 영상을 찾지 못함:', { videoId });
            }
          }
          
          console.log('📋 [프로필] WatchedVideosContext 처리 후 watchedVideos 배열:', {
            length: watchedVideos.length,
            videos: watchedVideos.map(v => ({ id: v.id, title: v.title }))
          });
        }
        
        // 2. 만약 WatchedVideosContext에 데이터가 없으면 Firestore watchedVideos 컬렉션에서 가져오기 (백업)
        if (watchedVideos.length === 0) {
          console.log('⚠️ [프로필] WatchedVideosContext에 데이터가 없음. Firestore watchedVideos 컬렉션에서 가져오겠습니다.');
          
          const watchedVideosRef = collection(db, 'users', uid, 'watchedVideos');
          const watchedSnap = await getDocs(watchedVideosRef);
          
          console.log('📊 [프로필] watchedVideos 조회 결과:', {
            totalDocs: watchedSnap.docs.length,
            docs: watchedSnap.docs.map(doc => ({ id: doc.id, data: doc.data() }))
          });
          
          // 기존 로직: watchedVideos 컬렉션에서 직접 가져오기
          console.log('🔍 [프로필] watchedVideos 컬렉션에서 직접 가져오기 시작');
          
          for (const watchedDoc of watchedSnap.docs) {
            const data = watchedDoc.data();
            console.log('🎬 [프로필] 시청 영상 데이터:', { id: watchedDoc.id, data });
            
            // watchedVideos 컬렉션에 문서가 존재한다는 것은 시청했다는 의미
            // data가 비어있어도 문서가 존재하면 시청한 영상으로 간주
            const isWatched = true; // 문서가 존재하면 시청한 것으로 간주
            
            if (isWatched) { // 시청 완료된 영상만
              // watchedVideos 컬렉션에는 videoId가 키로 저장되어 있음
              const videoId = watchedDoc.id;
              console.log('🔍 [프로필] 영상 검색 시작:', { videoId });
              
              // 해당 영상이 어느 채팅방에 있는지 찾기
              const roomsQuery = query(collection(db, "chatRooms"));
              const roomsSnapshot = await getDocs(roomsQuery);
              
              console.log('🏠 [프로필] 검색할 채팅방 수:', roomsSnapshot.docs.length);
              
              let found = false;
              for (const roomDoc of roomsSnapshot.docs) {
                const roomData = roomDoc.data();
                console.log('🔍 [프로필] 채팅방 검색 중:', { roomId: roomDoc.id, roomName: roomData.name });
                
                const videoDocRef = doc(db, "chatRooms", roomDoc.id, "videos", videoId);
                const videoDocSnap = await getDoc(videoDocRef);
                
                if (videoDocSnap.exists()) {
                  const videoData = videoDocSnap.data();
                  console.log('🎯 [프로필] 시청한 영상 발견:', { 
                    videoId: videoId, 
                    title: videoData.title,
                    roomId: roomDoc.id,
                    roomName: roomData.name
                  });
                  
                  watchedVideos.push({
                    ...videoData,
                    id: videoId,
                    roomId: roomDoc.id,
                    roomName: roomData.name || '제목 없음',
                    watchedAt: data?.watchedAt || Date.now(), // data가 비어있으면 현재 시간 사용
                    watchCount: data?.watchCount || 1 // data가 비어있으면 1로 설정
                  });
                  found = true;
                  break; // 영상을 찾았으면 다음 채팅방은 검색하지 않음
                }
              }
              
              if (!found) {
                console.log('⚠️ [프로필] 영상을 찾지 못함:', { videoId });
              }
            }
          }
        }

        console.log('📋 [프로필] 최종 시청 영상 목록:', {
          totalVideos: watchedVideos.length,
          videos: watchedVideos.map(v => ({ id: v.id, title: v.title, roomName: v.roomName }))
        });

        // 시청 시간 순으로 정렬 (최근 순)
        watchedVideos.sort((a, b) => {
          const aTime = a.watchedAt || 0;
          const bTime = b.watchedAt || 0;
          return bTime - aTime;
        });

        setUcraWatchedVideos(watchedVideos);
        console.log('✅ [프로필] 유크라 시청 영상 로딩 완료:', watchedVideos.length);
      } catch (error) {
        console.error('❌ [프로필] 유크라 시청 영상 로딩 오류:', error);
        setUcraWatchedVideos([]);
      } finally {
        setUcraWatchedLoading(false);
      }
    }

    fetchUcraWatchedVideos();
  }, [uid, watchedMap]); // watchedMap 의존성 추가

  // 영상 리스트 불러오기 (기존 방별 영상 - 등록한 영상 탭용)
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

  // 인증 영상 id 리스트 및 인증 횟수 불러오기 (기존 방별 인증 - 등록한 영상 탭용)
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
  }, [activeTab, registeredVideos]);

  // 시청률 계산 함수
  const calculateViewRates = async () => {
    if (!roomId || registeredVideos.length === 0) return;

    try {
      // 방 참여자 수 계산
      const participantsRef = collection(db, "chatRooms", roomId, "participants");
      const participantsSnap = await getDocs(participantsRef);
      const totalParticipants = participantsSnap.size;

      const rates = {};
      
      for (const video of registeredVideos) {
        const certRef = collection(db, "chatRooms", roomId, "videos", video.id, "certifications");
        const certSnap = await getDocs(certRef);
        const viewerCount = certSnap.size;
        const viewRate = totalParticipants > 0 ? Math.round((viewerCount / totalParticipants) * 100) : 0;
        
        rates[video.id] = {
          viewRate,
          viewerCount,
          totalParticipants
        };
      }
      
      setVideoViewRates(rates);
    } catch (error) {
      console.error('시청률 계산 오류:', error);
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

  // 1:1 채팅 시작
  const handleStartChat = () => {
    if (!auth.currentUser) {
      alert('로그인이 필요합니다.');
        return;
      }
    
    // DM 채팅방으로 이동
    navigate(`/dm/${uid}`);
  };

  // 구독 요청
  const handleSubscribeRequest = async () => {
    if (!auth.currentUser) {
      alert('로그인이 필요합니다.');
          return;
        }

    if (!user?.youtubeChannel) {
      alert('상대방의 YouTube 채널 정보가 없습니다.');
            return;
          }

    try {
      const reqRef = doc(collection(db, 'subscribeRequests'));
      await setDoc(reqRef, {
        fromUid: auth.currentUser.uid,
        toUid: uid,
        channelId: user.youtubeChannel.channelId,
        createdAt: new Date(),
      });
      alert('구독 요청이 전송되었습니다!');
    } catch (error) {
      console.error('구독 요청 오류:', error);
      alert('구독 요청 전송 중 오류가 발생했습니다.');
    }
  };

  // 시청률 계산
  const calculateWatchRate = () => {
    if (ucraWatchedVideos.length === 0) return 0;
    
    // 전체 유크라 영상 수를 가져와서 시청률 계산
    // 실제로는 모든 채팅방의 영상 수를 계산해야 하지만, 
    // 현재는 시청한 영상 수만 표시
    return ucraWatchedVideos.length;
  };

  useEffect(() => {
    setLoading(false);
  }, [user]);

  if (loading) return <div>로딩 중...</div>;
  if (!user) return <div>유저 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 프로필 상단 */}
      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
        >
          ←
        </button>
        
        <div className="flex flex-col items-center">
          <img
            src={user.photoURL || `https://i.pravatar.cc/100?u=${user.email}`}
            alt="profile"
            className="w-20 h-20 rounded-full border-4 border-white mb-3"
          />
          <div className="font-bold text-xl mb-1">{user.displayName || user.email}</div>
          <div className="flex items-center gap-1 text-sm opacity-90">
            <span>👤</span>
            <span>{user.youtubeChannel?.title || '동감맛집'} 구독자 {user.youtubeChannel?.subscriberCount || 15} 방문</span>
            </div>
        </div>
            </div>
            
      {/* 액션 버튼 */}
      <div className="p-4">
        <button
          onClick={handleStartChat}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
        >
          나에게 채팅하기
        </button>
      </div>

      {/* 탭 */}
      <div className="px-4 mb-2">
        <div className="flex gap-2 mb-2">
          <button
            className={`flex-1 py-2 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'watched' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setActiveTab('watched')}
          >
            유크라에서 시청한 영상
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
            ucraWatchedLoading ? (
              <div className="text-sm text-gray-400">시청 영상을 불러오는 중...</div>
            ) : ucraWatchedVideos.length === 0 ? (
              <div className="text-sm text-gray-400">아직 유크라에서 시청한 영상이 없습니다.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {ucraWatchedVideos.map((video) => {
                  const watchInfo = getWatchInfo(video.videoId); // video.id 대신 video.videoId 사용
                  const watchRate = watchInfo.certified ? 100 : 0;
                  const watchCount = watchInfo.watchCount || 0;
                  
                  return (
                    <div key={video.id} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                      <img src={video.thumbnail} alt="썸네일" className="w-20 h-12 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-sm">{video.title}</div>
                        <div className="text-xs text-gray-500">{video.channel}</div>
                        <div className="w-full bg-gray-200 h-2 rounded mt-1">
                          <div className={`h-2 rounded ${watchInfo.certified ? 'bg-green-500' : 'bg-blue-400'}`} style={{ width: `${watchRate}%` }} />
                        </div>
                        <div className="text-xs text-right text-gray-500 mt-0.5">{watchRate}%</div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-medium ${watchInfo.certified ? 'text-green-600 font-bold' : 'text-gray-400'} whitespace-pre-line text-center`}>
                          {watchInfo.certified ? `${watchCount}회 시청완료` : "미시청"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) :
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
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                          삭제하기
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
          )}
        </div>
      </div>

      {/* 시청률 요약 */}
      {activeTab === 'watched' && ucraWatchedVideos.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-800 mb-1">
              유크라 시청률 요약
            </div>
            <div className="text-xs text-blue-600">
              총 {ucraWatchedVideos.length}개 영상 시청완료
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;

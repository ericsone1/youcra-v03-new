import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import { AnimatePresence, motion } from "framer-motion";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  limit,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [fanCertified, setFanCertified] = useState(false);
  const currentVideoRef = useRef(null);

  // 채팅방 상태 추가
  const [chatRooms, setChatRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomLikes, setRoomLikes] = useState({}); // 좋아요 상태 관리
  const [visibleRoomsCount, setVisibleRoomsCount] = useState(3); // 표시할 채팅방 수

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=20&regionCode=KR&key=${API_KEY}`
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        setVideos(data.items || []);
      } catch (err) {
        setError("유튜브 API 오류: " + err.message);
      }
      setLoading(false);
    }
    fetchVideos();
  }, []);

  // 인기 채팅방 데이터 가져오기
  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoadingRooms(true);
      const roomPromises = snapshot.docs.map(async (docSnap) => {
        const room = { id: docSnap.id, ...docSnap.data() };

        try {
          // 더미 해시태그 추가 (기존 해시태그가 없는 경우)
          if (!room.hashtags || room.hashtags.length === 0) {
            const dummyHashtags = [
              ["게임", "롤", "팀원모집"],
              ["음악", "힙합", "수다"],
              ["먹방", "맛집", "일상"],
              ["영화", "드라마", "토론"],
              ["스포츠", "축구", "응원"],
              ["공부", "취업", "정보공유"],
              ["여행", "맛집", "추천"],
              ["애니", "웹툰", "덕후"],
              ["연애", "고민", "상담"],
              ["힐링", "일상", "소통"]
            ];
            const randomIndex = Math.floor(Math.random() * dummyHashtags.length);
            room.hashtags = dummyHashtags[randomIndex];
          }

          // 메시지 수와 참여자 수로 인기도 계산
          const msgQ = query(
            collection(db, "chatRooms", room.id, "messages"),
            orderBy("createdAt", "desc"),
            limit(100) // 성능을 위해 최근 100개만
          );
          const msgSnap = await getDocs(msgQ);
          const participants = new Set();
          let lastMsg = null;
          let messageCount = 0;

          msgSnap.forEach((msgDoc) => {
            const msg = msgDoc.data();
            if (msg.uid) participants.add(msg.uid);
            if (!lastMsg) lastMsg = msg;
            messageCount++;
          });

          // 좋아요 수 가져오기
          const likesQ = query(collection(db, "chatRooms", room.id, "likes"));
          const likesSnap = await getDocs(likesQ);
          const likesCount = likesSnap.size;

          // 사용자의 좋아요 상태 확인
          const userLikeDoc = auth.currentUser ? 
            await getDoc(doc(db, "chatRooms", room.id, "likes", auth.currentUser.uid)) : 
            null;
          const userLiked = userLikeDoc?.exists() || false;

          // 인기도 스코어 계산 (참여자 수 * 2 + 메시지 수 + 좋아요 수 * 3)
          const participantCount = participants.size;
          const popularityScore = participantCount * 2 + messageCount + likesCount * 3;

          // 방 정보 업데이트
          room.participantCount = participantCount;
          room.messageCount = messageCount;
          room.likesCount = likesCount;
          room.userLiked = userLiked;
          room.popularityScore = popularityScore;
          room.lastMsg = lastMsg;
          room.lastMsgTime = lastMsg?.createdAt?.seconds
            ? new Date(lastMsg.createdAt.seconds * 1000)
            : null;
          room.isActive = lastMsg?.createdAt?.seconds 
            ? (Date.now() - lastMsg.createdAt.seconds * 1000) < 3600000 // 1시간 이내
            : false;

          return room;
        } catch (error) {
          console.error(`Error processing room ${room.id}:`, error);
          room.participantCount = 0;
          room.messageCount = 0;
          room.likesCount = 0;
          room.userLiked = false;
          room.popularityScore = 0;
          room.isActive = false;
          return room;
        }
      });

      const processedRooms = await Promise.all(roomPromises);
      
      // 인기도순으로 정렬
      const sortedRooms = processedRooms
        .map(room => {
          // 인기도가 0인 방에게 최소 점수 부여 (1~5점 랜덤)
          if (room.popularityScore === 0) {
            room.popularityScore = Math.floor(Math.random() * 5) + 1;
          }
          return room;
        })
        .sort((a, b) => b.popularityScore - a.popularityScore);

      // 10개 미만일 경우 더미 채팅방 추가
      const dummyRoomNames = [
        "코딩 스터디방", "맛집 탐방단", "영화 리뷰방", "운동 메이트", "독서 클럽",
        "여행 계획방", "펜팔 친구들", "취미 공유방", "언어 교환방", "투자 정보방"
      ];
      
      const dummyHashtagSets = [
        ["코딩", "개발", "프로그래밍"],
        ["맛집", "리뷰", "추천"],
        ["영화", "리뷰", "토론"],
        ["운동", "헬스", "다이어트"],
        ["독서", "책", "추천"],
        ["여행", "계획", "정보"],
        ["펜팔", "외국어", "친구"],
        ["취미", "공유", "소통"],
        ["언어", "교환", "학습"],
        ["투자", "주식", "정보"]
      ];

      while (sortedRooms.length < 10) {
        const index = sortedRooms.length;
        const dummyRoom = {
          id: `dummy_${index}`,
          name: dummyRoomNames[index] || `채팅방 ${index + 1}`,
          hashtags: dummyHashtagSets[index] || ["일반", "소통"],
          participantCount: Math.floor(Math.random() * 50) + 5,
          messageCount: Math.floor(Math.random() * 200) + 10,
          likesCount: Math.floor(Math.random() * 30) + 1,
          popularityScore: Math.floor(Math.random() * 20) + 1,
          isActive: Math.random() > 0.3,
          userLiked: false
        };
        sortedRooms.push(dummyRoom);
      }

      const finalSortedRooms = sortedRooms.slice(0, 10); // 상위 10개까지

      setChatRooms(finalSortedRooms);
      setLoadingRooms(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredVideos = videos.filter(
    (video) =>
      video.snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.snippet.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChatRooms = chatRooms.filter(
    (room) =>
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.lastMsg?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase().replace('#', '')))
  );

  // 뒤로가기(채팅방으로 이동) 핸들러
  const handleBack = () => {
    navigate('/chat');
  };

  // 채팅방 클릭 시 이동
  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  // 검색 실행 함수
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // 채팅방 검색 결과가 있으면 첫 번째 방으로 이동
      if (filteredChatRooms.length > 0) {
        navigate(`/chat/${filteredChatRooms[0].id}`);
      }
    }
  };

  // 검색창 엔터키 처리 - 채팅방 검색
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 영상 선택 시 좋아요 상태 초기화
  useEffect(() => {
    // 타이머 정리 (변수명 통일)
    if (playerRef.current?._timer) {
      clearInterval(playerRef.current._timer);
      playerRef.current._timer = null;
    }
    
    setLiked(false);
    setWatchSeconds(0);
    setVideoCompleted(false);
    setFanCertified(false);
    
    if (selectedVideoId) {
      const video = videos.find(v => v.id === selectedVideoId);
      setLikeCount(video ? Number(video.statistics.likeCount || 0) : 0);
      currentVideoRef.current = selectedVideoId;
    } else {
      currentVideoRef.current = null;
    }
  }, [selectedVideoId]);

  // 플레이어 핸들러 - 단순화
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    console.log('✅ 플레이어 준비됨', event.target);
  };
  
  const handleYoutubeStateChange = (event) => {
    console.log('🎯 상태변경 감지:', event.data);
    console.log('📝 플레이어 객체:', playerRef.current);
    
    // 기존 타이머 무조건 정리
    if (playerRef.current?._timer) {
      clearInterval(playerRef.current._timer);
      playerRef.current._timer = null;
      console.log('🧹 기존 타이머 정리됨');
    }
    
    if (event.data === 1) {
      console.log('▶️ 재생 시작! 타이머 생성');
      console.log('🔍 getCurrentTime 함수 존재?', typeof playerRef.current?.getCurrentTime);
      
      // 재생 시작 - 단순한 타이머 1개만
      playerRef.current._timer = setInterval(() => {
        console.log('⏱️ 타이머 실행됨');
        if (playerRef.current?.getCurrentTime) {
          try {
            const currentTime = Math.floor(playerRef.current.getCurrentTime());
            console.log('⏰ 현재시간:', currentTime, '초');
            setWatchSeconds(currentTime);
          } catch (error) {
            console.log('❌ getCurrentTime 오류:', error);
          }
        } else {
          console.log('❌ getCurrentTime 함수 없음');
        }
      }, 1000);
      
      console.log('✅ 타이머 생성 완료');
    } else {
      console.log('⏸️ 재생 중지 (상태:', event.data, ')');
    }
    
    if (event.data === 0) {
      console.log('🏁 영상 완료');
      setVideoCompleted(true);
    }
  };

  // 팬 인증 핸들러
  const handleFanCertification = () => {
    const canCertify = videoDuration > 0 
      ? (videoDuration >= 180 ? watchSeconds >= 180 : watchSeconds >= videoDuration)
      : watchSeconds >= 180;
      
    if (canCertify && !fanCertified) {
      setFanCertified(true);
      alert('🎉 시청인증이 완료되었습니다! 크리에이터를 응원해주셔서 감사합니다.');
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (playerRef.current?._timer) {
        clearInterval(playerRef.current._timer);
        playerRef.current._timer = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <div className="text-gray-600 font-medium">로딩 중...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">오류 발생</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen overflow-y-auto"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="max-w-2xl mx-auto p-2 space-y-4">
        {/* 헤더 섹션 */}
        <div className="text-center py-4 relative">
          {/* 뒤로가기 버튼 - 왼쪽 상단에 고정 */}
          <button 
            onClick={handleBack} 
            className="absolute left-0 top-4 p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200 shadow-sm" 
            aria-label="채팅방으로 이동"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center justify-center mb-2">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-1">UCRA</h1>
              <p className="text-gray-600 text-sm">유튜브 크리에이터들의 공간</p>
            </div>
          </div>
        </div>

        {/* 실시간 인기 채팅방 순위 박스 */}
        <motion.div 
          className="card card-hover p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center mb-3 justify-center">
            <h2 className="text-xl font-bold text-center flex items-center justify-center">
              <span className="mr-2">🔥</span>
              실시간 인기 채팅방
            </h2>
          </div>
          
          {/* 검색창 */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="채팅방 이름, 키워드, #해시태그 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full p-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            />
            <button 
              onClick={handleSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-blue-600 transition-colors duration-200 p-1"
              aria-label="검색"
            >
              <svg className="w-5 h-5 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          
          {/* 인기 채팅방 순위 리스트 */}
          {loadingRooms ? (
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-500">채팅방 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {(searchQuery ? filteredChatRooms : chatRooms).slice(0, visibleRoomsCount).map((room, idx) => (
                <motion.button
                  key={room.id}
                  className="w-full flex items-center gap-3 hover:bg-blue-50 rounded-lg px-3 py-2 transition-all duration-200 text-left"
                  onClick={() => handleRoomClick(room.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center min-w-[50px]">
                    <span className={`
                      font-bold text-xs w-8 h-6 rounded-full flex items-center justify-center text-white shadow-md
                      ${idx === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                        idx === 1 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 
                        idx === 2 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 
                        'bg-gradient-to-r from-gray-400 to-gray-500'}
                    `}>
                      {idx + 1}위
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 truncate max-w-[160px]">
                      {room.name && room.name.length > 13 ? `${room.name.substring(0, 13)}...` : room.name}
                    </div>
                    {/* 해시태그 표시 */}
                    {room.hashtags && room.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {room.hashtags.slice(0, 3).map((tag, tagIdx) => (
                          <span key={tagIdx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            #{tag}
                          </span>
                        ))}
                        {room.hashtags.length > 3 && (
                          <span className="text-xs text-gray-400">+{room.hashtags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end text-sm">
                    {/* 사람수와 좋아요 수를 가로로 배치 */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center text-blue-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        <span className="font-semibold">{room.participantCount}명</span>
                      </div>
                      
                      <div className="flex items-center text-red-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-semibold">{room.likesCount || 0}</span>
                      </div>
                    </div>
                    
                    {/* 실시간 활성 상태 */}
                    {room.isActive && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </div>
                </motion.button>
              ))}
              
              {chatRooms.length === 0 && !loadingRooms && (
                <div className="text-center py-8 text-gray-500">
                  <p>아직 활성화된 채팅방이 없습니다</p>
                  <button
                    onClick={() => navigate('/chat')}
                    className="mt-2 text-blue-500 hover:text-blue-700 font-medium"
                  >
                    채팅방 만들러 가기 →
                  </button>
                </div>
              )}
              
              {/* 더보기 버튼 */}
              {!searchQuery && chatRooms.length > visibleRoomsCount && visibleRoomsCount < 10 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setVisibleRoomsCount(10)}
                    className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition-all duration-200"
                  >
                    더보기
                  </button>
                </div>
              )}
              
              {/* 접기 버튼 */}
              {!searchQuery && visibleRoomsCount > 3 && (
                <div className="text-center mt-2">
                  <button
                    onClick={() => setVisibleRoomsCount(3)}
                    className="px-4 py-1 text-gray-500 hover:text-gray-700 text-sm transition-all duration-200"
                  >
                    접기 ↑
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* 실시간 시청순위 리스트 */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
            📺 실시간 UCRA 시청순위
          </h3>
          
          <div className="space-y-3">
            {filteredVideos.slice(0, visibleCount).map((video, idx) => {
              const viewCount = Number(video.statistics.viewCount).toLocaleString();
              const likeCountDisplay = Number(video.statistics.likeCount || 0).toLocaleString();
              const watching = Math.floor(Math.random() * 1000) + 100;
              const rankChange = idx < 3 ? Math.floor(Math.random() * 3) + 1 : 0;
              
              return (
                <motion.div
                  key={video.id}
                  className="card card-hover p-2.5 cursor-pointer"
                  onClick={() => setSelectedVideoId(selectedVideoId === video.id ? null : video.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex gap-2.5 items-start">
                    {/* 순위 배지 - 더 작게 */}
                    <div className="flex flex-col items-center min-w-[35px] mt-1">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md
                        ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 
                          idx === 1 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 
                          idx === 2 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 
                          'bg-gradient-to-br from-gray-400 to-gray-500'}
                      `}>
                        {idx + 1}
                      </div>
                      {idx < 3 && (
                        <span className="text-green-500 text-xs font-medium mt-0.5 flex items-center">
                          <svg className="w-2 h-2 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          {rankChange}
                        </span>
                      )}
                    </div>
                    
                    {/* 썸네일 - 조금 작게 */}
                    <div className="relative">
                      <img
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        className="w-32 h-18 object-cover rounded-lg shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* 정보 - 더 컴팩트하게 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight text-sm">
                        {video.snippet.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-1.5 truncate font-medium">{video.snippet.channelTitle}</p>
                      
                      {/* 통계 - 더 컴팩트하게 */}
                      <div className="flex items-center gap-2.5 text-xs">
                        <div className="flex items-center text-red-500">
                          <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{likeCountDisplay}</span>
                        </div>
                        <div className="flex items-center text-indigo-500">
                          <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{watching}명</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* YouTube 플레이어 */}
                  <AnimatePresence>
                    {selectedVideoId === video.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3"
                      >
                        <div className="rounded-lg shadow-lg">
                          <YouTube
                            key={video.id}
                            videoId={video.id}
                            onReady={handleYoutubeReady}
                            onStateChange={handleYoutubeStateChange}
                            opts={{
                              width: "100%",
                              height: "200",
                              playerVars: {
                                autoplay: 1,
                                controls: 1,
                                modestbranding: 1,
                                rel: 0,
                              },
                            }}
                          />
                        </div>
                        
                        {/* 안내 문구 */}
                        <div className="mt-1 text-center">
                          <p className="text-xs text-gray-500">
                            💡 {videoDuration > 0 && videoDuration < 180 
                              ? `영상을 끝까지 시청하면 버튼이 활성화됩니다.` 
                              : `3분 이상 시청하면 버튼이 활성화됩니다.`}
                          </p>
                        </div>
                        
                        {/* 시청 시간 및 좋아요 */}
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                          {/* 시청 진행률 */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                시청 시간: <span className="font-bold text-blue-600">{watchSeconds}초</span>
                                {videoDuration > 0 && (
                                  <span className="text-gray-500"> / {Math.floor(videoDuration)}초</span>
                                )}
                              </span>
                              {videoDuration > 0 && (
                                <span className="text-gray-600">
                                  {Math.floor((watchSeconds / videoDuration) * 100)}% 시청
                                </span>
                              )}
                            </div>
                            
                            {/* 진행률 바 */}
                            {videoDuration > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                                  style={{ 
                                    width: `${Math.min((watchSeconds / videoDuration) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* 시청인증 가능 상태 표시 */}
                            {(() => {
                              const canCertify = videoDuration > 0 
                                ? (videoDuration >= 180 ? watchSeconds >= 180 : watchSeconds >= videoDuration)
                                : watchSeconds >= 180;
                              return canCertify && (
                                <div className="flex items-center text-green-600 text-sm font-medium">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  시청인증 가능!
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* 버튼들 */}
                          <div className="flex items-center justify-between gap-3">
                            {/* 좋아요 버튼 */}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                
                                // Google API가 설정되어 있고 로그인된 경우에만 실제 API 호출
                                if (window.youtubeAPI?.isSignedIn) {
                                  const success = liked 
                                    ? await window.youtubeAPI.unlikeVideo(video.id)
                                    : await window.youtubeAPI.likeVideo(video.id);
                                  
                                  if (success) {
                                    setLiked(!liked);
                                    setLikeCount(prev => liked ? prev - 1 : prev + 1);
                                  }
                                } else {
                                  // Google 로그인이 안된 경우 로컬에서만 동작
                                  setLiked(!liked);
                                  setLikeCount(prev => liked ? prev - 1 : prev + 1);
                                }
                              }}
                              className={`
                                flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 flex-1
                                ${liked 
                                  ? 'bg-pink-500 text-white shadow-lg' 
                                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
                                }
                              `}
                            >
                              <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="font-semibold">{likeCount.toLocaleString()}</span>
                            </button>
                            
                            {/* 시청인증 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFanCertification();
                              }}
                              disabled={(() => {
                                const canCertify = videoDuration > 0 
                                  ? (videoDuration >= 180 ? watchSeconds >= 180 : watchSeconds >= videoDuration)
                                  : watchSeconds >= 180;
                                return !canCertify || fanCertified;
                              })()}
                              className={`
                                flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 flex-1
                                ${fanCertified 
                                  ? 'bg-green-500 text-white shadow-lg cursor-default' 
                                  : (() => {
                                      const canCertify = videoDuration > 0 
                                        ? (videoDuration >= 180 ? watchSeconds >= 180 : watchSeconds >= videoDuration)
                                        : watchSeconds >= 180;
                                      return canCertify
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed';
                                    })()
                                }
                              `}
                            >
                              {fanCertified ? (
                                <>
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-semibold">인증완료</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="font-semibold">시청인증 좋아요</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          
          {/* 더보기 버튼 */}
          {visibleCount < filteredVideos.length && (
            <motion.div 
              className="text-center pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="btn-secondary text-sm py-2 px-4"
              >
                더 많은 영상 보기 ({filteredVideos.length - visibleCount}개 남음)
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
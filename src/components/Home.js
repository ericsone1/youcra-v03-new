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
  where,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

// 카테고리별 키워드 매핑
const CATEGORY_KEYWORDS = {
  'gaming': ['게임', '롤', '배그', '플레이', '공략', '게이밍', '스팀', '모바일게임', '리그오브레전드'],
  'entertainment': ['예능', '코미디', '웃긴', '리액션', '버라이어티', '토크쇼', '개그'],
  'music': ['음악', '노래', '커버', '뮤직', '힙합', '발라드', '댄스', '라이브', '작곡'],
  'education': ['강의', '교육', '배우기', '튜토리얼', '설명', '공부', '학습', '강좌'],
  'tech': ['기술', '프로그래밍', '개발', '코딩', 'IT', '소프트웨어', '하드웨어', '테크'],
  'lifestyle': ['일상', '브이로그', '라이프', '데일리', '생활', '힐링', '셀프케어'],
  'cooking': ['요리', '레시피', '쿠킹', '맛집', '음식', '먹방', '베이킹', '요리법'],
  'travel': ['여행', '관광', '여행기', '문화', '해외', '국내여행', '맛집투어'],
  'beauty': ['뷰티', '메이크업', '스킨케어', '화장품', '패션', '코디', '뷰티팁'],
  'fitness': ['운동', '헬스', '홈트', '다이어트', '필라테스', '요가', '피트니스'],
  'review': ['리뷰', '언박싱', '제품평가', '체험', '후기', '추천', '비교'],
  'comedy': ['개그', '유머', '웃긴영상', '코미디', '패러디', '몰래카메라'],
  'news': ['뉴스', '시사', '정치', '사회', '경제', '국제뉴스', '이슈'],
  'animal': ['동물', '반려동물', '강아지', '고양이', '펫', '동물원', '야생동물'],
  'kids': ['키즈', '어린이', '아이들', '유아', '교육', '놀이', '동요'],
  'sports': ['스포츠', '축구', '야구', '농구', '올림픽', '운동경기', '체육'],
  'science': ['과학', '실험', '연구', '물리', '화학', '생물', '과학상식'],
  'art': ['예술', '그림', '미술', '조각', '창작', '아트', '디자인'],
  'business': ['비즈니스', '경제', '투자', '창업', '부동산', '주식', '경영'],
  'other': ['기타', '일반', '소통', '잡담', '자유주제']
};

function Home() {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchTimer, setWatchTimer] = useState(null);
  const playerRef = useRef(null);
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [fanCertified, setFanCertified] = useState(false);
  const currentVideoRef = useRef(null);
  
  // 유크라 내 영상 관련 상태
  const [ucraVideos, setUcraVideos] = useState([]);
  const [userCategory, setUserCategory] = useState(null);
  const [loadingUcraVideos, setLoadingUcraVideos] = useState(true);

  // 채팅방 상태 추가
  const [chatRooms, setChatRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomLikes, setRoomLikes] = useState({}); // 좋아요 상태 관리
  const [visibleRoomsCount, setVisibleRoomsCount] = useState(3); // 표시할 채팅방 수

  // 영상 종료 상태 추가
  const [videoEnded, setVideoEnded] = useState(false);

  // 새로운 상태 추가
  const [playerLoading, setPlayerLoading] = useState(false);

  // YouTube 에러 억제를 위한 선별적 에러 핸들러 (플레이어 정리는 방해하지 않음)
  useEffect(() => {
    const originalError = window.console.error;
    const originalWarn = window.console.warn;
    
    window.console.error = (...args) => {
      const message = args.join(' ');
      // 플레이어 관련 중요한 에러는 놔두고, 스팸성 에러만 억제
      if (message.includes('signature decipher') ||
          message.includes('ProcessPage: TypeError') ||
          message.includes('chrome-extension') ||
          message.includes('Content Security Policy')) {
        return; // 스팸성 에러만 무시
      }
      originalError.apply(console, args);
    };
    
    window.console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('signature decipher') ||
          message.includes('ProcessPage') ||
          message.includes('chrome-extension')) {
        return; // 스팸성 경고만 무시
      }
      originalWarn.apply(console, args);
    };

    return () => {
      window.console.error = originalError;
      window.console.warn = originalWarn;
    };
  }, []);

  // 사용자 카테고리 정보 가져오기
  useEffect(() => {
    const fetchUserCategory = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().youtubeChannel?.category) {
          setUserCategory(userDoc.data().youtubeChannel.category);
        }
      } catch (error) {
        console.error('사용자 카테고리 로드 오류:', error);
      }
    };

    fetchUserCategory();
  }, [currentUser]);

  // UCRA 등록된 영상들 가져오기 (카테고리 필터링 포함)
  useEffect(() => {
    const fetchUcraVideos = async () => {
      setLoadingUcraVideos(true);
      try {
        const roomsQuery = query(collection(db, "chatRooms"));
        const roomsSnapshot = await getDocs(roomsQuery);
        
        let allVideos = [];
        
        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = roomDoc.data();
          const videosQuery = query(
            collection(db, "chatRooms", roomDoc.id, "videos"),
            orderBy("registeredAt", "desc")
          );
          const videosSnapshot = await getDocs(videosQuery);
          
          videosSnapshot.forEach(videoDoc => {
            const videoData = videoDoc.data();
            allVideos.push({
              ...videoData,
              id: videoDoc.id,
              roomId: roomDoc.id,
              roomName: roomData.name || '제목 없음',
              // 유크라 내 조회수 (시뮬레이션 - 실제로는 조회 기록을 저장해야 함)
              ucraViewCount: Math.floor(Math.random() * 1000) + 50,
              ucraLikes: Math.floor(Math.random() * 100) + 10
            });
          });
        }
        
        // 카테고리 필터링
        let filteredVideos = allVideos;
        if (userCategory && userCategory.id !== 'other') {
          const categoryKeywords = CATEGORY_KEYWORDS[userCategory.id] || [];
          filteredVideos = allVideos.filter(video => {
            const title = video.title?.toLowerCase() || '';
            const description = video.description?.toLowerCase() || '';
            const channelTitle = video.channelTitle?.toLowerCase() || '';
            
            return categoryKeywords.some(keyword => 
              title.includes(keyword.toLowerCase()) ||
              description.includes(keyword.toLowerCase()) ||
              channelTitle.includes(keyword.toLowerCase())
            );
          });
        }
        
        // UCRA 내 조회수 기준으로 정렬
        filteredVideos.sort((a, b) => b.ucraViewCount - a.ucraViewCount);
        
        setUcraVideos(filteredVideos.slice(0, 20)); // 상위 20개만
      } catch (error) {
        console.error('UCRA 영상 로드 오류:', error);
      } finally {
        setLoadingUcraVideos(false);
      }
    };

    fetchUcraVideos();
  }, [userCategory]);

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

  // 채팅방 클릭 시 이동
  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}/info`);
  };

  // 검색 실행 함수
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // 채팅방 검색 결과가 있으면 첫 번째 방으로 이동
      if (filteredChatRooms.length > 0) {
        navigate(`/chat/${filteredChatRooms[0].id}/info`);
      }
    }
  };

  // 검색창 엔터키 처리 - 채팅방 검색
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 영상 선택 핸들러
  const handleVideoSelect = (videoId) => {
    if (selectedVideoId === videoId) {
      setSelectedVideoId(null);
      setWatchSeconds(0);
      setVideoEnded(false);
      setLiked(false);
      setLikeCount(0);
      setFanCertified(false);
      setIsPlaying(false);
      setVideoDuration(0);
      setVideoCompleted(false);
      setPlayerLoading(false);
    } else {
      setSelectedVideoId(videoId);
      setWatchSeconds(0);
      setVideoEnded(false);
      setLiked(false);
      setFanCertified(false);
      setIsPlaying(false);
      setVideoDuration(0);
      setVideoCompleted(false);
      setPlayerLoading(true);
      // 좋아요 수 설정
      const ucraVideo = ucraVideos.find(v => v.videoId === videoId);
      const youtubeVideo = videos.find(v => v.id === videoId);
      if (ucraVideo) {
        setLikeCount(ucraVideo.ucraLikes || Math.floor(Math.random() * 1000) + 100);
      } else if (youtubeVideo) {
        setLikeCount(Number(youtubeVideo.statistics.likeCount || 0));
      } else {
        setLikeCount(Math.floor(Math.random() * 1000) + 100);
      }
    }
  };

  // YouTube 핸들러 (playerRef만 관리)
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    setVideoDuration(event.target.getDuration());
    setPlayerLoading(false);
  };
  const handleYoutubeStateChange = (event) => {
    if (event.data === 1) {
      // 재생 중
      setIsPlaying(true);
    } else if (event.data === 0) {
      // 종료
      setVideoCompleted(true);
      setVideoEnded(true);
      setIsPlaying(false);
    } else {
      // 일시정지 등
      setIsPlaying(false);
    }
  };
  const handleYoutubeEnd = () => {
    setVideoCompleted(true);
    setVideoEnded(true);
    setIsPlaying(false);
    if (playerRef.current?._watchTimer) {
      clearInterval(playerRef.current._watchTimer);
      playerRef.current._watchTimer = null;
    }
  };

  // 팬 인증 핸들러
  const handleFanCertification = () => {
    const canCertify = videoDuration > 0 
      ? (videoDuration >= 180 ? watchSeconds >= 180 : videoEnded)
      : watchSeconds >= 180;
      
    if (canCertify && !fanCertified) {
      setFanCertified(true);
      alert('🎉 시청인증이 완료되었습니다! 크리에이터를 응원해주셔서 감사합니다.');
    }
  };

  const computeUniqueVideos = (videosArr) => {
    const seen = new Set();
    return videosArr.filter(v => {
      if (seen.has(v.videoId)) return false;
      seen.add(v.videoId);
      return true;
    });
  };

  const uniqueVideos = computeUniqueVideos(ucraVideos);

  // 시청시간 타이머 관리
  useEffect(() => {
    if (isPlaying && selectedVideoId && !watchTimer) {
      const timer = setInterval(() => {
        setWatchSeconds(prev => prev + 1);
      }, 1000);
      setWatchTimer(timer);
    } else if (!isPlaying && watchTimer) {
      clearInterval(watchTimer);
      setWatchTimer(null);
    }

    return () => {
      if (watchTimer) clearInterval(watchTimer);
    };
  }, [isPlaying, selectedVideoId, watchTimer]);

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
      className="min-h-screen overflow-y-auto hide-scrollbar"
    >

      <div className="max-w-2xl mx-auto p-2 space-y-4">
        {/* 헤더 섹션 */}
        <div className="text-center py-4 relative">
          <div className="flex items-center justify-center mb-2">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-1">UCRA</h1>
              <p className="text-gray-600 text-sm">유튜브 크리에이터들의 공간</p>
            </div>
          </div>
        </div>

        {/* 실시간 인기 채팅방 순위 박스 */}
        <div className="card card-hover p-4">
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
                <button
                  key={room.id}
                  className="w-full flex items-center gap-3 hover:bg-blue-50 rounded-lg px-3 py-2 transition-all duration-200 text-left"
                  onClick={() => handleRoomClick(room.id)}
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
                </button>
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
        </div>

        {/* UCRA 내 매칭 영상순위 리스트 */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-4">
            <h3 className="text-3xl mb-2">
              <span className="inline-block align-middle mr-2">📺</span>
              <span className="text-xl font-bold align-middle">UCRA에 등록된 나와 매칭 영상순위</span>
            </h3>
            {userCategory ? (
              <div className="flex items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full text-white ${userCategory.color}`}>
                  <span>{userCategory.icon}</span>
                  <span>{userCategory.name}</span>
                </span>
                <span className="text-sm text-gray-500">카테고리 기반 추천</span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {currentUser ? '마이채널에서 카테고리를 설정하면 맞춤 영상을 볼 수 있어요!' : '로그인하면 맞춤 영상을 볼 수 있어요!'}
              </p>
            )}
          </div>
          
          {!currentUser ? (
            <div className="text-center py-12">
              <p className="text-gray-700 mb-6 px-4 leading-relaxed text-base sm:text-lg font-medium whitespace-pre-line">
                당신과 유사한 채널을 운영하는 사람들이<br />
                어떤 영상을 만들었는지 궁금하다면?<br />
                <span className="font-bold text-blue-600">지금 로그인하고 확인해 보세요!</span>
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-semibold shadow-md"
              >
                로그인 / 회원가입
              </button>
            </div>
          ) : loadingUcraVideos ? (
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-500">영상 불러오는 중...</p>
            </div>
          ) : ucraVideos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">아직 등록된 영상이 없습니다.</p>
              <button
                onClick={() => navigate('/chat')}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                채팅방에서 영상 공유하기 →
              </button>
            </div>
          ) : (
            <motion.div className="space-y-3">
              <AnimatePresence>
                {uniqueVideos.slice(0, visibleCount).map((video, idx) => {
                  const ucraViewCount = video.ucraViewCount?.toLocaleString() || '0';
                  const ucraLikes = video.ucraLikes?.toLocaleString() || '0';
                  const watching = Math.floor(Math.random() * 50) + 10; // UCRA 내 현재 시청자 수
                  const rankChange = idx < 3 ? Math.floor(Math.random() * 3) + 1 : 0;
                
                  return (
                    <motion.div
                      key={video.videoId}
                      className="card card-hover p-2.5 cursor-pointer"
                      onClick={() => handleVideoSelect(video.videoId)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                    <div className="flex gap-2.5 items-start">
                      {/* 순위 배지 */}
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
                    
                      {/* 썸네일 */}
                      <div className="relative">
                        <img
                          src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                          alt={video.title}
                          className="w-32 h-18 object-cover rounded-lg shadow-lg"
                          onError={(e) => {
                            e.target.src = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* 영상 정보 */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight text-sm">
                          {video.title}
                        </h4>
                        <p className="text-xs text-gray-500 mb-1.5 truncate font-medium">{video.channelTitle}</p>
                        
                        {/* UCRA 내 통계 */}
                        <div className="flex items-center gap-2.5 text-xs mb-1">
                          <div className="flex items-center text-red-500">
                            <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">{ucraLikes}</span>
                          </div>
                          <div className="flex items-center text-purple-500">
                            <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">{ucraViewCount}</span>
                          </div>
                          <div className="flex items-center text-green-500">
                            <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">{watching}명</span>
                          </div>
                        </div>
                        
                        {/* UCRA 표시 */}
                        <div className="text-xs text-blue-600 font-medium">
                          🎯 UCRA 순위 #{idx + 1}
                        </div>
                      </div>
                    </div>
                    
                    {/* YouTube 플레이어 */}
                    {selectedVideoId === video.videoId && (
                      <div className="relative mt-3">
                        {playerLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                            <span className="text-gray-500">영상 로딩 중...</span>
                          </div>
                        )}
                        <YouTube
                          key={video.videoId}
                          videoId={video.videoId}
                          onReady={handleYoutubeReady}
                          onStateChange={handleYoutubeStateChange}
                          onEnd={handleYoutubeEnd}
                          opts={{
                            width: "100%",
                            height: "200",
                            playerVars: {
                              autoplay: 1,
                              controls: 1,
                              modestbranding: 1,
                              rel: 0,
                              enablejsapi: 1,
                              playsinline: 1,
                            },
                          }}
                        />
                        {/* 플레이어 컨트롤, 버튼 등 기존 코드 유지 */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              시청 시간: <span className="font-bold text-blue-600">{watchSeconds}초</span>
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLiked(!liked);
                                  setLikeCount(prev => liked ? prev - 1 : prev + 1);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                  liked 
                                    ? 'bg-pink-500 text-white' 
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
                                }`}
                              >
                                ❤️ {likeCount.toLocaleString()}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFanCertification();
                                }}
                                disabled={fanCertified || (videoDuration >= 180 ? watchSeconds < 180 : !videoEnded)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                  fanCertified 
                                    ? 'bg-green-500 text-white cursor-default' 
                                    : (videoDuration >= 180 ? watchSeconds >= 180 : videoEnded)
                                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {fanCertified ? '✅ 인증완료' : '⭐ 시청인증'}
                              </button>
                            </div>
                          </div>
                          
                          {/* 진행률 바 */}
                          {videoDuration > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.min((watchSeconds / videoDuration) * 100, 100)}%` 
                                }}
                              />
                            </div>
                          )}
                          
                          {/* 방입장 및 유튜브 연결 버튼 */}
                          <div className="flex gap-3 mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/chat/${video.roomId}/info`);
                              }}
                              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              🚪 방 입장하기
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
                              }}
                              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              ❤️ 구독/좋아요
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
              </AnimatePresence>
              
              {/* 더보기 / 끝 메시지 */}
              <div className="text-center mt-4">
                <button
                  onClick={() => setVisibleCount(prev => prev + 5)}
                  disabled={visibleCount >= uniqueVideos.length}
                  className={`px-6 py-2 rounded-full font-bold transition-all duration-200 ${
                    visibleCount < uniqueVideos.length
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-gray-200 text-gray-400 cursor-default'
                  }`}
                >
                  {visibleCount < uniqueVideos.length
                    ? `더보기 (${uniqueVideos.length - visibleCount}개 더)`
                    : '더 이상 영상이 없습니다.'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
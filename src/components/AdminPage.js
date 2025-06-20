import React, { useState } from 'react';
import AdminDeleteAllChatRooms from './AdminDeleteAllChatRooms';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminPage() {
  const [isCreatingPosts, setIsCreatingPosts] = useState(false);
  
  // 인증 관리 관련 상태
  const [selectedRoomId, setSelectedRoomId] = useState('xojnZj99BRNLbHXmSkof');
  const [targetUserInput, setTargetUserInput] = useState('SONAGI MUSIC');
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allParticipants, setAllParticipants] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // 더미 게시물 데이터
  const dummyPosts = [
    // 협업모집 게시판
    {
      title: "🎮 게임 컨텐츠 공동채널 운영 멤버 모집!",
      content: "안녕하세요! 저희는 게임 컨텐츠를 전문으로 하는 채널을 운영하고 있습니다.\n\n현재 팀 구성:\n- 기획자 1명\n- 편집자 1명\n- 썸네일 디자이너 1명\n\n모집 대상:\n- 게임 실력이 뛰어나신 분\n- 재미있는 리액션과 토크가 가능하신 분\n- 꾸준히 활동 가능하신 분\n\n🎯 목표: 구독자 10만 달성\n📧 연락처: game.channel@gmail.com\n💬 디스코드: GameTeam#1234",
      category: "collaboration",
      collaborationType: "channel",
      type: "text",
      author: {
        uid: "admin_dummy",
        email: "admin@youcra.com", 
        displayName: "게임마스터",
        photoURL: ""
      }
    },
    {
      title: "🎬 영화 리뷰 채널 편집자 구합니다",
      content: "영화 리뷰 컨텐츠를 제작하는 개인 크리에이터입니다.\n\n현재 상황:\n- 주 2회 업로드 (화, 금)\n- 구독자 3만명\n- 월 수익 200-300만원\n\n찾는 분:\n- 프리미어 프로/파이널컷 숙련자\n- 영화에 관심이 많으신 분\n- 장기적 파트너십 원하시는 분\n\n조건:\n- 편집비: 영상당 15-20만원\n- 수익 배분 가능 (협의)\n- 재택근무\n\n✉️ 포트폴리오 첨부해서 연락주세요!",
      category: "collaboration", 
      collaborationType: "content",
      type: "text",
      author: {
        uid: "admin_dummy2",
        email: "movie@youcra.com",
        displayName: "영화광",
        photoURL: ""
      }
    },
    // 홍보게시판
    {
      title: "🔥 요리 초보자를 위한 '쉬운 레시피' 채널 홍보",
      content: "안녕하세요! 요리 초보자도 쉽게 따라할 수 있는 레시피를 소개하는 채널입니다.\n\n📺 채널 특징:\n- 10분 이내 간단 요리\n- 재료비 1만원 이하\n- 실패 없는 레시피만 선별\n- 매주 화, 목, 토 업로드\n\n🎯 최근 인기 영상:\n- '계란 하나로 만드는 5가지 요리'\n- '라면을 200% 맛있게 끓이는 법'\n- '전자레인지로 만드는 케이크'\n\n구독자 여러분들의 레시피 요청도 받고 있어요!\n많은 관심 부탁드립니다 🙏",
      category: "promotion",
      channelUrl: "https://youtube.com/@easycooking",
      type: "text", 
      author: {
        uid: "admin_dummy3",
        email: "cooking@youcra.com",
        displayName: "쿠킹셰프",
        photoURL: ""
      }
    },
    {
      title: "🎵 K-POP 댄스 커버 채널 & 채팅방 홍보",
      content: "K-POP 댄스 커버 전문 채널과 팬들과 소통하는 채팅방을 운영하고 있습니다!\n\n💃 채널 내용:\n- 최신 K-POP 안무 커버\n- 안무 튜토리얼\n- 댄서들과의 콜라보\n- 라이브 방송\n\n🎪 채팅방 특징:\n- 실시간 안무 피드백\n- 댄스 챌린지 이벤트\n- 멤버들끼리 커버 영상 공유\n- 월 1회 오프라인 모임\n\n현재 멤버 200명+\n초보자도 환영합니다! 함께 춤춰요 💫",
      category: "promotion",
      channelUrl: "https://youtube.com/@kpopdance",
      chatRoomLink: "https://ucrachat.com/chat/kpop-dance",
      type: "text",
      author: {
        uid: "admin_dummy4", 
        email: "dance@youcra.com",
        displayName: "댄스퀸",
        photoURL: ""
      }
    },
    // 건의사항
    {
      title: "💡 [기능 건의] 채팅방 내 음성 채팅 기능 추가 요청",
      content: "안녕하세요! 유크라를 정말 잘 사용하고 있습니다.\n\n건의사항:\n채팅방에서 텍스트 뿐만 아니라 음성으로도 소통할 수 있으면 좋겠어요.\n\n예상 기능:\n- 음성 채팅 버튼 추가\n- 최대 10명까지 동시 음성 채팅\n- 방장이 음성 채팅 허용/차단 설정\n- 음성 품질 조절 옵션\n\n이유:\n- 게임하면서 채팅하기 불편함\n- 요리/운동 영상 보면서 손 못 쓸 때\n- 더 생동감 있는 소통 가능\n\n🙏 검토 부탁드립니다!",
      category: "suggestion",
      type: "text",
      author: {
        uid: "admin_dummy5",
        email: "user1@gmail.com",
        displayName: "음성채팅희망자",
        photoURL: ""
      }
    },
    {
      title: "🐛 [버그 신고] 영상 재생 중 앱이 가끔 멈춤 현상",
      content: "앱 사용 중 발견한 버그를 신고드립니다.\n\n🔍 버그 상황:\n- 채팅방에서 유튜브 영상 재생 시\n- 5-10분 후 갑자기 앱이 멈춤\n- 새로고침해야 다시 정상 작동\n\n📱 환경 정보:\n- 디바이스: iPhone 14 Pro\n- iOS: 17.2\n- 브라우저: Safari\n- 발생 빈도: 주 2-3회\n\n🎬 재현 방법:\n1. 채팅방 입장\n2. 긴 영상(30분+) 재생\n3. 채팅 활발히 참여\n4. 5-10분 후 앱 정지\n\n📸 스크린샷 첨부 가능합니다.\n빠른 수정 부탁드려요!",
      category: "suggestion",
      type: "text", 
      author: {
        uid: "admin_dummy6",
        email: "user2@gmail.com", 
        displayName: "버그헌터",
        photoURL: ""
      }
    }
  ];

  const createDummyPosts = async () => {
    setIsCreatingPosts(true);
    try {
      for (const post of dummyPosts) {
        await addDoc(collection(db, "posts"), {
          ...post,
          createdAt: serverTimestamp(),
          likes: Math.floor(Math.random() * 20), // 0-19 랜덤 좋아요
          comments: Math.floor(Math.random() * 10), // 0-9 랜덤 댓글
          views: Math.floor(Math.random() * 100) + 50 // 50-149 랜덤 조회수
        });
      }
      alert('✅ 더미 게시물 6개가 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('더미 게시물 생성 오류:', error);
      alert('❌ 더미 게시물 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingPosts(false);
    }
  };

  // 유저 검색 및 인증 상태 확인
  const searchUserAndVideos = async () => {
    if (!targetUserInput.trim()) {
      alert('유저명을 입력해주세요.');
      return;
    }

    setIsSearchingUser(true);
    try {
      console.log(`🔍 "${targetUserInput}" 유저 검색 중...`);
      
      // 1. 참여자에서 유저 찾기
      console.log('🔍 채팅방 ID:', selectedRoomId);
      const participantsRef = collection(db, 'chatRooms', selectedRoomId, 'participants');
      const allParticipantsSnap = await getDocs(participantsRef);
      
      console.log('📋 참여자 문서 개수:', allParticipantsSnap.size);
      
      // 모든 참여자 목록 저장
      const participantsList = await Promise.all(
        allParticipantsSnap.docs.map(async (participantDoc) => {
          const uid = participantDoc.id;
          const participantData = participantDoc.data();
          console.log('👤 참여자 기본 데이터:', { uid, ...participantData });
          
          // users 컬렉션에서 상세 정보 가져오기
          try {
            const userRef = doc(db, 'users', uid);
            const userSnapshot = await getDoc(userRef);
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              console.log('✅ users 컬렉션 데이터:', userData);
              
              return {
                uid,
                nickname: userData.displayName || userData.nick || userData.name || participantData.displayName || participantData.nickname,
                displayName: userData.displayName || userData.nick || userData.name || participantData.displayName,
                email: userData.email || participantData.email,
                photoURL: userData.photoURL || userData.profileImage || participantData.photoURL,
                // participants 컬렉션의 추가 정보도 유지
                ...participantData
              };
            } else {
              console.log('⚠️ users 컬렉션에 해당 유저 없음:', uid);
            }
          } catch (userError) {
            console.error('❌ users 컬렉션 조회 실패:', userError);
          }
          
          // users 컬렉션에서 가져오지 못한 경우 participants 데이터만 사용
          return {
            uid,
            nickname: participantData.displayName || participantData.nickname || participantData.email?.split('@')[0],
            displayName: participantData.displayName || participantData.nickname,
            email: participantData.email,
            photoURL: participantData.photoURL,
            ...participantData
          };
        })
      );
      
      console.log('📊 전체 참여자 목록:', participantsList);
      setAllParticipants(participantsList);
      
      let targetUser = null;
      participantsList.forEach(data => {
        if (
          (data.nickname && data.nickname.includes(targetUserInput)) ||
          (data.displayName && data.displayName.includes(targetUserInput)) ||
          (data.email && data.email.includes(targetUserInput.toLowerCase()))
        ) {
          targetUser = data;
        }
      });

      if (!targetUser) {
        alert(`"${targetUserInput}" 유저를 찾을 수 없습니다.`);
        setFoundUser(null);
        setUserVideos([]);
        return;
      }

      console.log('✅ 유저 발견:', targetUser);
      setFoundUser(targetUser);

      // 2. 채팅방 영상 목록 가져오기
      const videosRef = collection(db, 'chatRooms', selectedRoomId, 'videos');
      const videosSnap = await getDocs(videosRef);
      
      const videosList = [];
      
      // 3. 각 영상의 인증 상태 확인
      for (const videoDoc of videosSnap.docs) {
        const videoData = videoDoc.data();
        
        // 해당 유저의 인증 기록 확인
        const certRef = collection(db, 'chatRooms', selectedRoomId, 'videos', videoDoc.id, 'certifications');
        const certQuery = query(certRef, where('uid', '==', targetUser.uid));
        const certSnap = await getDocs(certQuery);
        
        videosList.push({
          id: videoDoc.id,
          title: videoData.title,
          thumbnail: videoData.thumbnail,
          duration: videoData.duration,
          isCertified: !certSnap.empty,
          certificationCount: certSnap.size
        });
      }

      setUserVideos(videosList);
      console.log(`📹 총 ${videosList.length}개 영상 중 ${videosList.filter(v => v.isCertified).length}개 인증됨`);

    } catch (error) {
      console.error('유저 검색 오류:', error);
      alert('유저 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearchingUser(false);
    }
  };

  // 모든 영상 인증 추가
  const addAllCertifications = async () => {
    if (!foundUser) {
      alert('먼저 유저를 검색해주세요.');
      return;
    }

    const uncertifiedVideos = userVideos.filter(v => !v.isCertified);
    if (uncertifiedVideos.length === 0) {
      alert('이미 모든 영상이 인증되어 있습니다.');
      return;
    }

    if (!window.confirm(`${foundUser.nickname || foundUser.displayName}님의 미인증 영상 ${uncertifiedVideos.length}개에 인증을 추가하시겠습니까?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      let successCount = 0;
      
      for (const video of uncertifiedVideos) {
        try {
          const certRef = collection(db, 'chatRooms', selectedRoomId, 'videos', video.id, 'certifications');
          await addDoc(certRef, {
            uid: foundUser.uid,
            email: foundUser.email,
            certifiedAt: serverTimestamp(),
            addedBy: 'admin',
            addedAt: serverTimestamp()
          });
          successCount++;
          console.log(`✅ "${video.title}" 인증 추가 완료`);
        } catch (error) {
          console.error(`❌ "${video.title}" 인증 추가 실패:`, error);
        }
      }

      alert(`✅ ${successCount}개 영상 인증이 추가되었습니다!`);
      
      // 상태 새로고침
      await searchUserAndVideos();

    } catch (error) {
      console.error('인증 추가 오류:', error);
      alert('인증 추가 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 모든 영상 인증 제거
  const removeAllCertifications = async () => {
    if (!foundUser) {
      alert('먼저 유저를 검색해주세요.');
      return;
    }

    const certifiedVideos = userVideos.filter(v => v.isCertified);
    if (certifiedVideos.length === 0) {
      alert('인증된 영상이 없습니다.');
      return;
    }

    if (!window.confirm(`${foundUser.nickname || foundUser.displayName}님의 인증된 영상 ${certifiedVideos.length}개의 인증을 제거하시겠습니까?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      let successCount = 0;
      
      for (const video of certifiedVideos) {
        try {
          const certRef = collection(db, 'chatRooms', selectedRoomId, 'videos', video.id, 'certifications');
          const certQuery = query(certRef, where('uid', '==', foundUser.uid));
          const certSnap = await getDocs(certQuery);
          
          // 해당 유저의 모든 인증 기록 삭제
          for (const certDoc of certSnap.docs) {
            await deleteDoc(doc(db, 'chatRooms', selectedRoomId, 'videos', video.id, 'certifications', certDoc.id));
          }
          
          successCount++;
          console.log(`✅ "${video.title}" 인증 제거 완료`);
        } catch (error) {
          console.error(`❌ "${video.title}" 인증 제거 실패:`, error);
        }
      }

      alert(`✅ ${successCount}개 영상 인증이 제거되었습니다!`);
      
      // 상태 새로고침
      await searchUserAndVideos();

    } catch (error) {
      console.error('인증 제거 오류:', error);
      alert('인증 제거 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 모든 참여자 불러오기 함수 추가
  const loadAllParticipants = async () => {
    if (!selectedRoomId.trim()) {
      alert('채팅방 ID를 입력해주세요.');
      return;
    }
    
    setIsSearchingUser(true);
    try {
      console.log('🔍 채팅방 ID:', selectedRoomId);
      const participantsRef = collection(db, 'chatRooms', selectedRoomId, 'participants');
      const allParticipantsSnap = await getDocs(participantsRef);
      
      console.log('📋 참여자 문서 개수:', allParticipantsSnap.size);
      
      const participantsList = await Promise.all(
        allParticipantsSnap.docs.map(async (participantDoc) => {
          const uid = participantDoc.id;
          const participantData = participantDoc.data();
          console.log('👤 참여자 기본 데이터:', { uid, ...participantData });
          
          // users 컬렉션에서 상세 정보 가져오기
          try {
            const userRef = doc(db, 'users', uid);
            const userSnapshot = await getDoc(userRef);
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              console.log('✅ users 컬렉션 데이터:', userData);
              
              return {
                uid,
                nickname: userData.displayName || userData.nick || userData.name || participantData.displayName || participantData.nickname,
                displayName: userData.displayName || userData.nick || userData.name || participantData.displayName,
                email: userData.email || participantData.email,
                photoURL: userData.photoURL || userData.profileImage || participantData.photoURL,
                // participants 컬렉션의 추가 정보도 유지
                ...participantData
              };
            } else {
              console.log('⚠️ users 컬렉션에 해당 유저 없음:', uid);
            }
          } catch (userError) {
            console.error('❌ users 컬렉션 조회 실패:', userError);
          }
          
          // users 컬렉션에서 가져오지 못한 경우 participants 데이터만 사용
          return {
            uid,
            nickname: participantData.displayName || participantData.nickname || participantData.email?.split('@')[0],
            displayName: participantData.displayName || participantData.nickname,
            email: participantData.email,
            photoURL: participantData.photoURL,
            ...participantData
          };
        })
      );
      
      console.log('📊 최종 참여자 목록:', participantsList);
      setAllParticipants(participantsList);
      
    } catch (error) {
      console.error('참여자 목록 로드 오류:', error);
      alert('참여자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsSearchingUser(false);
    }
  };

  // 전체보기 토글 함수 수정
  const toggleShowAllUsers = async () => {
    if (!showAllUsers && allParticipants.length === 0) {
      // 처음 전체보기를 누르고 참여자 목록이 없으면 로드
      await loadAllParticipants();
    }
    setShowAllUsers(!showAllUsers);
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001' }}>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#d00' }}>관리자 페이지</h1>
      
      {/* 유저 인증 관리 섹션 */}
      <div style={{ marginBottom: 40, padding: 20, backgroundColor: '#f0f8ff', borderRadius: 12, border: '2px solid #87ceeb' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1e90ff' }}>🎯 유저 인증 관리</h2>
        
        {/* 검색 입력 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#333' }}>채팅방 ID:</label>
          <input
            type="text"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, marginBottom: 12 }}
            placeholder="채팅방 ID (예: xojnZj99BRNLbHXmSkof)"
          />
          
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#333' }}>유저명:</label>
          <input
            type="text"
            value={targetUserInput}
            onChange={(e) => setTargetUserInput(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, marginBottom: 12 }}
            placeholder="닉네임, 이메일 또는 표시명"
          />
          
                     <div style={{ display: 'flex', gap: 8 }}>
             <button
               onClick={searchUserAndVideos}
               disabled={isSearchingUser}
               style={{
                 flex: 1,
                 padding: '12px',
                 backgroundColor: isSearchingUser ? '#6c757d' : '#007bff',
                 color: 'white',
                 border: 'none',
                 borderRadius: 6,
                 fontWeight: 'bold',
                 cursor: isSearchingUser ? 'not-allowed' : 'pointer'
               }}
             >
               {isSearchingUser ? '🔍 검색 중...' : '🔍 유저 검색'}
             </button>
             
             <button
               onClick={toggleShowAllUsers}
               disabled={isSearchingUser}
               style={{
                 padding: '12px 16px',
                 backgroundColor: isSearchingUser ? '#6c757d' : '#6c757d',
                 color: 'white',
                 border: 'none',
                 borderRadius: 6,
                 fontWeight: 'bold',
                 cursor: isSearchingUser ? 'not-allowed' : 'pointer'
               }}
             >
               {isSearchingUser ? '⏳ 로딩...' : (showAllUsers ? '👁️ 숨기기' : '👥 전체보기')}
             </button>
           </div>
                 </div>

         {/* 모든 참여자 목록 표시 */}
         {showAllUsers && allParticipants.length > 0 && (
           <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #ddd' }}>
             <h3 style={{ margin: 0, marginBottom: 8, color: '#333' }}>👥 채팅방 전체 참여자 ({allParticipants.length}명):</h3>
             <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 12 }}>
               {allParticipants.map((user, index) => (
                 <div key={user.uid} style={{ 
                   padding: 8, 
                   borderBottom: '1px solid #eee',
                   cursor: 'pointer',
                   backgroundColor: '#f8f9fa'
                 }}
                 onClick={() => {
                   setTargetUserInput(user.nickname || user.displayName || user.email || user.uid);
                   setShowAllUsers(false);
                 }}>
                   <div style={{ fontWeight: 'bold', color: '#333' }}>
                     {user.nickname || user.displayName || '닉네임 없음'}
                   </div>
                   <div style={{ color: '#666', fontSize: 11 }}>
                     이메일: {user.email || '없음'}<br/>
                     UID: {user.uid}
                   </div>
                 </div>
               ))}
             </div>
             <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
               💡 클릭하면 해당 유저로 검색됩니다
             </div>
           </div>
         )}

         {/* 유저 정보 표시 */}
         {foundUser && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #ddd' }}>
            <h3 style={{ margin: 0, marginBottom: 8, color: '#333' }}>👤 검색된 유저:</h3>
            <p style={{ margin: 0, color: '#666' }}>
              <strong>닉네임:</strong> {foundUser.nickname || '없음'}<br />
              <strong>이메일:</strong> {foundUser.email}<br />
              <strong>UID:</strong> {foundUser.uid}
            </p>
          </div>
        )}

        {/* 영상 목록 및 인증 상태 */}
        {userVideos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12, color: '#333' }}>📹 영상 인증 현황:</h3>
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
                총 <strong>{userVideos.length}개</strong> 영상 중 <strong style={{ color: '#28a745' }}>{userVideos.filter(v => v.isCertified).length}개 인증됨</strong>, 
                <strong style={{ color: '#dc3545' }}> {userVideos.filter(v => !v.isCertified).length}개 미인증</strong>
              </p>
            </div>
            
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 6 }}>
              {userVideos.map((video) => (
                <div key={video.id} style={{ 
                  padding: 8, 
                  borderBottom: '1px solid #eee', 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: video.isCertified ? '#f0fff0' : '#fff5f5'
                }}>
                  <img src={video.thumbnail} alt="썸네일" style={{ width: 40, height: 24, objectFit: 'cover', borderRadius: 4, marginRight: 8 }} />
                  <div style={{ flex: 1, fontSize: 12 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{video.title}</div>
                  </div>
                  <span style={{ 
                    fontSize: 12, 
                    padding: '2px 6px', 
                    borderRadius: 10, 
                    backgroundColor: video.isCertified ? '#28a745' : '#dc3545',
                    color: 'white'
                  }}>
                    {video.isCertified ? '✅ 인증' : '❌ 미인증'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인증 관리 버튼들 */}
        {foundUser && userVideos.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={addAllCertifications}
              disabled={isProcessing || userVideos.filter(v => !v.isCertified).length === 0}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: isProcessing ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? '⏳ 처리 중...' : '✅ 전체 인증 추가'}
            </button>
            
            <button
              onClick={removeAllCertifications}
              disabled={isProcessing || userVideos.filter(v => v.isCertified).length === 0}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: isProcessing ? '#6c757d' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? '⏳ 처리 중...' : '❌ 전체 인증 제거'}
            </button>
          </div>
        )}
      </div>

      {/* 더미 게시물 생성 섹션 */}
      <div style={{ marginBottom: 40, padding: 20, backgroundColor: '#f8f9fa', borderRadius: 12, border: '2px solid #e9ecef' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#495057' }}>📝 더미 게시물 생성</h2>
        <p style={{ marginBottom: 16, color: '#6c757d', lineHeight: 1.5 }}>
          게시판에 다음과 같은 더미 게시물 6개를 생성합니다:<br />
          • 협업모집: 공동채널 운영, 컨텐츠 협업<br />
          • 홍보게시판: 채널 홍보, 채팅방 홍보<br />
          • 건의사항: 기능 추가 요청, 버그 신고
        </p>
        <button
          onClick={createDummyPosts}
          disabled={isCreatingPosts}
          style={{
            padding: '12px 24px',
            backgroundColor: isCreatingPosts ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            cursor: isCreatingPosts ? 'not-allowed' : 'pointer',
            fontSize: 16
          }}
        >
          {isCreatingPosts ? '⏳ 생성 중...' : '📝 더미 게시물 생성'}
        </button>
      </div>

      {/* 기존 채팅방 삭제 섹션 */}
      <div style={{ padding: 20, backgroundColor: '#fff5f5', borderRadius: 12, border: '2px solid #fed7d7' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#d00' }}>🗑️ 채팅방 전체 삭제</h2>
        <p style={{ marginBottom: 16, color: '#555', lineHeight: 1.5 }}>
          이 페이지는 관리자만 접근할 수 있습니다.<br />
          아래 버튼을 누르면 <b>모든 채팅방 및 하위 데이터가 완전히 삭제</b>됩니다.<br />
          <span style={{ color: '#d00', fontWeight: 'bold' }}>되돌릴 수 없으니 신중히 사용하세요!</span>
        </p>
        <AdminDeleteAllChatRooms />
      </div>
    </div>
  );
} 
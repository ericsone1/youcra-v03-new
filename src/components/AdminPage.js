import React, { useState } from 'react';
import AdminDeleteAllChatRooms from './AdminDeleteAllChatRooms';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminPage() {
  const [isCreatingPosts, setIsCreatingPosts] = useState(false);

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

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001' }}>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#d00' }}>관리자 페이지</h1>
      
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
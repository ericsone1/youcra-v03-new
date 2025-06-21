import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, doc, getDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function getInitial(name) {
  if (!name) return '방';
  return name.length > 2 ? name.slice(0,2) : name;
}

function ChatRoomMenu() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [videoCount, setVideoCount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { currentUser } = useAuth();

  // 방 정보 가져오기
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'chatRooms', roomId);
    const unsub = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setRoomData(data);
        setIsHost(data.createdBy === currentUser?.uid);
      }
    });
    return () => unsub();
  }, [roomId, currentUser]);

  useEffect(() => {
    if (!roomId) {
      console.log('🔍 [방메뉴] roomId 없음');
      return;
    }
    
    console.log('🔍 [방메뉴] 참여자 목록 로딩 시작:', roomId);
    
    const q = collection(db, 'chatRooms', roomId, 'participants');
    const unsub = onSnapshot(q, async (snap) => {
      console.log('🔍 [방메뉴] participants 컬렉션 문서 수:', snap.size);
      
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const uid = d.id;
          const participantData = d.data();
          console.log('🔍 [방메뉴] 참여자 ID:', uid);
          
          // 사용자 정보 시도적으로 가져오기
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const u = userDoc.data();
              console.log('🔍 [방메뉴] 사용자 정보:', u);
              return {
                id: uid,
                name: u.displayName || u.nick || u.email?.split('@')[0] || '익명',
                avatar: u.photoURL || null,
                isOwner: u.role === 'owner' || false,
                watchRate: participantData.watchRate || 0,
              };
            } else {
              console.log('🔍 [방메뉴] 사용자 문서 없음:', uid);
            }
          } catch (error) {
            console.log('🔍 [방메뉴] 사용자 정보 가져오기 실패:', error);
          }
          return { id: uid, name: uid.slice(0, 6), avatar: null, isOwner: false, watchRate: participantData.watchRate || 0 };
        })
      );
      
      console.log('🔍 [방메뉴] 최종 참여자 목록:', list);
      console.log('🔍 [방메뉴] 참여자 수:', list.length);
      
      // 실제 참여자만 설정
      setParticipants(list);
    });
    return () => unsub();
  }, [roomId]);

  // 비디오 목록 가져오기
  useEffect(() => {
    if (!roomId) return;
    const videosRef = collection(db, 'chatRooms', roomId, 'videos');
    const unsub = onSnapshot(videosRef, (snapshot) => {
      setVideoCount(snapshot.size);
    });
    return () => unsub();
  }, [roomId]);

  const menuList = [
    { icon: '📢', label: '공지', to: `/chat/${roomId}/notice` },
    { icon: '🗳️', label: '투표', to: `/chat/${roomId}/vote` },
    { icon: '🤖', label: '챗봇', to: `/chat/${roomId}/bot` },
    { icon: '🖼️', label: '사진/동영상', to: `/chat/${roomId}/media` },
    { icon: '📁', label: '파일', to: `/chat/${roomId}/files` },
    { icon: '🔗', label: '링크', to: `/chat/${roomId}/links` },
    { icon: '📅', label: '일정', to: `/chat/${roomId}/schedule` },
  ];

  // MenuItem 컴포넌트 추가
  const MenuItem = ({ icon, title, subtitle, className = "", onClick }) => (
    <button
      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-blue-100 last:border-b-0 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div>
          <div className="font-medium text-blue-800">{title}</div>
          {subtitle && <div className="text-sm text-blue-600">{subtitle}</div>}
        </div>
      </div>
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );

  // 채팅방 나가기 함수
  const handleLeaveRoom = async () => {
    if (!currentUser) return;
    
    try {
      setLeaving(true);
      
      // 참여자 목록에서 제거
      await deleteDoc(doc(db, 'chatRooms', roomId, 'participants', currentUser.uid));
      
      // 시스템 메시지 추가
      let nickname = currentUser.displayName;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          nickname = userDoc.data().nickname || userDoc.data().displayName;
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
      }
      
      const finalNickname = nickname || currentUser.email?.split('@')[0] || '익명';
      await addDoc(collection(db, 'chatRooms', roomId, 'messages'), {
        text: `${finalNickname}님이 퇴장했습니다.`,
        type: 'system',
        isSystemMessage: true,
        system: true,
        action: 'exit',
        uid: 'system',
        createdAt: serverTimestamp()
      });
      
      // 세션 스토리지 정리
      sessionStorage.removeItem(`room_${roomId}_entered`);
      
      // 채팅방 목록으로 이동
      navigate('/chat');
    } catch (error) {
      console.error('채팅방 나가기 실패:', error);
      alert('채팅방 나가기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-gradient-to-r from-blue-100 to-indigo-100 sticky top-0 z-30">
        <button onClick={() => navigate(`/chat/${roomId}`)} className="text-2xl text-blue-600 hover:text-blue-800">
          ←
        </button>
        <h1 className="font-bold text-lg text-blue-800">메뉴</h1>
        <div className="w-8"></div>
      </header>

      {/* 채팅방 정보 */}
      <div className="px-4 py-4 flex flex-col items-center bg-white/80 backdrop-blur-sm border-b border-blue-100">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg">
          {roomData?.name?.slice(0, 2).toUpperCase() || '💬'}
        </div>
        <h2 className="font-bold text-lg text-blue-800">{roomData?.name || '채팅방'}</h2>
        <p className="text-blue-600 text-sm">참여자 {participants.length}명</p>
      </div>

      {/* 메뉴 아이템들 */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* 기본 메뉴 */}
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg">
          <MenuItem
            icon="ℹ️"
            title="채팅방 정보"
            onClick={() => navigate(`/chat/${roomId}/info`)}
          />
          <MenuItem
            icon="🎬"
            title="시청 목록"
            subtitle={`${videoCount}개 영상`}
            onClick={() => navigate(`/chat/${roomId}/videos`)}
          />
          <MenuItem
            icon="👥"
            title="참여자 목록"
            subtitle={`${participants.length}명`}
            onClick={() => navigate(`/chat/${roomId}/participants`)}
          />
        </div>

        {/* 방장 전용 메뉴 */}
        {isHost && (
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg">
            <div className="px-4 py-3 font-bold text-blue-800 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <span className="text-xl">👑</span>
              방장 메뉴
            </div>
            <MenuItem
              icon="⚙️"
              title="채팅방 관리"
              onClick={() => navigate(`/chat/${roomId}/manage`)}
            />
            <MenuItem
              icon="📢"
              title="공지사항 관리"
              onClick={() => navigate(`/chat/${roomId}/announcements`)}
            />
            <MenuItem
              icon="🚫"
              title="차단된 사용자"
              onClick={() => navigate(`/chat/${roomId}/banned`)}
            />
          </div>
        )}

        {/* 나가기 */}
        <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-xl shadow-lg">
          <MenuItem
            icon="🚪"
            title="채팅방 나가기"
            className="text-red-600 hover:bg-red-50"
            onClick={() => setShowLeaveModal(true)}
          />
        </div>
      </div>

      {/* 나가기 확인 모달 */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 text-center">채팅방 나가기</h3>
            <p className="text-blue-600 text-center mb-6">
              정말로 이 채팅방을 나가시겠습니까?<br/>
              나간 후에는 다시 초대받아야 합니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-3 px-4 border border-blue-300 rounded-xl text-blue-700 font-medium hover:bg-blue-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLeaveRoom}
                disabled={leaving}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-colors"
              >
                {leaving ? '나가는 중...' : '나가기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRoomMenu;
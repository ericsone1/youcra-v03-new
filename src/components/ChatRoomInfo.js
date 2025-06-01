import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function ChatRoomInfo() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  // 방장 확인 로직 - UID 기반으로 올바르게 비교
  const myEmail = auth.currentUser?.email;
  const myUid = auth.currentUser?.uid;  // UID 추가
  const isOwner = !loading && roomData && myUid && (
    roomData.createdBy === myUid ||      // UID와 createdBy 비교 (핵심)
    roomData.ownerEmail === myEmail ||   // 이메일 기반 백업
    roomData.creatorEmail === myEmail || // 이메일 기반 백업
    (participants.length > 0 && participants[0] === myEmail)
  );
  
  // 핵심 디버깅 정보 - roomData가 있을 때만 출력
  if (roomData) {
    console.log('🔍 방장 확인 (UID 기반):', {
      myEmail,
      myUid,               // UID 로그 추가
      loading,
      roomDataKeys: Object.keys(roomData),
      createdBy: roomData?.createdBy,
      ownerEmail: roomData?.ownerEmail,
      firstParticipant: participants[0],
      uidMatches: roomData?.createdBy === myUid,  // UID 일치 여부
      isOwner
    });
  }

  // 채팅방 정보 불러오기
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        
        // 채팅방 정보 가져오기
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        
        if (roomDoc.exists()) {
          const data = roomDoc.data();
          setRoomData(data);
          console.log('✅ 채팅방 데이터 로드됨:', Object.keys(data));
        } else {
          console.error('❌ 채팅방이 존재하지 않음:', roomId);
        }

        // 참여자 정보 가져오기 (messages에서 유니크한 이메일들)
        const messagesQuery = query(collection(db, "chatRooms", roomId, "messages"));
        const messagesSnapshot = await getDocs(messagesQuery);
        const uniqueEmails = new Set();
        
        messagesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email) {
            uniqueEmails.add(data.email);
          }
        });
        
        const participantsList = Array.from(uniqueEmails);
        setParticipants(participantsList);
        
      } catch (error) {
        console.error("❌ 채팅방 정보 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-60 flex justify-center items-center bg-blue-100 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-60 flex justify-center items-center bg-blue-100 min-h-screen">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden animate-slideInUp h-screen overflow-y-auto">
        {/* 상단 */}
        <div className="flex items-center justify-between px-4 py-4 border-b sticky top-0 bg-white z-10">
          <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">←</button>
          <div className="flex-1 text-center font-bold text-lg">채팅방 정보</div>
          <div style={{ width: 32 }} />
        </div>
        
        {/* 프로필/방이름/참여자 */}
        <div className="flex flex-col items-center py-6">
          <button 
            onClick={() => navigate('/my')}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-lg border-4 border-white mb-2 hover:scale-105 transition-transform cursor-pointer"
            title="내 프로필 보기"
          >
            {auth.currentUser?.displayName?.slice(0, 2).toUpperCase() || 
             auth.currentUser?.email?.slice(0, 2).toUpperCase() || 
             'ME'}
          </button>
          <div className="font-bold text-lg mb-1 flex items-center gap-1">
            {roomData?.name || `채팅방 ${roomId.slice(0, 8)}`}
            {isOwner && <span title="방장" className="ml-1 text-yellow-500 text-xl">👑</span>}
          </div>
          <div className="text-gray-500 text-sm">참여자 {participants.length}명</div>
        </div>
        
        {/* 방장 전용 메뉴 */}
        {isOwner && (
          <div className="divide-y flex items-center justify-between px-6 py-4 bg-yellow-50 border-y border-yellow-200">
            <button 
              className="bg-blue-500 text-white font-bold py-2 px-3 rounded hover:bg-blue-600 text-sm" 
              onClick={() => navigate(`/chat/${roomId}/videos`)}
            >
              시청리스트
            </button>
            <button 
              className="bg-purple-500 text-white font-bold py-2 px-3 rounded hover:bg-purple-600 text-sm ml-auto" 
              style={{ minWidth: 0 }} 
              onClick={() => navigate(`/chat/${roomId}/manage`)}
            >
              👑 방 관리
            </button>
          </div>
        )}
        
        {/* 일반 메뉴 리스트 */}
        <div className="divide-y">
          <MenuItem icon="📢" label="공지" />
          <MenuItem icon="🗳️" label="투표" />
          <MenuItem icon="🤖" label="챗봇" />
          <MenuItem icon="🖼️" label="사진/동영상" />
          <MenuItem icon="🎬" label="시청하기" onClick={() => navigate(`/chat/${roomId}/videos`)} />
          <MenuItem icon="📁" label="파일" />
          <MenuItem icon="🔗" label="링크" />
          <MenuItem icon="📅" label="일정" />
          <MenuItem icon="👥" label="대화상대" />
        </div>
        
        <div className="p-4 flex flex-col gap-2">
          <button onClick={() => navigate(-1)} className="w-full text-blue-600 font-bold py-2 rounded hover:bg-blue-50">💬 채팅방으로 돌아가기</button>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 hover:bg-blue-50 cursor-pointer" onClick={onClick}>
      <span className="text-xl w-7 text-center">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </div>
  );
} 
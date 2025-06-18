import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import BottomTabBar from './MyChannel/BottomTabBar';

function MyFeedViewersPage() {
  const navigate = useNavigate();
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCertifications, setTotalCertifications] = useState(0);
  const [myRoomParticipants, setMyRoomParticipants] = useState(new Set());

  useEffect(() => {
    const fetchFeedViewers = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        // 1. 내가 참여 중인 채팅방들의 참여자 UID 수집 (제외할 목록)
        const myParticipantsSet = new Set();
        
        const chatRoomsSnap = await getDocs(collection(db, 'chatRooms'));
        for (const roomDoc of chatRoomsSnap.docs) {
          const roomData = roomDoc.data();
          if (roomData.participants && roomData.participants.includes(auth.currentUser.uid)) {
            // 이 방의 모든 참여자를 제외 목록에 추가
            const participantsSnap = await getDocs(collection(db, 'chatRooms', roomDoc.id, 'participants'));
            participantsSnap.docs.forEach(doc => {
              myParticipantsSet.add(doc.id);
            });
          }
        }
        
        setMyRoomParticipants(myParticipantsSet);

        // 2. 내가 업로드한 영상들의 인증 정보만 수집
        const viewersMap = new Map(); // uid -> { nickname, photoURL, certCount, latestCert }
        let totalCerts = 0;

        for (const roomDoc of chatRoomsSnap.docs) {
          const roomId = roomDoc.id;
          
          try {
            const videosSnap = await getDocs(collection(db, 'chatRooms', roomId, 'videos'));
            
            for (const videoDoc of videosSnap.docs) {
              const videoData = videoDoc.data();
              const videoId = videoDoc.id;
              
              // 내가 업로드한 영상만 필터링
              if (videoData.uploadedBy === auth.currentUser.uid) {
                try {
                  const certificationsSnap = await getDocs(collection(db, 'chatRooms', roomId, 'videos', videoId, 'certifications'));
                  
                  certificationsSnap.docs.forEach(certDoc => {
                    const certData = certDoc.data();
                    const uid = certData.uid;
                    
                    // 내가 참여 중인 방의 유저들은 제외하고, 나 자신도 제외
                    if (!myParticipantsSet.has(uid) && uid !== auth.currentUser.uid) {
                      totalCerts++;
                      
                      if (viewersMap.has(uid)) {
                        const existing = viewersMap.get(uid);
                        existing.certCount++;
                        // 최신 인증 시간 업데이트
                        if (certData.certifiedAt && certData.certifiedAt.seconds > existing.latestCert) {
                          existing.latestCert = certData.certifiedAt.seconds;
                        }
                      } else {
                        viewersMap.set(uid, {
                          uid,
                          nickname: '로딩 중...',
                          photoURL: null,
                          certCount: 1,
                          latestCert: certData.certifiedAt?.seconds || 0,
                          videoTitle: videoData.title || '제목 없음'
                        });
                      }
                    }
                  });
                } catch (e) {
                  console.error(`인증 정보 로드 오류 (room: ${roomId}, video: ${videoId}):`, e);
                }
              }
            }
          } catch (e) {
            console.error(`영상 목록 로드 오류 (room: ${roomId}):`, e);
          }
        }

        setTotalCertifications(totalCerts);

        // 3. 유저 정보 보완
        const viewersArray = Array.from(viewersMap.values());
        
        const enrichedViewers = await Promise.all(
          viewersArray.map(async (viewer) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', viewer.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...viewer,
                  nickname: userData.nickname || userData.email?.split('@')[0] || '익명',
                  photoURL: userData.photoURL || null
                };
              }
            } catch (e) {
              console.error('유저 정보 로드 오류:', e);
            }
            return {
              ...viewer,
              nickname: '익명'
            };
          })
        );

        // 인증 횟수 순으로 정렬
        enrichedViewers.sort((a, b) => b.certCount - a.certCount);
        
        setViewers(enrichedViewers);
      } catch (e) {
        console.error('피드 시청자 로드 오류:', e);
        setError('시청자 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedViewers();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-600">시청자 정보를 불러오는 중...</p>
        <BottomTabBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center pb-24 text-center px-4">
        <div className="text-red-500 text-4xl mb-4">😞</div>
        <p className="text-gray-700 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-purple-500 text-white rounded-lg"
        >
          다시 시도
        </button>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 flex flex-col pb-24">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate(-1)} 
            className="text-2xl text-gray-600 hover:text-purple-600" 
            aria-label="뒤로가기"
          >
            ←
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-gray-800">👥 내 시청자</h1>
            <p className="text-xs text-gray-500">내가 공유한 영상 인증자 목록</p>
          </div>
          <div className="w-8" />
        </div>
        
        {/* 통계 */}
        <div className="px-4 pb-4">
          <div className="bg-purple-100 rounded-xl p-3 flex justify-between items-center">
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-purple-700">{viewers.length}</div>
              <div className="text-xs text-purple-600">시청자 수</div>
            </div>
            <div className="w-px h-8 bg-purple-300"></div>
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-purple-700">{totalCertifications}</div>
              <div className="text-xs text-purple-600">총 인증 수</div>
            </div>
            <div className="w-px h-8 bg-purple-300"></div>
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-purple-700">{myRoomParticipants.size}</div>
              <div className="text-xs text-purple-600">제외된 유저</div>
            </div>
          </div>
        </div>
      </div>

      {/* 시청자 목록 */}
      <div className="flex-1 overflow-y-auto">
        {viewers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="text-4xl mb-4">🎭</div>
            <p className="text-gray-600 mb-2">아직 내 영상을 시청 인증한 외부 시청자가 없습니다</p>
            <p className="text-sm text-gray-500">채팅방에서 영상을 공유하고 시청자를 모아보세요!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {viewers.map((viewer, index) => (
              <div 
                key={viewer.uid} 
                className="bg-white hover:bg-purple-50 transition-colors cursor-pointer active:bg-purple-100" 
                onClick={() => navigate(`/profile/feed/${viewer.uid}`)}
              >
                <div className="flex items-center gap-3 p-4">
                  {/* 순위 */}
                  <div className="flex-shrink-0 w-8 text-center">
                    {index < 3 ? (
                      <span className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* 프로필 */}
                  {viewer.photoURL ? (
                    <img 
                      src={viewer.photoURL} 
                      alt="avatar" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-200" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold border-2 border-purple-200">
                      {viewer.nickname.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{viewer.nickname}</div>
                    <div className="text-sm text-gray-500">
                      인증 {viewer.certCount}회 • 최근 {formatDate(viewer.latestCert)}
                    </div>
                  </div>

                  {/* 인증 배지 */}
                  <div className="flex-shrink-0">
                    <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      {viewer.certCount}회
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
}

export default MyFeedViewersPage;
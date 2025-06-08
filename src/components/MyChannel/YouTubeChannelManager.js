import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { extractChannelId, fetchYouTubeChannelInfo, fetchMyVideoStatistics } from '../../services/videoService';
import { useAuth } from '../../contexts/AuthContext';

const YouTubeChannelManager = () => {
  const { currentUser } = useAuth();
  const [channelData, setChannelData] = useState(null);
  const [videoStats, setVideoStats] = useState(null);
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 기존 채널 정보 로드 및 자동 동기화
  useEffect(() => {
    loadChannelData();
  }, [currentUser]);

  const loadChannelData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().youtubeChannel) {
        const channelData = userDoc.data().youtubeChannel;
        setChannelData(channelData);
        
        // 24시간 이상 지났으면 자동 동기화
        const lastSync = channelData.lastSyncAt;
        const now = new Date();
        const hoursSinceLastSync = lastSync ? 
          (now - new Date(lastSync.seconds ? lastSync.seconds * 1000 : lastSync)) / (1000 * 60 * 60) : 
          999; // 처음이면 큰 값
        
        if (hoursSinceLastSync >= 24) {
          console.log('24시간 경과로 자동 동기화 시작');
          autoSyncChannel(channelData);
        }
        
        loadVideoStats();
      }
    } catch (error) {
      console.error('채널 데이터 로드 오류:', error);
    }
  };

  // 자동 동기화 (백그라운드에서 조용히 실행)
  const autoSyncChannel = async (oldChannelData) => {
    try {
      const channelInfo = { type: 'channel', value: oldChannelData.channelId };
      const updatedDetails = await fetchYouTubeChannelInfo(channelInfo);
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        youtubeChannel: updatedDetails
      }, { merge: true });

      setChannelData(updatedDetails);
      console.log('채널 정보 자동 동기화 완료');
      
      // 영상 통계도 새로고침
      loadVideoStats();
      
    } catch (error) {
      console.error('자동 동기화 오류:', error);
      // 자동 동기화 실패해도 에러 메시지는 표시하지 않음
    }
  };

  const loadVideoStats = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const stats = await fetchMyVideoStatistics(currentUser.uid);
      setVideoStats(stats);
    } catch (error) {
      console.error('영상 통계 로드 오류:', error);
    }
  };

  // 채널 등록/업데이트
  const handleRegisterChannel = async () => {
    if (!newChannelUrl.trim() || !currentUser?.uid) {
      setMessage('채널 URL을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // URL에서 채널 정보 추출
      const channelInfo = extractChannelId(newChannelUrl);
      if (!channelInfo) {
        setMessage('유효한 YouTube 채널 URL을 입력해주세요.');
        setIsLoading(false);
        return;
      }

      // YouTube API에서 채널 정보 가져오기
      const channelDetails = await fetchYouTubeChannelInfo(channelInfo);
      
      // Firebase에 저장
      await setDoc(doc(db, 'users', currentUser.uid), {
        youtubeChannel: channelDetails
      }, { merge: true });

      setChannelData(channelDetails);
      setIsEditing(false);
      setNewChannelUrl('');
      
      if (channelDetails.isMockData) {
        setMessage('채널이 등록되었습니다. (YouTube API 키가 없어 기본 정보만 표시됩니다)');
      } else {
        setMessage('채널이 성공적으로 등록되었습니다!');
      }
      
      // 영상 통계도 새로고침
      loadVideoStats();
      
    } catch (error) {
      console.error('채널 등록 오류:', error);
      setMessage(`채널 등록 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 채널 정보 동기화
  const handleSyncChannel = async () => {
    if (!channelData || !currentUser?.uid) return;

    setIsLoading(true);
    setMessage('');

    try {
      const channelInfo = { type: 'channel', value: channelData.channelId };
      const updatedDetails = await fetchYouTubeChannelInfo(channelInfo);
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        youtubeChannel: updatedDetails
      }, { merge: true });

      setChannelData(updatedDetails);
      setMessage('✅ 최신 정보로 업데이트되었습니다!');
      
      // 영상 통계도 새로고침
      loadVideoStats();
      
    } catch (error) {
      console.error('채널 동기화 오류:', error);
      setMessage(`동기화 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 숫자 포맷 함수
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // 마지막 동기화 시간 포맷
  const formatLastSync = (lastSync) => {
    if (!lastSync) return '처음 등록';
    
    const syncDate = new Date(lastSync.seconds ? lastSync.seconds * 1000 : lastSync);
    const now = new Date();
    const diffInHours = (now - syncDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1일 전';
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    // 7일 이상이면 날짜 표시
    return syncDate.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        🎬 YouTube 채널 관리
      </h3>

      {/* 채널 등록/편집 폼 */}
      {(!channelData || isEditing) && (
        <div className="mb-6">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newChannelUrl}
              onChange={(e) => setNewChannelUrl(e.target.value)}
              placeholder="YouTube 채널 URL"
              className="flex-1 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleRegisterChannel}
              disabled={isLoading}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              {isLoading ? '처리중...' : channelData ? '업데이트' : '등록'}
            </button>
          </div>
          
          {isEditing && (
            <button
              onClick={() => {
                setIsEditing(false);
                setNewChannelUrl('');
              }}
              className="text-gray-500 text-sm hover:text-gray-700"
            >
              취소
            </button>
          )}
        </div>
      )}

      {/* 메시지 표시 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('오류') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* 등록된 채널 정보 */}
      {channelData && !isEditing && (
        <div className="space-y-4">
          {/* 채널 기본 정보 */}
          <div className="relative p-3 bg-gray-50 rounded-lg">
            {/* 우측 상단 업데이트 정보 */}
            <div className="absolute top-2 right-2 text-xs text-gray-500">
              업데이트: {formatLastSync(channelData.lastSyncAt)}
            </div>
            
            {/* 채널 정보 */}
            <div className="flex items-center gap-3 pr-20">
              <img
                src={channelData.channelThumbnail}
                alt="채널 썸네일"
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOWNhM2FmIj4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlV2lkdGg9IjEuNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiPgogIDxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0ibTYuNzUgNy43NSAzIDIuMjVhLjc1Ljc1IDAgMDEwIDEuMmwtMyAyLjI1di0xLjhoLTMuNzVhLjc1Ljc1IDAgMDEtLjc1LS43NXYtLjc1YzAtLjQxNC4zMzYtLjc1Ljc1LS43NUg2Ljc1VjcuNzVaIi8+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJtMTcuMjUgMTYuMjUtMyAyLjI1YS43NS43NSAwIDAxMCAxLjJsMyAyLjI1di0xLjhoMy43NWEuNzUuNzUgMCAwMS43NS0uNzV2LS43NWEuNzUuNzUgMCAwMC0uNzUtLjc1aC0zLjc1VjE2LjI1WiIvPgo8L3N2Zz4KPC9zdmc+';
                }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{channelData.channelTitle}</h4>
                <p className="text-xs text-gray-600 line-clamp-1">
                  {channelData.channelDescription || '설명이 없습니다.'}
                </p>
                {channelData.isMockData && (
                  <p className="text-xs text-orange-600">
                    ⚠️ YouTube API 키가 없어 기본 정보만 표시됩니다.
                  </p>
                )}
              </div>
            </div>
            
            {/* 버튼들 */}
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={handleSyncChannel}
                disabled={isLoading}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                title="즉시 동기화"
              >
                🔄 동기화
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-1"
              >
                ✏️ 편집
              </button>
            </div>
          </div>

          {/* 채널 통계 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="text-sm font-bold text-red-600">
                {formatNumber(channelData.subscriberCount)}
              </div>
              <div className="text-xs text-gray-600">구독자</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-sm font-bold text-blue-600">
                {formatNumber(channelData.videoCount)}
              </div>
              <div className="text-xs text-gray-600">영상 수</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-sm font-bold text-green-600">
                {formatNumber(channelData.viewCount)}
              </div>
              <div className="text-xs text-gray-600">총 조회수</div>
            </div>
          </div>

          {/* 내 영상 통계 */}
          {videoStats && (
            <div className="mt-4">
              <h5 className="font-bold text-gray-800 mb-2 text-sm">📊 내가 등록한 영상 통계</h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-purple-50 rounded-lg text-center">
                  <div className="text-sm font-bold text-purple-600">
                    {videoStats.totalVideos}
                  </div>
                  <div className="text-xs text-gray-600">등록한 영상 수</div>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-center">
                  <div className="text-sm font-bold text-indigo-600">
                    {formatNumber(videoStats.averageViews)}
                  </div>
                  <div className="text-xs text-gray-600">평균 조회수</div>
                </div>
              </div>
            </div>
          )}

          {/* 채널 바로가기 */}
          <div className="mt-3">
            <a
              href={`https://www.youtube.com/channel/${channelData.channelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs"
            >
              🔗 채널 바로가기
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeChannelManager; 
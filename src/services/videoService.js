import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getYoutubeId, fetchYoutubeMeta } from '../utils/youtube';

export async function checkVideoDuplicate(roomId, videoId) {
  const videosRef = collection(db, "chatRooms", roomId, "videos");
  const duplicateQuery = query(videosRef, where("videoId", "==", videoId));
  const duplicateSnapshot = await getDocs(duplicateQuery);
  return !duplicateSnapshot.empty;
}

export async function registerVideo(roomId, videoMeta, userId) {
  const videosRef = collection(db, "chatRooms", roomId, "videos");
  return await addDoc(videosRef, {
    ...videoMeta,
    registeredBy: userId || "anonymous",
    registeredAt: serverTimestamp(),
  });
}

export async function validateAndFetchVideoInfo(url) {
  const videoId = getYoutubeId(url);
  if (!videoId) {
    throw new Error("유효한 유튜브 링크가 아닙니다.");
  }
  
  const meta = await fetchYoutubeMeta(videoId);
  if (!meta) {
    throw new Error("영상 정보를 불러올 수 없습니다.");
  }
  
  return meta;
}

export function extractChannelId(url) {
  try {
    if (!url) return null;
    
    // URL 정규화 (공백 제거, 프로토콜 추가)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//)) {
      normalizedUrl = 'https://' + normalizedUrl.replace(/^\/+/, '');
    }
    
    // URL 디코딩 먼저 수행 (한글 등 인코딩된 문자 처리)
    let decodedUrl = normalizedUrl;
    try {
      decodedUrl = decodeURIComponent(normalizedUrl);
    } catch (e) {
      console.warn('URL 디코딩 실패, 원본 URL 사용:', e);
    }
    
    console.log('원본 URL:', url);
    console.log('정규화된 URL:', normalizedUrl);
    console.log('디코딩된 URL:', decodedUrl);
    
    // @username 형태 (특수문자 포함 - 한글, 영문, 숫자, 언더스코어, 하이픈, 점 허용)
    const usernameMatch = decodedUrl.match(/@([a-zA-Z0-9가-힣._-]+)/);
    if (usernameMatch) {
      const username = usernameMatch[1];
      console.log('추출된 사용자명:', username);
      return { type: 'username', value: username };
    }
    
    // channel ID 형태 (YouTube 채널 ID는 24자리 영문+숫자+_- 조합)
    const channelMatch = decodedUrl.match(/channel\/([a-zA-Z0-9_-]{24})/);
    if (channelMatch) {
      return { type: 'channel', value: channelMatch[1] };
    }
    
    // user 형태 (특수문자 포함)
    const userMatch = decodedUrl.match(/user\/([a-zA-Z0-9가-힣._-]+)/);
    if (userMatch) {
      return { type: 'user', value: userMatch[1] };
    }
    
    // c/ 형태 (커스텀 URL - 특수문자 포함)
    const cMatch = decodedUrl.match(/\/c\/([a-zA-Z0-9가-힣._-]+)/);
    if (cMatch) {
      return { type: 'c', value: cMatch[1] };
    }
    
    // 핸들 형태 (새로운 @handle 시스템)
    const handleMatch = decodedUrl.match(/\/@([a-zA-Z0-9가-힣._-]+)/);
    if (handleMatch) {
      return { type: 'handle', value: handleMatch[1] };
    }
    
    // 짧은 URL 형태 (youtu.be 등)
    const shortMatch = decodedUrl.match(/youtu\.be\/([a-zA-Z0-9가-힣._-]+)/);
    if (shortMatch) {
      return { type: 'short', value: shortMatch[1] };
    }
    
    // 단순 채널명만 입력된 경우 (youtube.com 없이)
    if (!decodedUrl.includes('youtube.com') && !decodedUrl.includes('youtu.be')) {
      // 특수문자가 포함된 채널명으로 간주
      const simpleChannelMatch = url.trim().match(/^([a-zA-Z0-9가-힣._-]+)$/);
      if (simpleChannelMatch) {
        console.log('단순 채널명으로 인식:', simpleChannelMatch[1]);
        return { type: 'username', value: simpleChannelMatch[1] };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Channel ID 추출 오류:', error);
    return null;
  }
}

export async function fetchYouTubeChannelInfo(channelData) {
  try {
    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    
    // 🔍 디버깅 로그 추가
    console.log('🔍 YouTube API 키 디버깅:');
    console.log('- API 키 존재 여부:', !!apiKey);
    console.log('- API 키 타입:', typeof apiKey);
    console.log('- API 키 길이:', apiKey?.length || 0);
    console.log('- API 키 시작 10자:', apiKey?.substring(0, 10) || 'undefined');
    console.log('- 모든 환경변수:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));
    
    if (!apiKey) {
      console.warn('❌ YouTube API 키가 설정되지 않음 - Mock 데이터 반환');
      return createMockChannelData(channelData);
    }
    
    console.log('✅ API 키 존재 - YouTube API 호출 시작');
    console.log('채널 데이터:', channelData);
    
    let apiUrl = '';
    if (channelData.type === 'channel') {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelData.value)}&key=${apiKey}`;
    } else if (['username', 'user', 'c', 'handle', 'short'].includes(channelData.type)) {
      // 사용자명, 핸들, 커스텀 URL 등은 Search API로 먼저 채널 ID 찾기
      let searchQuery = channelData.value;
      
      // 특수문자가 포함된 경우 따옴표로 감싸서 정확한 검색
      if (searchQuery.includes('-') || searchQuery.includes('_') || searchQuery.includes('.')) {
        searchQuery = `"${searchQuery}"`;
      }
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&key=${apiKey}&maxResults=10`;
      console.log('Search URL:', searchUrl);
      console.log('Search Query:', searchQuery);
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.items && searchData.items.length > 0) {
        // 가장 정확한 매치 찾기
        let bestMatch = searchData.items[0];
        
        // 정확한 이름 매치가 있는지 확인
        for (const item of searchData.items) {
          const channelTitle = item.snippet.title.toLowerCase();
          const originalValue = channelData.value.toLowerCase();
          
          // 채널명이 정확히 일치하거나 포함되는 경우
          if (channelTitle === originalValue || 
              channelTitle.includes(originalValue) ||
              originalValue.includes(channelTitle.replace(/[^a-z0-9가-힣]/g, ''))) {
            bestMatch = item;
            break;
          }
        }
        
        const channelId = bestMatch.snippet.channelId;
        console.log('검색으로 찾은 채널 ID:', channelId);
        console.log('매치된 채널명:', bestMatch.snippet.title);
        
        // 찾은 채널 ID로 상세 정보 조회
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
      } else {
        console.log('채널 검색 결과 없음');
        return createMockChannelData(channelData);
      }
    } else {
      return createMockChannelData(channelData);
    }
    
    console.log('Final API URL:', apiUrl);
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('YouTube API 응답:', data);
    
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        channelId: channel.id,
        channelTitle: channel.snippet.title,
        channelDescription: channel.snippet.description,
        channelThumbnail: channel.snippet.thumbnails.default?.url || channel.snippet.thumbnails.medium?.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount || 0),
        videoCount: parseInt(channel.statistics.videoCount || 0),
        viewCount: parseInt(channel.statistics.viewCount || 0),
        lastSyncAt: new Date()
      };
    } else {
      console.log('채널 정보 없음');
      return createMockChannelData(channelData);
    }
  } catch (error) {
    console.error('YouTube API 오류:', error);
    return createMockChannelData(channelData);
  }
}

function createMockChannelData(channelData) {
  return {
    channelId: channelData.value,
    channelTitle: `채널 (${channelData.value})`,
    channelDescription: '채널 설명을 가져올 수 없습니다.',
    channelThumbnail: '/default-channel.png',
    subscriberCount: 0,
    videoCount: 0,
    viewCount: 0,
    lastSyncAt: new Date(),
    isMockData: true
  };
}

export async function fetchMyVideoStatistics(userId) {
  try {
    const q = query(collection(db, "chatRooms"));
    const roomSnap = await getDocs(q);
    
    let myVideos = [];
    let totalViews = 0;
    let totalLikes = 0;
    
    for (const roomDoc of roomSnap.docs) {
      const roomId = roomDoc.id;
      const roomData = roomDoc.data();
      
      const videoQ = query(
        collection(db, "chatRooms", roomId, "videos"),
        where("registeredBy", "==", userId)
      );
      const videoSnap = await getDocs(videoQ);
      
      videoSnap.forEach(videoDoc => {
        const video = videoDoc.data();
        myVideos.push({
          ...video,
          roomId,
          roomName: roomData.name || '제목 없음',
          id: videoDoc.id
        });
        
        totalViews += parseInt(video.viewCount || 0);
        totalLikes += parseInt(video.likeCount || 0);
      });
    }
    
    return {
      videos: myVideos,
      totalVideos: myVideos.length,
      totalViews,
      totalLikes,
      averageViews: myVideos.length > 0 ? Math.round(totalViews / myVideos.length) : 0
    };
  } catch (error) {
    console.error('영상 통계 조회 오류:', error);
    return {
      videos: [],
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      averageViews: 0
    };
  }
} 
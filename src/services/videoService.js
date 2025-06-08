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
    
    // URL 디코딩 먼저 수행 (한글 등 인코딩된 문자 처리)
    let decodedUrl = url;
    try {
      decodedUrl = decodeURIComponent(url);
    } catch (e) {
      console.warn('URL 디코딩 실패, 원본 URL 사용:', e);
    }
    
    console.log('원본 URL:', url);
    console.log('디코딩된 URL:', decodedUrl);
    
    // @username 형태 (한글 포함 가능)
    const usernameMatch = decodedUrl.match(/@([^?&#/]+)/);
    if (usernameMatch) {
      const username = usernameMatch[1];
      console.log('추출된 사용자명:', username);
      return { type: 'username', value: username };
    }
    
    // channel ID 형태
    const channelMatch = decodedUrl.match(/channel\/([a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return { type: 'channel', value: channelMatch[1] };
    }
    
    // user 형태
    const userMatch = decodedUrl.match(/user\/([^?&#/]+)/);
    if (userMatch) {
      return { type: 'user', value: userMatch[1] };
    }
    
    // c/ 형태
    const cMatch = decodedUrl.match(/\/c\/([^?&#/]+)/);
    if (cMatch) {
      return { type: 'c', value: cMatch[1] };
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
    if (!apiKey) {
      console.warn('YouTube API 키가 설정되지 않음');
      return createMockChannelData(channelData);
    }
    
    console.log('채널 데이터:', channelData);
    
    let apiUrl = '';
    if (channelData.type === 'channel') {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelData.value)}&key=${apiKey}`;
    } else if (channelData.type === 'username') {
      // @username 형태는 Search API로 먼저 채널 ID 찾기
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelData.value)}&key=${apiKey}`;
      console.log('Search URL:', searchUrl);
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.items && searchData.items.length > 0) {
        const foundChannel = searchData.items[0];
        const channelId = foundChannel.snippet.channelId;
        console.log('검색으로 찾은 채널 ID:', channelId);
        
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
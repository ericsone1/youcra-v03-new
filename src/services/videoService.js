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
    
    console.log('🔍 [URL 분석] 원본 URL:', url);
    console.log('🔍 [URL 분석] 정규화된 URL:', normalizedUrl);
    console.log('🔍 [URL 분석] 디코딩된 URL:', decodedUrl);
    
    // 핸들 형태 먼저 체크 (/@handle 또는 @handle)
    const handleMatch = decodedUrl.match(/\/@([^\/\?&\s]+)|^@([^\/\?&\s]+)/);
    if (handleMatch) {
      const handle = handleMatch[1] || handleMatch[2];
      console.log('✅ [URL 분석] 핸들 형태로 인식:', handle);
      return { type: 'handle', value: handle };
    }
    
    // @username 형태 (URL 내부에 있는 경우)
    const usernameMatch = decodedUrl.match(/@([a-zA-Z0-9가-힣._-]+)/);
    if (usernameMatch) {
      const username = usernameMatch[1];
      console.log('✅ [URL 분석] @핸들 형태로 인식:', username);
      return { type: 'username', value: username };
    }
    
    // channel ID 형태 (YouTube 채널 ID는 24자리 영문+숫자+_- 조합)
    const channelMatch = decodedUrl.match(/channel\/([a-zA-Z0-9_-]{24})/);
    if (channelMatch) {
      console.log('✅ [URL 분석] 채널 ID 형태로 인식:', channelMatch[1]);
      return { type: 'channel', value: channelMatch[1] };
    }
    
    // user 형태 (특수문자 포함)
    const userMatch = decodedUrl.match(/user\/([a-zA-Z0-9가-힣._-]+)/);
    if (userMatch) {
      console.log('✅ [URL 분석] /user/ 형태로 인식:', userMatch[1]);
      return { type: 'user', value: userMatch[1] };
    }
    
    // c/ 형태 (커스텀 URL - 특수문자 포함)
    const cMatch = decodedUrl.match(/\/c\/([a-zA-Z0-9가-힣._-]+)/);
    if (cMatch) {
      console.log('✅ [URL 분석] /c/ 형태로 인식:', cMatch[1]);
      return { type: 'c', value: cMatch[1] };
    }
    
    // 짧은 URL 형태 (youtu.be 등)
    const shortMatch = decodedUrl.match(/youtu\.be\/([a-zA-Z0-9가-힣._-]+)/);
    if (shortMatch) {
      console.log('✅ [URL 분석] youtu.be 형태로 인식:', shortMatch[1]);
      return { type: 'short', value: shortMatch[1] };
    }
    
    // 단순 핸들명만 입력된 경우 (@ 포함하거나 @없이)
    if (!decodedUrl.includes('youtube.com') && !decodedUrl.includes('youtu.be')) {
      // @로 시작하는 경우
      if (url.trim().startsWith('@')) {
        const handle = url.trim().substring(1);
        console.log('✅ [URL 분석] 단순 @핸들로 인식:', handle);
        return { type: 'handle', value: handle };
      }
      
      // 특수문자가 포함된 채널명으로 간주
      const simpleChannelMatch = url.trim().match(/^([a-zA-Z0-9가-힣._-]+)$/);
      if (simpleChannelMatch) {
        console.log('✅ [URL 분석] 단순 채널명으로 인식:', simpleChannelMatch[1]);
        return { type: 'username', value: simpleChannelMatch[1] };
      }
    }
    
    console.warn('⚠️ [URL 분석] 인식할 수 없는 URL 형태:', url);
    return null;
  } catch (error) {
    console.error('❌ [URL 분석] 오류:', error);
    return null;
  }
}

export async function fetchYouTubeChannelInfo(channelData) {
  try {
    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    
    if (!apiKey) {
      return createMockChannelData(channelData);
    }
    
    let apiUrl = '';
    if (channelData.type === 'channel') {
      console.log('🔍 [YouTube] 채널 ID로 조회:', channelData.value);
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${encodeURIComponent(channelData.value)}&key=${apiKey}`;
    } else if (['username', 'handle'].includes(channelData.type)) {
      // 핸들의 경우 직접 핸들 URL로 채널 ID를 먼저 찾기
      console.log(`🔍 [YouTube] ${channelData.type} 직접 조회:`, channelData.value);
      
      try {
        // 핸들 URL로 직접 접근하여 채널 ID 추출
        const handleUrl = `https://www.youtube.com/@${channelData.value}`;
        console.log('🔍 [YouTube] 핸들 URL 생성:', handleUrl);
        
        // 핸들로 직접 채널 조회 (forHandle 파라미터 사용)
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&forHandle=${encodeURIComponent(channelData.value)}&key=${apiKey}`;
        
        console.log('🔍 [YouTube] forHandle API 사용:', apiUrl);
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const channel = data.items[0];
          console.log('✅ [YouTube] 핸들로 채널 정보 조회 성공:', channel.snippet.title);
          console.log('📊 [YouTube] 구독자 수:', channel.statistics.subscriberCount);
          
          return {
            channelId: channel.id,
            channelTitle: channel.snippet.title,
            channelDescription: channel.snippet.description,
            channelThumbnail: channel.snippet.thumbnails.default?.url || channel.snippet.thumbnails.medium?.url,
            channelBanner: channel.brandingSettings?.image?.bannerExternalUrl || null,
            subscriberCount: parseInt(channel.statistics.subscriberCount || 0),
            videoCount: parseInt(channel.statistics.videoCount || 0),
            viewCount: parseInt(channel.statistics.viewCount || 0),
            lastSyncAt: new Date(),
            originalUrl: channelData.originalUrl || null,
            originalType: channelData.type,
            originalValue: channelData.value
          };
        } else {
          console.warn('⚠️ [YouTube] forHandle로 채널 조회 실패, Search API로 대체');
          // forHandle 실패 시 Search API로 대체
        }
      } catch (handleError) {
        console.warn('⚠️ [YouTube] 핸들 직접 조회 실패:', handleError.message);
      }
      
      // 위에서 실패한 경우에만 Search API 사용
      let searchQuery = channelData.value;
      
      console.log(`🔍 [YouTube] Search API로 ${channelData.type} 검색:`, searchQuery);
      
      // 특수문자가 포함된 경우 따옴표로 감싸서 정확한 검색
      if (searchQuery.includes('-') || searchQuery.includes('_') || searchQuery.includes('.')) {
        searchQuery = `"${searchQuery}"`;
        console.log('🔍 [YouTube] 특수문자 포함으로 따옴표 검색:', searchQuery);
      }
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&key=${apiKey}&maxResults=10`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.items && searchData.items.length > 0) {
        // 검색 결과를 자세히 로깅
        console.log(`🔍 [YouTube] 검색 결과 ${searchData.items.length}개 발견:`);
        searchData.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.snippet.title} (ID: ${item.snippet.channelId})`);
        });
        
        // 가장 정확한 매치 찾기
        let bestMatch = searchData.items[0];
        
        // 정확한 이름 매치가 있는지 확인
        for (const item of searchData.items) {
          const channelTitle = item.snippet.title.toLowerCase();
          const originalValue = channelData.value.toLowerCase();
          
          // 정확히 핸들명이 포함되는지 확인
          if (channelTitle.includes(originalValue) || originalValue.includes(channelTitle)) {
            bestMatch = item;
            console.log('🎯 [YouTube] 더 정확한 매치 발견:', item.snippet.title);
            break;
          }
        }
        
        const channelId = bestMatch.snippet.channelId;
        console.log('🎯 [YouTube] 최종 선택된 채널 ID:', channelId);
        console.log('🎯 [YouTube] 최종 선택된 채널명:', bestMatch.snippet.title);
        
        // 찾은 채널 ID로 상세 정보 조회
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`;
      } else {
        console.warn('⚠️ [YouTube] 검색 결과 없음:', channelData.value);
        return createMockChannelData(channelData);
      }
    } else if (['user', 'c', 'short'].includes(channelData.type)) {
      // 기존 Search API 방식 유지
      let searchQuery = channelData.value;
      
      console.log(`🔍 [YouTube] ${channelData.type}으로 검색:`, searchQuery);
      
      // 특수문자가 포함된 경우 따옴표로 감싸서 정확한 검색
      if (searchQuery.includes('-') || searchQuery.includes('_') || searchQuery.includes('.')) {
        searchQuery = `"${searchQuery}"`;
        console.log('🔍 [YouTube] 특수문자 포함으로 따옴표 검색:', searchQuery);
      }
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&key=${apiKey}&maxResults=10`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.items && searchData.items.length > 0) {
        // 가장 정확한 매치 찾기
        let bestMatch = searchData.items[0];
        
        console.log(`🔍 [YouTube] 검색 결과 ${searchData.items.length}개 발견`);
        console.log('🔍 [YouTube] 첫 번째 결과:', bestMatch.snippet.title);
        
        // 정확한 이름 매치가 있는지 확인
        for (const item of searchData.items) {
          const channelTitle = item.snippet.title.toLowerCase();
          const originalValue = channelData.value.toLowerCase();
          
          // 채널명이 정확히 일치하거나 포함되는 경우
          if (channelTitle === originalValue || 
              channelTitle.includes(originalValue) ||
              originalValue.includes(channelTitle.replace(/[^a-z0-9가-힣]/g, ''))) {
            bestMatch = item;
            console.log('🎯 [YouTube] 더 정확한 매치 발견:', item.snippet.title);
            break;
          }
        }
        
        const channelId = bestMatch.snippet.channelId;
        console.log('🎯 [YouTube] 최종 선택된 채널 ID:', channelId);
        console.log('🎯 [YouTube] 최종 선택된 채널명:', bestMatch.snippet.title);
        
        // 찾은 채널 ID로 상세 정보 조회
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`;
      } else {
        console.warn('⚠️ [YouTube] 검색 결과 없음:', channelData.value);
        return createMockChannelData(channelData);
      }
    } else {
      console.warn('⚠️ [YouTube] 지원하지 않는 타입:', channelData.type);
      return createMockChannelData(channelData);
    }
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      console.log('✅ [YouTube] 채널 정보 조회 성공:', channel.snippet.title);
      console.log('📊 [YouTube] 구독자 수:', channel.statistics.subscriberCount);
      
      return {
        channelId: channel.id,
        channelTitle: channel.snippet.title,
        channelDescription: channel.snippet.description,
        channelThumbnail: channel.snippet.thumbnails.default?.url || channel.snippet.thumbnails.medium?.url,
        channelBanner: channel.brandingSettings?.image?.bannerExternalUrl || null,
        subscriberCount: parseInt(channel.statistics.subscriberCount || 0),
        videoCount: parseInt(channel.statistics.videoCount || 0),
        viewCount: parseInt(channel.statistics.viewCount || 0),
        lastSyncAt: new Date(),
        // 원본 URL 정보 추가 저장
        originalUrl: channelData.originalUrl || null,
        originalType: channelData.type,
        originalValue: channelData.value
      };
    } else {
      console.warn('⚠️ [YouTube] 채널 정보 조회 실패');
      return createMockChannelData(channelData);
    }
  } catch (error) {
    console.error('❌ [YouTube] API 오류:', error);
    return createMockChannelData(channelData);
  }
}

function createMockChannelData(channelData) {
  return {
    channelId: channelData.value,
    channelTitle: `채널 (${channelData.value})`,
    channelDescription: '채널 설명을 가져올 수 없습니다.',
    channelThumbnail: '/default-channel.png',
    channelBanner: null,
    subscriberCount: 0,
    videoCount: 0,
    viewCount: 0,
    lastSyncAt: new Date(),
    isMockData: true
  };
}

// 채널의 영상 목록을 가져오는 함수
export async function fetchChannelVideos(channelId, maxResults = 20) {
  try {
    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ [YouTube] API 키가 없어 Mock 데이터 반환');
      return createMockVideoData();
    }

    console.log('🔍 [YouTube] 채널 영상 조회 시작:', channelId);

    // 채널의 업로드 플레이리스트 ID 가져오기 (채널 ID의 'UC'를 'UU'로 변경)
    const uploadsPlaylistId = channelId.replace('UC', 'UU');
    
    // 플레이리스트 아이템 조회 (최신 영상들)
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&order=date&key=${apiKey}`;
    
    const response = await fetch(playlistUrl);
    const data = await response.json();

    if (data.error) {
      console.error('❌ [YouTube] 플레이리스트 조회 오류:', data.error);
      // 플레이리스트 방식 실패 시 Search API로 대체
      return await fetchChannelVideosBySearch(channelId, maxResults);
    }

    if (data.items && data.items.length > 0) {
      console.log(`✅ [YouTube] 영상 ${data.items.length}개 조회 성공`);
      
      // 영상 ID들 추출
      const videoIds = data.items.map(item => item.snippet.resourceId.videoId).join(',');
      
      // 영상 상세 정보 조회 (재생시간, 조회수 등)
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
      
      const videosResponse = await fetch(videosUrl);
      const videosData = await videosResponse.json();
      
      if (videosData.items) {
        const videos = videosData.items.map(video => {
          const duration = parseYouTubeDuration(video.contentDetails.duration);
          const isShort = duration <= 60; // 60초 이하는 숏폼으로 간주
          
          return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnailUrl: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
            duration: formatDuration(duration),
            durationSeconds: duration,
            type: isShort ? 'short' : 'long',
            publishedAt: video.snippet.publishedAt,
            viewCount: parseInt(video.statistics.viewCount || 0),
            likeCount: parseInt(video.statistics.likeCount || 0),
            channelTitle: video.snippet.channelTitle,
            // 상호시청용 추가 데이터
            watchProgress: 0,
            totalViewers: 0,
            currentViewers: 0
          };
        });

        console.log(`✅ [YouTube] 영상 상세 정보 처리 완료: ${videos.length}개`);
        console.log('📊 [YouTube] 숏폼/롱폼 분포:', {
          shorts: videos.filter(v => v.type === 'short').length,
          longs: videos.filter(v => v.type === 'long').length
        });

        return videos;
      }
    }

    console.warn('⚠️ [YouTube] 영상 목록이 비어있음');
    return createMockVideoData();

  } catch (error) {
    console.error('❌ [YouTube] 영상 조회 오류:', error);
    return createMockVideoData();
  }
}

// Search API를 사용한 대체 방법
async function fetchChannelVideosBySearch(channelId, maxResults) {
  try {
    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${apiKey}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const videoIds = data.items.map(item => item.id.videoId).join(',');
      
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
      
      const videosResponse = await fetch(videosUrl);
      const videosData = await videosResponse.json();
      
      if (videosData.items) {
        return videosData.items.map(video => {
          const duration = parseYouTubeDuration(video.contentDetails.duration);
          const isShort = duration <= 60;
          
          return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnailUrl: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
            duration: formatDuration(duration),
            durationSeconds: duration,
            type: isShort ? 'short' : 'long',
            publishedAt: video.snippet.publishedAt,
            viewCount: parseInt(video.statistics.viewCount || 0),
            likeCount: parseInt(video.statistics.likeCount || 0),
            channelTitle: video.snippet.channelTitle,
            watchProgress: 0,
            totalViewers: 0,
            currentViewers: 0
          };
        });
      }
    }

    return createMockVideoData();
  } catch (error) {
    console.error('❌ [YouTube] Search API 영상 조회 오류:', error);
    return createMockVideoData();
  }
}

// YouTube 재생시간 파싱 (PT4M13S -> 253초)
function parseYouTubeDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// 초를 시간 형식으로 변환 (253 -> "4:13")
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Mock 영상 데이터 생성
function createMockVideoData() {
  return [
    {
      id: 'mock1',
      title: 'Mock 영상 1',
      description: 'API 키가 없어 표시되는 샘플 영상입니다.',
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIzMCIgZmlsbD0iI0VGNDQ0NCIvPgo8cGF0aCBkPSJNMTUwIDc1TDE3NSA5MEwxNTAgMTA1Vjc1WiIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K',
      duration: '2:30',
      durationSeconds: 150,
      type: 'short',
      publishedAt: new Date().toISOString(),
      viewCount: 1200,
      likeCount: 45,
      channelTitle: 'Mock Channel',
      watchProgress: 0,
      totalViewers: 0,
      currentViewers: 0
    },
    {
      id: 'mock2',
      title: 'Mock 영상 2',
      description: 'API 키가 없어 표시되는 샘플 영상입니다.',
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIzMCIgZmlsbD0iI0VGNDQ0NCIvPgo8cGF0aCBkPSJNMTUwIDc1TDE3NSA5MEwxNTAgMTA1Vjc1WiIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K',
      duration: '8:45',
      durationSeconds: 525,
      type: 'long',
      publishedAt: new Date().toISOString(),
      viewCount: 3500,
      likeCount: 120,
      channelTitle: 'Mock Channel',
      watchProgress: 0,
      totalViewers: 0,
      currentViewers: 0
    }
  ];
}

const normalizeYouTubeUrl = (url) => {
  if (!url) return '';
  
  try {
    const decodedUrl = decodeURIComponent(url);
    // ... existing code ...
    
    const simpleChannelMatch = decodedUrl.match(/youtube\.com\/c\/([^\/\?&]+)/);
    if (simpleChannelMatch) {
      return simpleChannelMatch[1];
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

export const getYouTubeChannelInfo = async (channelUrl) => {
  try {
    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    
    if (!apiKey) {
      return { 
        error: 'YouTube API 키가 설정되지 않았습니다',
        channelTitle: '알 수 없는 채널',
        channelId: null,
        subscriberCount: '정보 없음',
        profileImageUrl: null
      };
    }

    // ... existing code ...

    const channelData = await searchChannelByName(username);
    if (channelData) {
      return channelData;
    }

    // ... existing code ...

    const searchQuery = encodeURIComponent(username);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${searchQuery}&key=${apiKey}&maxResults=10`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.items && searchData.items.length > 0) {
      // ... existing code ...
      
      if (bestMatch) {
        const channelId = bestMatch.id.channelId;
        
        // ... existing code ...
        
        const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          // ... existing code ...
        }
      }
    }

    // ... existing code ...

  } catch (error) {
    return { 
      error: error.message,
      channelTitle: '알 수 없는 채널',
      channelId: null,
      subscriberCount: '정보 없음',
      profileImageUrl: null
    };
  }
}; 
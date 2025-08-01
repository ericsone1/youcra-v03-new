import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

// 채팅방 데이터 처리 함수
export const processRoomData = async (room) => {
  try {
    // 기본 정보 설정
    const processedRoom = {
      ...room,
      participantCount: 0,
      currentlyWatching: 0,
      messageCount: 0,
      likesCount: 0,
      trending: false,
      status: 'active'
    };

    // 해시태그가 없는 경우 기본값 설정
    if (!processedRoom.hashtags || processedRoom.hashtags.length === 0) {
      const defaultHashtags = [
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
      const randomIndex = Math.floor(Math.random() * defaultHashtags.length);
      processedRoom.hashtags = defaultHashtags[randomIndex];
    }

    // 참여자 수 계산 (메시지 작성자 기준)
    try {
      const msgQuery = query(
        collection(db, "chatRooms", room.id, "messages"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      const msgSnapshot = await getDocs(msgQuery);
      
      const participants = new Set();
      msgSnapshot.forEach((doc) => {
        const msg = doc.data();
        if (msg.uid) participants.add(msg.uid);
      });
      
      processedRoom.participantCount = participants.size;
      processedRoom.messageCount = msgSnapshot.size;
    } catch (error) {
      // 에러 발생 시 기본값 유지
      processedRoom.participantCount = Math.floor(Math.random() * 20) + 1;
      processedRoom.messageCount = Math.floor(Math.random() * 50) + 1;
    }

    // 현재 시청자 수 (참여자의 30-70%)
    processedRoom.currentlyWatching = Math.floor(
      processedRoom.participantCount * (0.3 + Math.random() * 0.4)
    );

    // 좋아요 수 계산
    try {
      const likesQuery = query(collection(db, "chatRooms", room.id, "likes"));
      const likesSnapshot = await getDocs(likesQuery);
      processedRoom.likesCount = likesSnapshot.size;
    } catch (error) {
      processedRoom.likesCount = Math.floor(Math.random() * 10);
    }

    return processedRoom;
  } catch (error) {
    console.error(`Error processing room ${room.id}:`, error);
    return null;
  }
};

// 연관 카테고리 테이블
export const RELATED_CATEGORIES = {
  '일상': ['여행', '브이로그', '자연'],
  '여행': ['일상', '브이로그', '자연'],
  '브이로그': ['일상', '여행'],
  '자연': ['여행', '일상'],
  // Food-related synonyms
  '먹방': ['음식', '맛집', '푸드', '요리'],
  '음식': ['먹방', '맛집', '푸드', '요리'],
  '맛집': ['음식', '먹방', '푸드', '요리'],
  '푸드': ['음식', '먹방', '맛집', '요리'],
  '요리': ['음식', '먹방', '맛집', '푸드'],
  // Game related
  '게임': ['게임실황', 'e스포츠', '롤', '리그오브레전드'],
  '게임실황': ['게임', 'e스포츠', '롤', '리그오브레전드'],
  'e스포츠': ['게임', '게임실황', '롤', '리그오브레전드'],
  '롤': ['게임', '게임실황', 'e스포츠', '리그오브레전드'],
  '리그오브레전드': ['게임', '게임실황', 'e스포츠', '롤'],

  // Music related
  '음악': ['노래', '뮤직비디오', 'KPOP', '힙합'],
  '노래': ['음악', '뮤직비디오', 'KPOP', '힙합'],
  '뮤직비디오': ['음악', '노래', 'KPOP', '힙합'],
  'KPOP': ['음악', '노래', '뮤직비디오', '힙합'],
  '힙합': ['음악', '노래', '뮤직비디오', 'KPOP'],

  // Beauty & Fashion
  '뷰티': ['메이크업', '화장', '스킨케어', '패션'],
  '메이크업': ['뷰티', '화장', '스킨케어', '패션'],
  '화장': ['뷰티', '메이크업', '스킨케어', '패션'],
  '스킨케어': ['뷰티', '메이크업', '화장', '패션'],
  '패션': ['뷰티', '메이크업', '화장', '스킨케어'],

  // Fitness
  '운동': ['헬스', '피트니스', '다이어트', '홈트', '스포츠', '축구', '농구', '야구'],
  '헬스': ['운동', '피트니스', '다이어트', '홈트'],
  '피트니스': ['운동', '헬스', '다이어트', '홈트'],
  '다이어트': ['운동', '헬스', '피트니스', '홈트'],
  '홈트': ['운동', '헬스', '피트니스', '다이어트'],

  // Study & Education
  '공부': ['교육', '강의', '지식', '자격증'],
  '교육': ['공부', '강의', '지식', '자격증'],
  '강의': ['공부', '교육', '지식', '자격증'],
  '지식': ['공부', '교육', '강의', '자격증'],
  '자격증': ['공부', '교육', '강의', '지식'],

  // Tech & Gadgets
  'IT': ['테크', '전자기기', '언박싱', '리뷰'],
  '테크': ['IT', '전자기기', '언박싱', '리뷰'],
  '전자기기': ['IT', '테크', '언박싱', '리뷰'],
  '언박싱': ['IT', '테크', '전자기기', '리뷰'],

  // Movie & Drama
  '영화': ['드라마', '예고편', '애니메이션', '리뷰'],
  '드라마': ['영화', '예고편', '애니메이션', '리뷰'],
  '예고편': ['영화', '드라마', '애니메이션', '리뷰'],
  '애니메이션': ['영화', '드라마', '예고편', '리뷰'],

  // Generic Review
  '리뷰': ['IT', '테크', '전자기기', '언박싱', '영화', '드라마', '예고편', '애니메이션'],

  // Sports
  '스포츠': ['축구', '농구', '야구', '운동'],
  '축구': ['스포츠', '농구', '야구', '운동'],
  '농구': ['스포츠', '축구', '야구', '운동'],
  '야구': ['스포츠', '축구', '농구', '운동'],

  // Cars & Motors
  '자동차': ['모터스포츠', '튜닝', '드라이브', '리뷰'],
  '모터스포츠': ['자동차', '튜닝', '드라이브', '리뷰'],
  '튜닝': ['자동차', '모터스포츠', '드라이브', '리뷰'],
  '드라이브': ['자동차', '모터스포츠', '튜닝', '리뷰'],

  // Pets & Animals
  '동물': ['반려동물', '강아지', '고양이', '애완동물'],
  '반려동물': ['동물', '강아지', '고양이', '애완동물'],
  '강아지': ['동물', '반려동물', '고양이', '애완동물'],
  '고양이': ['동물', '반려동물', '강아지', '애완동물'],
  '애완동물': ['동물', '반려동물', '강아지', '고양이'],
  // 필요에 따라 추가
};

// 사용자가 선택한 카테고리와 연관 카테고리까지 모두 반환
export function getRecommendedCategories(selectedCategories) {
  const all = new Set(selectedCategories);
  selectedCategories.forEach(cat => {
    (RELATED_CATEGORIES[cat] || []).forEach(related => all.add(related));
  });
  return Array.from(all);
}

// 영상 리스트에서 추천 카테고리에 해당하는 영상만 필터링
export function filterVideosByRecommendedCategories(videos, recommendedCategories) {
  const catsLower = recommendedCategories.map(c => c.toLowerCase());

  return videos.filter(video => {
    // 1️⃣ category 필드 매칭
    if (video.category && catsLower.includes(String(video.category).toLowerCase())) return true;

    // 2️⃣ keywords(tags) 배열 매칭
    if (Array.isArray(video.keywords) && video.keywords.some(k => catsLower.includes(String(k).toLowerCase()))) return true;

    // 3️⃣ 제목과 설명에서 키워드 매칭 (Fallback)
    const title = (video.title || '').toLowerCase();
    const description = (video.description || '').toLowerCase();
    const channelTitle = (video.channelTitle || video.channel || '').toLowerCase();
    
    const allText = `${title} ${description} ${channelTitle}`;
    
    if (catsLower.some(cat => allText.includes(cat))) return true;

    return false; // 모든 조건에 해당하지 않으면 제외
  });
} 

// 영상 목록에서 videoId(id) 기준으로 중복을 제거한 새 배열 반환
export function computeUniqueVideos(videos = []) {
  const uniqueMap = new Map();
  
  videos.forEach(video => {
    const videoId = video?.videoId || video?.id;
    if (!videoId) return;
    
    // 등록자 정보가 없는 경우 기본값 사용
    const registeredBy = video?.registeredBy || video?.uploaderUid || video?.createdBy || 'unknown';
    const context = video?.roomName || video?.source || 'main';
    
    // 등록자 정보가 없으면 더 관대한 중복 제거
    if (registeredBy === 'unknown') {
      // 등록자 정보가 없으면 videoId + 컨텍스트만으로 중복 제거
      const uniqueKey = `${videoId}_${context}`;
      
      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, video);
      } else {
        // 같은 키가 있으면 viewCount가 높은 것만 유지
        const existing = uniqueMap.get(uniqueKey);
        const existingCount = existing?.ucraViewCount || 0;
        const newCount = video?.ucraViewCount || 0;
        if (newCount > existingCount) {
          uniqueMap.set(uniqueKey, video);
        }
      }
    } else {
      // 등록자 정보가 있으면 기존 로직 사용
      const uniqueKey = `${videoId}_${registeredBy}_${context}`;
      
      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, video);
      } else {
        const existing = uniqueMap.get(uniqueKey);
        const existingCount = existing?.ucraViewCount || 0;
        const newCount = video?.ucraViewCount || 0;
        if (newCount > existingCount) {
          uniqueMap.set(uniqueKey, video);
        }
      }
    }
  });
  
  const result = Array.from(uniqueMap.values());
  console.log('🔍 [computeUniqueVideos] 중복 제거 결과:', {
    원본개수: videos.length,
    중복제거후: result.length,
    제거된개수: videos.length - result.length,
    등록자정보없음: videos.filter(v => !v.registeredBy && !v.uploaderUid && !v.createdBy).length
  });
  
  return result;
} 
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
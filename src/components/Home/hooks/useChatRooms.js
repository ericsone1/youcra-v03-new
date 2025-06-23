import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { generateDummyHashtags } from '../utils/videoUtils';

export function useChatRooms() {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      
      const roomPromises = snapshot.docs.slice(0, 10).map(async (docSnap) => {
        const room = { id: docSnap.id, ...docSnap.data() };
        
        // 기본 해시태그 설정
        if (!room.hashtags || room.hashtags.length === 0) {
          room.hashtags = generateDummyHashtags();
        }

        // 실제 참여자 수 가져오기 (매번 새로 조회)
        try {
          const participantsRef = collection(db, "chatRooms", room.id, "participants");
          const participantsSnap = await getDocs(participantsRef);
          room.participantCount = participantsSnap.size;
        } catch (error) {
          room.participantCount = 0;
        }

        // 실제 좋아요 수 가져오기
        try {
          const likesRef = collection(db, "chatRooms", room.id, "likes");
          const likesSnap = await getDocs(likesRef);
          room.likesCount = likesSnap.size;
        } catch (error) {
          room.likesCount = 0;
        }

        // 활성 상태는 참여자가 1명 이상이면 활성으로 간주
        room.isActive = room.participantCount > 0;
        
        return room;
      });

      const processedRooms = await Promise.all(roomPromises);
      
      // 참여자 수 기준으로 정렬 (많은 순)
      const sortedRooms = processedRooms.sort((a, b) => b.participantCount - a.participantCount);
      
      setChatRooms(sortedRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 주기적으로 참여자 수 업데이트 (30초마다)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (chatRooms.length > 0) {
        const updatedRooms = await Promise.all(
          chatRooms.map(async (room) => {
            try {
              const participantsRef = collection(db, "chatRooms", room.id, "participants");
              const participantsSnap = await getDocs(participantsRef);
              return {
                ...room,
                participantCount: participantsSnap.size,
                isActive: participantsSnap.size > 0
              };
            } catch (error) {
              return room;
            }
          })
        );
        
        // 참여자 수 기준으로 다시 정렬
        const sortedRooms = updatedRooms.sort((a, b) => b.participantCount - a.participantCount);
        setChatRooms(sortedRooms);
      }
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, [chatRooms]);

  return { chatRooms, loading };
} 
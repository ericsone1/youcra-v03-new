import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
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

        // 더미 데이터 추가
        room.participantCount = Math.floor(Math.random() * 50) + 5;
        room.likesCount = Math.floor(Math.random() * 30) + 1;
        room.isActive = Math.random() > 0.3;
        
        return room;
      });

      const processedRooms = await Promise.all(roomPromises);
      setChatRooms(processedRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { chatRooms, loading };
} 
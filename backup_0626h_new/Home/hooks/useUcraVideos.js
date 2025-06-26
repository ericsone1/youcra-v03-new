import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { CATEGORY_KEYWORDS } from '../utils/constants';

export const useUcraVideos = (userCategory) => {
  const [ucraVideos, setUcraVideos] = useState([]);
  const [loadingUcraVideos, setLoadingUcraVideos] = useState(true);

  useEffect(() => {
    const fetchUcraVideos = async () => {
      setLoadingUcraVideos(true);
      try {
        const roomsQuery = query(collection(db, "chatRooms"));
        const roomsSnapshot = await getDocs(roomsQuery);
        
        let allVideos = [];
        
        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = roomDoc.data();
          const videosQuery = query(
            collection(db, "chatRooms", roomDoc.id, "videos"),
            orderBy("registeredAt", "desc")
          );
          const videosSnapshot = await getDocs(videosQuery);
          
          videosSnapshot.forEach(videoDoc => {
            const videoData = videoDoc.data();
            allVideos.push({
              ...videoData,
              id: videoDoc.id,
              roomId: roomDoc.id,
              roomName: roomData.name || '제목 없음',
              // 유크라 내 조회수 (시뮬레이션 - 실제로는 조회 기록을 저장해야 함)
              ucraViewCount: Math.floor(Math.random() * 1000) + 50,
              ucraLikes: Math.floor(Math.random() * 100) + 10
            });
          });
        }
        
        // 카테고리 필터링
        let filteredVideos = allVideos;
        if (userCategory && userCategory.id !== 'other') {
          const categoryKeywords = CATEGORY_KEYWORDS[userCategory.id] || [];
          filteredVideos = allVideos.filter(video => {
            const title = video.title?.toLowerCase() || '';
            const description = video.description?.toLowerCase() || '';
            const channelTitle = video.channelTitle?.toLowerCase() || '';
            
            return categoryKeywords.some(keyword => 
              title.includes(keyword.toLowerCase()) ||
              description.includes(keyword.toLowerCase()) ||
              channelTitle.includes(keyword.toLowerCase())
            );
          });
        }
        
        // UCRA 내 조회수 기준으로 정렬
        filteredVideos.sort((a, b) => b.ucraViewCount - a.ucraViewCount);
        
        setUcraVideos(filteredVideos.slice(0, 20)); // 상위 20개만
      } catch (error) {
        console.error('UCRA 영상 로드 오류:', error);
      } finally {
        setLoadingUcraVideos(false);
      }
    };

    fetchUcraVideos();
  }, [userCategory]);

  return { ucraVideos, loadingUcraVideos };
}; 
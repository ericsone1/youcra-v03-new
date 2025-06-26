import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { convertVideoData, sortVideosByScore } from '../utils/videoUtils';

export function useVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRegisteredVideos() {
      setLoading(true);
      setError("");
      
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
          
          for (const videoDoc of videosSnapshot.docs) {
            const videoData = videoDoc.data();
            if (videoData.videoId) {
              // 실제 인증 수 가져오기
              try {
                const certificationsRef = collection(db, "chatRooms", roomDoc.id, "videos", videoDoc.id, "certifications");
                const certificationsSnap = await getDocs(certificationsRef);
                videoData.certificationCount = certificationsSnap.size;
              } catch (error) {
                videoData.certificationCount = 0;
              }

              // 실제 시청자 수는 인증자 수와 동일하게 설정 (실제 시청 데이터가 없으므로)
              videoData.watchCount = videoData.certificationCount;

              const convertedVideo = convertVideoData(videoData, roomData, roomDoc.id);
              allVideos.push(convertedVideo);
            }
          }
        }
        
        // 점수순으로 정렬하고 상위 20개만 선택
        const sortedVideos = sortVideosByScore(allVideos);
        setVideos(sortedVideos.slice(0, 20));
        
      } catch (err) {
        console.error("등록된 영상 가져오기 오류:", err);
        setError("등록된 영상을 불러올 수 없습니다: " + err.message);
      }
      
      setLoading(false);
    }

    fetchRegisteredVideos();
  }, []);

  return { videos, loading, error };
} 
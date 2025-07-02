import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CATEGORY_KEYWORDS, API_KEY } from '../utils/constants';

export const useUcraVideos = (userCategory = null) => {
  const [ucraVideos, setUcraVideos] = useState([]);
  const [loadingUcraVideos, setLoadingUcraVideos] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoadingUcraVideos(true);
        setError(null);

        // Firestore에서 videos 컬렉션 조회 (실제 필드명에 맞게 수정)
        const videosRef = collection(db, 'videos');
        const videosQuery = query(
          videosRef,
          orderBy('registeredAt', 'desc'),
          limit(20)
        );

        const querySnapshot = await getDocs(videosQuery);
        const videos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          videoId: doc.data().id, // 실제 DB 필드명
          title: doc.data().title,
          thumbnail: doc.data().thumbnail,
          channel: doc.data().channel,
          channelId: doc.data().channelId,
          duration: doc.data().duration, // 문자열로 들어올 수 있음
          views: doc.data().views, // 문자열로 들어올 수 있음
          registeredAt: doc.data().registeredAt,
        }));

        // 카테고리 필터링
        let filteredVideos = videos;
        if (userCategory && userCategory.id !== 'other') {
          const categoryKeywords = CATEGORY_KEYWORDS[userCategory.id] || [];
          filteredVideos = videos.filter(video => {
            const title = video.title?.toLowerCase() || '';
            const description = video.description?.toLowerCase() || '';
            const channelTitle = video.channel?.toLowerCase() || '';
            return categoryKeywords.some(keyword => 
              title.includes(keyword.toLowerCase()) ||
              description.includes(keyword.toLowerCase()) ||
              channelTitle.includes(keyword.toLowerCase())
            );
          });
        }
        // 조회수 기준 정렬 (문자열일 경우 숫자 변환 시도)
        filteredVideos.sort((a, b) => {
          const va = typeof a.views === 'string' ? parseInt(a.views.replace(/[^\d]/g, '')) : (a.views || 0);
          const vb = typeof b.views === 'string' ? parseInt(b.views.replace(/[^\d]/g, '')) : (b.views || 0);
          return vb - va;
        });
        setUcraVideos(filteredVideos);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('영상을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingUcraVideos(false);
      }
    };

    fetchVideos();
  }, [userCategory]);

  return {
    ucraVideos,
    loadingUcraVideos,
    error
  };
}; 
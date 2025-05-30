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
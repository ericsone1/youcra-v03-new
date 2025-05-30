import { useState, useEffect } from 'react';
import { checkVideoDuplicate, validateAndFetchVideoInfo, registerVideo } from '../services/videoService';
import { auth } from '../firebase';

export function useVideo(roomId) {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");

  useEffect(() => {
    const checkVideo = async () => {
      if (!videoUrl.trim()) {
        setVideoMsg("");
        setVideoMeta(null);
        return;
      }

      try {
        const meta = await validateAndFetchVideoInfo(videoUrl);
        const isDuplicate = await checkVideoDuplicate(roomId, meta.videoId);
        
        if (isDuplicate) {
          setVideoMsg("이미 등록된 영상입니다.");
          setVideoMeta(null);
        } else {
          setVideoMeta(meta);
          setVideoMsg("");
        }
      } catch (error) {
        setVideoMsg(error.message);
        setVideoMeta(null);
      }
    };

    const timeoutId = setTimeout(checkVideo, 500);
    return () => clearTimeout(timeoutId);
  }, [videoUrl, roomId]);

  const handleRegister = async () => {
    if (!videoMeta) return;
    
    setVideoLoading(true);
    try {
      const isDuplicate = await checkVideoDuplicate(roomId, videoMeta.videoId);
      if (isDuplicate) {
        setVideoMsg("이미 등록된 영상입니다.");
        return;
      }

      await registerVideo(roomId, videoMeta, auth.currentUser?.uid);
      setVideoMsg("영상이 등록되었습니다!");
      setVideoUrl("");
      setVideoMeta(null);
      
      return true; // 등록 성공
    } catch (error) {
      setVideoMsg("영상 등록 중 오류가 발생했습니다.");
      return false; // 등록 실패
    } finally {
      setVideoLoading(false);
    }
  };

  return {
    videoUrl,
    setVideoUrl,
    videoMeta,
    videoLoading,
    videoMsg,
    handleRegister
  };
} 
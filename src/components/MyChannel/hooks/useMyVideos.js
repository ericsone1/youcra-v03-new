import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
} from "firebase/firestore";
import { db } from "../../../firebase";

export const useMyVideos = (user, profile) => {
  const [myRooms, setMyRooms] = useState([]);
  const [myRoomInfos, setMyRoomInfos] = useState([]);
  const [myVideosData, setMyVideosData] = useState([]);
  const [myMessages, setMyMessages] = useState([]);

  // 내가 등록한 영상이 있는 방 roomId 리스트 구하기
  useEffect(() => {
    if (!user) return;
    const fetchMyRooms = async () => {
      const q = query(collection(db, "chatRooms"));
      const roomSnap = await getDocs(q);
      let roomIds = [];
      for (const roomDoc of roomSnap.docs) {
        const roomId = roomDoc.id;
        const videoQ = query(
          collection(db, "chatRooms", roomId, "videos"),
          where("registeredBy", "==", user.uid)
        );
        const videoSnap = await getDocs(videoQ);
        if (!videoSnap.empty) {
          roomIds.push(roomId);
        }
      }
      setMyRooms(roomIds);
    };
    fetchMyRooms();
  }, [user]);

  // 방 정보 가져오기
  useEffect(() => {
    if (myRooms.length === 0) {
      setMyRoomInfos([]);
      return;
    }
    const fetchRoomInfos = async () => {
      let infos = [];
      for (const roomId of myRooms) {
        const docRef = doc(db, "chatRooms", roomId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          infos.push({ id: roomId, ...docSnap.data() });
        }
      }
      setMyRoomInfos(infos);
    };
    fetchRoomInfos();
  }, [myRooms]);

  // 내 메시지/참여방 불러오기
  useEffect(() => {
    if (!user) return;
    const fetchMyMessages = async () => {
      const q = query(
        collection(db, "chatRooms"),
        where("members", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const msgs = [];
      const roomSet = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const pathParts = doc.ref.path.split("/");
        const roomId = pathParts[1];
        msgs.push({
          id: doc.id,
          roomId,
          ...data,
        });
        roomSet.add(roomId);
      });
      msgs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyMessages(msgs);
    };
    fetchMyMessages();
  }, [user]);

  // 내 영상별 풀시청자 수 계산
  const fetchMyVideosData = async () => {
    if (!user) return;

    try {
      const videosData = [];

      for (const room of myRoomInfos) {
        const videosRef = collection(db, 'chatRooms', room.id, 'videos');
        const snapshot = await getDocs(videosRef);

        for (const doc of snapshot.docs) {
          const videoData = doc.data();
          
          const isMyVideo = videoData.registeredBy === user.uid || 
                           (profile.channelId && videoData.channelId === profile.channelId);
          
          if (isMyVideo) {
            const viewsRef = collection(db, 'chatRooms', room.id, 'videos', doc.id, 'fullViewers');
            const viewsSnapshot = await getDocs(viewsRef);
            const fullViewersCount = viewsSnapshot.size;

            videosData.push({
              ...videoData,
              id: doc.id,
              roomId: room.id,
              roomName: room.name,
              fullViewersCount
            });
          }
        }
      }

      const groupedVideos = videosData.reduce((acc, video) => {
        const roomId = video.roomId;
        if (!acc[roomId]) {
          acc[roomId] = {
            roomName: video.roomName,
            roomId: roomId,
            videos: []
          };
        }
        acc[roomId].videos.push(video);
        return acc;
      }, {});

      setMyVideosData(Object.values(groupedVideos));
    } catch (error) {
      console.error('영상 데이터 가져오기 실패:', error);
    }
  };

  // 영상 데이터 로딩
  useEffect(() => {
    if (myRoomInfos.length > 0 && user) {
      fetchMyVideosData();
    }
  }, [myRoomInfos, user, profile]);

  return {
    myRooms,
    myRoomInfos,
    myVideosData,
    myMessages,
    fetchMyVideosData
  };
}; 
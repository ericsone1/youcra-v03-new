import { auth, db, storage } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 프로필 조회
export async function getUserProfile(userId) {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// 프로필 업데이트
export async function updateUserProfile(userId, profileData) {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, profileData, { merge: true });
}

// 프로필 이미지 업로드
export async function uploadProfileImage(userId, imageFile) {
  const storageRef = ref(storage, `profiles/${userId}`);
  const snapshot = await uploadBytes(storageRef, imageFile);
  return await getDownloadURL(snapshot.ref);
}

// 사용자의 채팅방 목록 조회
export async function getUserRooms(userId) {
  const roomsQuery = query(
    collection(db, "chatRooms"),
    where("participants", "array-contains", userId)
  );
  const snapshot = await getDocs(roomsQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// 사용자의 메시지 조회
export async function getUserMessages(userId) {
  const messagesQuery = query(
    collection(db, "messages"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(messagesQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// 포인트 업데이트
export async function updateUserPoints(userId, points) {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { point: points }, { merge: true });
}

// 채널 링크 유효성 검사
export function validateChannelLink(link) {
  try {
    const url = new URL(link);
    return url.hostname.includes('youtube.com');
  } catch {
    return false;
  }
} 
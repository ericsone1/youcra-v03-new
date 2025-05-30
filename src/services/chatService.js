import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

// 채팅방 생성
export async function createChatRoom(roomData) {
  return await addDoc(collection(db, "chatRooms"), {
    ...roomData,
    createdAt: serverTimestamp(),
  });
}

// 채팅방 목록 조회 (실시간)
export function subscribeToChatRooms(callback) {
  const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
  return onSnapshot(q, callback);
}

// 특정 채팅방 조회 (실시간)
export function subscribeToChatRoom(roomId, callback) {
  return onSnapshot(doc(db, "chatRooms", roomId), callback);
}

// 메시지 목록 조회 (실시간)
export function subscribeToMessages(roomId, callback) {
  const q = query(
    collection(db, "chatRooms", roomId, "messages"),
    orderBy("createdAt")
  );
  return onSnapshot(q, callback);
}

// 메시지 전송
export async function sendMessage(roomId, messageData) {
  return await addDoc(collection(db, "chatRooms", roomId, "messages"), {
    ...messageData,
    createdAt: serverTimestamp(),
  });
}

// 참여자 관리
export function subscribeToParticipants(roomId, callback) {
  return onSnapshot(
    collection(db, "chatRooms", roomId, "participants"),
    callback
  );
}

export async function addParticipant(roomId, userId, userData) {
  const participantRef = doc(db, "chatRooms", roomId, "participants", userId);
  await setDoc(participantRef, {
    ...userData,
    joinedAt: serverTimestamp(),
  });
}

export async function removeParticipant(roomId, userId) {
  const participantRef = doc(db, "chatRooms", roomId, "participants", userId);
  await deleteDoc(participantRef);
}

// 채팅방 정보 업데이트
export async function updateChatRoom(roomId, data) {
  const roomRef = doc(db, "chatRooms", roomId);
  await updateDoc(roomRef, data);
}

// 채팅방 삭제
export async function deleteChatRoom(roomId) {
  const roomRef = doc(db, "chatRooms", roomId);
  await deleteDoc(roomRef);
} 
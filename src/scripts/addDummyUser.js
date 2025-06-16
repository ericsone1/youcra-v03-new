import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// 더미 유저 데이터
const dummyUser = {
  id: 'dummy_user_001',
  displayName: '김테스트',
  email: 'test@example.com',
  profileImage: 'https://ui-avatars.com/api/?name=김테스트&background=6366f1&color=ffffff&size=120&font-size=0.6',
  channelUrl: 'https://www.youtube.com/@testyoutube',
  isSubscribed: false,
  fanLevel: 1,
  point: 100,
  joinedAt: serverTimestamp(),
  createdAt: serverTimestamp(),
  lastActiveAt: serverTimestamp(),
  status: 'online',
  bio: '참여자 관리 기능 테스트를 위한 더미 유저입니다. 👋',
  badges: ['🧪', '👤']
};

// 더미 유저를 Firebase에 추가하는 함수
export async function addDummyUserToFirebase() {
  try {
    // users 컬렉션에 더미 유저 추가
    const userRef = doc(db, 'users', dummyUser.id);
    await setDoc(userRef, dummyUser);
    
    console.log('✅ 더미 유저가 성공적으로 추가되었습니다:', dummyUser.displayName);
    return dummyUser;
  } catch (error) {
    console.error('❌ 더미 유저 추가 실패:', error);
    throw error;
  }
}

// 특정 채팅방에 더미 유저를 참여자로 추가하는 함수
export async function addDummyUserToRoom(roomId) {
  try {
    // 채팅방 참여자로 추가
    const participantRef = doc(db, 'chatRooms', roomId, 'participants', dummyUser.id);
    await setDoc(participantRef, {
      userId: dummyUser.id,
      displayName: dummyUser.displayName,
      email: dummyUser.email,
      profileImage: dummyUser.profileImage,
      isOwner: false,
      isHost: false,
      role: 'member',
      joinedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      status: 'online',
      bio: dummyUser.bio,
      badges: dummyUser.badges
    });
    
    console.log(`✅ 더미 유저가 채팅방 ${roomId}에 참여자로 추가되었습니다.`);
    return true;
  } catch (error) {
    console.error('❌ 더미 유저 채팅방 추가 실패:', error);
    throw error;
  }
}

// 모든 더미 유저 설정을 한번에 실행
export async function setupDummyUser(roomId = null) {
  try {
    // 1. Firebase users 컬렉션에 더미 유저 추가
    await addDummyUserToFirebase();
    
    // 2. 특정 채팅방이 지정된 경우 참여자로 추가
    if (roomId) {
      await addDummyUserToRoom(roomId);
    }
    
    console.log('🎉 더미 유저 설정이 완료되었습니다!');
    return dummyUser;
  } catch (error) {
    console.error('❌ 더미 유저 설정 실패:', error);
    throw error;
  }
}

export default { addDummyUserToFirebase, addDummyUserToRoom, setupDummyUser }; 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태
  const [sharedRoomId, setSharedRoomId] = useState(null); // 공유된 방 ID 저장

  // 공유된 방 정보 저장
  const setSharedRoom = (roomId) => {
    setSharedRoomId(roomId);
    if (roomId) {
      localStorage.setItem('sharedRoomId', roomId);
    } else {
      localStorage.removeItem('sharedRoomId');
    }
  };

  // 공유된 방 정보 가져오기 및 초기화
  const getAndClearSharedRoom = () => {
    const roomId = sharedRoomId || localStorage.getItem('sharedRoomId');
    setSharedRoomId(null);
    localStorage.removeItem('sharedRoomId');
    return roomId;
  };

  // Firebase Auth 상태 감지 및 임시 사용자 관리
  useEffect(() => {
    // 페이지 로드 시 공유된 방 ID 복원
    const savedSharedRoomId = localStorage.getItem('sharedRoomId');
    if (savedSharedRoomId) {
      setSharedRoomId(savedSharedRoomId);
    }

    // Firebase Auth 상태 감지
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase 사용자 로그인됨 - Firestore에서 사용자 프로필 정보 가져오기
        let displayName = firebaseUser.displayName || '유크라 사용자';
        let photoURL = firebaseUser.photoURL;
        
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            displayName = userData.nick || userData.displayName || userData.nickname || firebaseUser.displayName || '유크라 사용자';
            photoURL = userData.photoURL || userData.profileImage || firebaseUser.photoURL;
          }
        } catch (error) {
          console.error('사용자 프로필 정보 가져오기 실패:', error);
        }

        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
          photoURL: photoURL,
          isEmailUser: true
        });
        setAuthMethod('firebase');
        localStorage.removeItem('isLoggedOut');
        localStorage.removeItem('tempUser');
      } else {
        // Firebase 사용자 없음 - 로그아웃 상태
        // 기존 임시 사용자 데이터 정리
        localStorage.removeItem('tempUser');
        localStorage.removeItem('isLoggedOut');
        
        // 홈탭 관련 localStorage(ucra_*) 정리
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('ucra_') || key.startsWith('video_')) {
            localStorage.removeItem(key);
          }
        });
        
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firebase 구글 로그아웃
  const logout = async () => {
    try {
      // 사용자 확인 메시지
      const confirmLogout = window.confirm('정말 로그아웃 하시겠습니까?');
      if (!confirmLogout) {
        return;
      }

      // Firebase 로그아웃
      await signOut(auth);

      // 모든 로컬 데이터 정리
      localStorage.clear();
      sessionStorage.clear();

      // 상태 업데이트
      setCurrentUser(null);
      
      // 홈으로 이동
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };



  const value = {
    currentUser,
    loading,
    logout,
    isAuthenticated: !!currentUser, // currentUser가 있으면 true, 없으면 false
    sharedRoomId,
    setSharedRoom,
    getAndClearSharedRoom
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 
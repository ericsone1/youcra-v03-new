import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth } from '../firebase';

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
  const [authMethod, setAuthMethod] = useState(null);

  // Firebase Auth 상태 감지 및 임시 사용자 관리
  useEffect(() => {
    console.log('🔄 혼합 인증 모드 활성화 (Firebase Auth + 임시 인증)');
    
    // Firebase Auth 상태 감지
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Firebase 사용자 로그인됨
        console.log('✅ Firebase 사용자 감지:', firebaseUser.email);
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || '유크라 사용자',
          photoURL: firebaseUser.photoURL,
          isTemporaryUser: false,
          isEmailUser: true
        });
        setAuthMethod('firebase');
        localStorage.removeItem('isLoggedOut');
        localStorage.removeItem('tempUser');
      } else {
        // Firebase 사용자 없음 - 임시 사용자 체크
        const isLoggedOut = localStorage.getItem('isLoggedOut') === 'true';
        const savedUser = localStorage.getItem('tempUser');
        
        if (!isLoggedOut && savedUser) {
          // 기존 임시 사용자 복원
          const tempUser = JSON.parse(savedUser);
          console.log('📂 기존 임시 사용자 복원:', tempUser.displayName);
          setCurrentUser(tempUser);
          setAuthMethod('temporary');
        } else {
          // 완전한 로그아웃 상태
          console.log('🚪 로그아웃 상태');
          setCurrentUser(null);
          setAuthMethod(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 로그아웃 (Firebase Auth + 임시 인증 지원)
  const logout = async () => {
    console.log('🔄 로그아웃 실행 중...');
    try {
      // 사용자 확인 메시지
      const confirmLogout = window.confirm('정말 로그아웃 하시겠습니까?');
      if (!confirmLogout) {
        console.log('❌ 로그아웃 취소됨');
        return;
      }

      // Firebase 사용자인 경우 Firebase 로그아웃
      if (authMethod === 'firebase') {
        await signOut(auth);
        console.log('✅ Firebase 로그아웃 완료');
      }

      // 로그아웃 상태 저장 및 임시 사용자 정보 제거
      localStorage.setItem('isLoggedOut', 'true');
      localStorage.removeItem('tempUser');
      
      // 상태 업데이트
      setCurrentUser(null);
      setAuthMethod(null);
      
      console.log('✅ 로그아웃 완료');
      
      // 부드러운 페이지 전환 (새로고침 대신 홈으로 이동)
      window.location.href = '/';
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 이메일 로그인 함수
  const emailLogin = async (email, password) => {
    console.log('🔄 이메일 로그인 실행:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ 이메일 로그인 성공:', userCredential.user.email);
      // onAuthStateChanged가 자동으로 currentUser 업데이트
      return userCredential.user;
    } catch (error) {
      console.error('❌ 이메일 로그인 실패:', error);
      throw error;
    }
  };

  // 이메일 회원가입 함수
  const emailSignup = async (email, password, displayName) => {
    console.log('🔄 이메일 회원가입 실행:', email);
    try {
      // 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 프로필 업데이트 (닉네임 설정)
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      
      console.log('✅ 이메일 회원가입 성공:', userCredential.user.email);
      // onAuthStateChanged가 자동으로 currentUser 업데이트
      return userCredential.user;
    } catch (error) {
      console.error('❌ 이메일 회원가입 실패:', error);
      throw error;
    }
  };

  // 임시 로그인 함수 (개선된 버전)
  const tempLogin = () => {
    console.log('🔄 임시 로그인 실행');
    
    // 새로운 임시 사용자 생성
    const newUser = {
      uid: 'temp_user_' + Date.now(),
      email: 'temp@youcra.com',
      displayName: '유크라 사용자',
      photoURL: null,
      isTemporaryUser: true,
      loginTime: new Date().toISOString()
    };

    // localStorage 업데이트
    localStorage.removeItem('isLoggedOut');
    localStorage.setItem('tempUser', JSON.stringify(newUser));
    
    // 상태 업데이트
    setCurrentUser(newUser);
    setAuthMethod('temporary');
    
    console.log('✅ 임시 로그인 완료:', newUser.displayName);
  };

  const value = {
    currentUser,
    loading,
    authMethod,
    logout,
    emailLogin,
    emailSignup,
    isAuthenticated: !!currentUser // currentUser가 있으면 true, 없으면 false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 
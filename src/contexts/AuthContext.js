import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
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
  const [loading, setLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState(null); // 'firebase' | 'google'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔄 Firebase Auth 상태 변경:', user);
      if (user) {
        setCurrentUser(user);
        setAuthMethod('firebase');
      } else {
        // Firebase 사용자가 없을 때만 currentUser를 null로 설정
        // Google 로그인 상태는 유지
        if (authMethod === 'firebase') {
          setCurrentUser(null);
          setAuthMethod(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [authMethod]);

  // Google 로그인 처리
  const handleGoogleAuth = (isSignedIn, userData) => {
    console.log('🔄 Google Auth 상태 변경:', isSignedIn, userData);
    if (isSignedIn && userData) {
      setCurrentUser({
        uid: userData.id,
        email: userData.email,
        displayName: userData.name,
        photoURL: userData.picture,
        isGoogleUser: true
      });
      setAuthMethod('google');
    } else if (!isSignedIn && authMethod === 'google') {
      setCurrentUser(null);
      setAuthMethod(null);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      if (authMethod === 'firebase') {
        await auth.signOut();
      }
      
      // Google 로그아웃도 처리
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      setCurrentUser(null);
      setAuthMethod(null);
      console.log('✅ 통합 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
    }
  };

  const value = {
    currentUser,
    loading,
    authMethod,
    handleGoogleAuth,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
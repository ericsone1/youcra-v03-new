import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { tempLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // 로그인
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ 이메일 로그인 성공:', userCredential.user.email);
        navigate('/my');
      } else {
        // 회원가입
        if (password !== confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.');
          return;
        }
        if (password.length < 6) {
          setError('비밀번호는 최소 6자 이상이어야 합니다.');
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 프로필 업데이트
        await updateProfile(user, {
          displayName: nickname || '유크라 사용자'
        });

        // Firestore에 사용자 정보 저장
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          nickname: nickname || '유크라 사용자',
          displayName: nickname || '유크라 사용자',
          profileImage: '',
          point: 0,
          channelLink: '',
          createdAt: new Date(),
          isEmailUser: true
        });

        console.log('✅ 이메일 회원가입 성공:', user.email);
        navigate('/my');
      }
    } catch (error) {
      console.error('❌ 인증 오류:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('이미 사용 중인 이메일입니다.');
          break;
        case 'auth/weak-password':
          setError('비밀번호가 너무 약합니다.');
          break;
        case 'auth/invalid-email':
          setError('올바르지 않은 이메일 형식입니다.');
          break;
        case 'auth/user-not-found':
          setError('존재하지 않는 계정입니다.');
          break;
        case 'auth/wrong-password':
          setError('잘못된 비밀번호입니다.');
          break;
        case 'auth/invalid-credential':
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
          break;
        default:
          setError('로그인 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    tempLogin();
    navigate('/my');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 pb-24">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">UC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isLogin ? '유크라에 로그인' : '유크라 회원가입'}
          </h1>
          <p className="text-gray-600 text-sm">
            {isLogin ? '계정에 로그인하여 시작하세요' : '새로운 계정을 만들어보세요'}
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 로그인/회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="닉네임을 입력하세요"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="비밀번호를 다시 입력하세요"
                required={!isLogin}
              />
            </div>
          )}

          {/* 로그인/회원가입 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isLogin ? '로그인 중...' : '가입 중...'}
              </span>
            ) : (
              isLogin ? '🔑 로그인' : '✨ 회원가입'
            )}
          </button>
        </form>

        {/* 로그인/회원가입 전환 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setNickname('');
            }}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>

        {/* 구분선 */}
        <div className="flex items-center my-6">
          <hr className="flex-1 border-gray-300" />
          <span className="px-3 text-gray-400 text-sm">또는</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* 게스트 로그인 */}
        <button
          onClick={handleGuestLogin}
          className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-200 transition-all duration-200 border border-gray-200"
        >
          👤 게스트로 체험하기
        </button>

        {/* 홈으로 돌아가기 */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>

      {/* 하단 탭바 */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around items-center h-16 z-50">
        <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
          <span className="text-xs">홈</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m10 0V6a4 4 0 00-8 0v2" /></svg>
          <span className="text-xs">채팅방</span>
        </Link>
        <Link to="/board" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <span className="text-xs">게시판</span>
        </Link>
        <Link to="/my" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-xs">마이채널</span>
        </Link>
      </footer>
    </div>
  );
}

export default LoginPage;

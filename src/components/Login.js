import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomTabBar from './MyChannel/BottomTabBar';

function Login() {
  const [isLogin, setIsLogin] = useState(true); // true: 로그인, false: 회원가입
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { emailLogin, emailSignup, tempLogin } = useAuth();
  const navigate = useNavigate();

  // 이메일 로그인/회원가입 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // 로그인
        await emailLogin(email, password);
        navigate('/my');
      } else {
        // 회원가입
        if (password !== confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.');
          return;
        }
        if (password.length < 6) {
          setError('비밀번호는 6자 이상이어야 합니다.');
          return;
        }
        await emailSignup(email, password, displayName);
        navigate('/my');
      }
    } catch (error) {
      console.error('Auth error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setError('등록되지 않은 이메일입니다.');
          break;
        case 'auth/wrong-password':
          setError('비밀번호가 틀렸습니다.');
          break;
        case 'auth/email-already-in-use':
          setError('이미 사용 중인 이메일입니다.');
          break;
        case 'auth/weak-password':
          setError('비밀번호가 너무 약합니다.');
          break;
        case 'auth/invalid-email':
          setError('유효하지 않은 이메일 형식입니다.');
          break;
        default:
          setError(isLogin ? '로그인에 실패했습니다.' : '회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 임시 로그인
  const handleTempLogin = async () => {
    try {
      setLoading(true);
      await tempLogin();
      navigate('/my');
    } catch (error) {
      setError('임시 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4 pb-24 max-w-md mx-auto">
      {/* 헤더 */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="text-gray-400 hover:text-gray-600 transition p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            {isLogin ? '로그인' : '회원가입'}
          </h1>
          <div className="w-10"></div> {/* 균형을 위한 빈 공간 */}
        </div>
      </div>

      {/* 로그인/회원가입 폼 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
        {/* 브랜드 로고 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            U
          </div>
          <h2 className="text-2xl font-bold gradient-text">UCRA</h2>
          <p className="text-gray-600 text-sm">유튜브 크리에이터들의 공간</p>
        </div>

        {/* 탭 스위치 */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2 rounded-md font-medium text-sm transition ${
              isLogin 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-2 rounded-md font-medium text-sm transition ${
              !isLogin 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회원가입시 닉네임 */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                닉네임
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="사용할 닉네임을 입력하세요"
                required={!isLogin}
              />
            </div>
          )}

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이메일을 입력하세요"
              required
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {/* 회원가입시 비밀번호 확인 */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="비밀번호를 다시 입력하세요"
                required={!isLogin}
              />
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 active:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center my-6">
          <hr className="flex-1 border-gray-300" />
          <span className="px-3 text-gray-400 text-sm">또는</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* 임시 로그인 */}
        <button
          onClick={handleTempLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 active:from-yellow-700 active:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          💨 임시 로그인으로 체험하기
        </button>
      </div>

      <BottomTabBar />
    </div>
  );
}

export default Login; 
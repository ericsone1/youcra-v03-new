import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getUserWatchStats, formatWatchTime, calculateTokensFromTime } from '../services/tokenService';

/**
 * 사용자의 토큰 현황을 실시간으로 가져오는 훅
 */
export const useTokenStats = () => {
  const { currentUser } = useAuth();
  const [tokenStats, setTokenStats] = useState({
    totalWatchSeconds: 0,
    totalTokens: 0,
    spentTokens: 0,
    availableTokens: 0,
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setTokenStats({
        totalWatchSeconds: 0,
        totalTokens: 0,
        spentTokens: 0,
        availableTokens: 0,
        lastUpdated: null
      });
      setLoading(false);
      return;
    }

    // 실시간 구독 설정
    const statsRef = doc(db, 'users', currentUser.uid, 'stats', 'watchStats');
    
    const unsubscribe = onSnapshot(statsRef, 
      async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 기존 사용자도 기본 토큰을 받지 않았다면 30토큰 추가 지급
            if (!data.basicTokensGranted) {
              console.log('🎁 [useTokenStats] 기존 사용자 기본 토큰 추가 지급');
              
              const updatedStats = {
                ...data,
                totalTokens: (data.totalTokens || 0) + 30,
                availableTokens: (data.availableTokens || 0) + 30,
                basicTokensGranted: true,
                basicTokensGrantedAt: new Date(),
                lastUpdated: new Date()
              };
              
              try {
                await setDoc(statsRef, updatedStats, { merge: true });
                setTokenStats(updatedStats);
                console.log(`✅ [useTokenStats] ${currentUser.uid} 기존 사용자 기본 토큰 30개 추가 지급 완료`);
              } catch (saveError) {
                console.error('❌ [useTokenStats] 기본 토큰 추가 지급 실패:', saveError);
                setTokenStats(data); // 실패시 기존 데이터 사용
              }
            } else if (!data.upgradedTo30Tokens) {
              // 이미 기본 토큰을 받았지만 30토큰 업그레이드를 안 받은 경우
              console.log('�� [useTokenStats] 30토큰 업그레이드 지급');
              
              const additionalTokens = 20; // 기존 10토큰에서 30토큰으로 +20토큰
              const updatedStats = {
                ...data,
                totalTokens: (data.totalTokens || 0) + additionalTokens,
                availableTokens: (data.availableTokens || 0) + additionalTokens,
                upgradedTo30Tokens: true,
                upgradedTo30TokensAt: new Date(),
                lastUpdated: new Date()
              };
              
              try {
                await setDoc(statsRef, updatedStats, { merge: true });
                setTokenStats(updatedStats);
                console.log(`✅ [useTokenStats] ${currentUser.uid} 30토큰 업그레이드 완료 (+${additionalTokens}토큰)`);
              } catch (saveError) {
                console.error('❌ [useTokenStats] 30토큰 업그레이드 실패:', saveError);
                setTokenStats(data); // 실패시 기존 데이터 사용
              }
            } else {
              setTokenStats(data);
            }
          } else {
            // 토큰 통계가 없으면 기본 30토큰 지급
            console.log('🎁 [useTokenStats] 신규 사용자 기본 토큰 지급');
            
            const basicTokenStats = {
              totalWatchSeconds: 0,
              totalTokens: 30,
              spentTokens: 0,
              availableTokens: 30,
              basicTokensGranted: true,
              basicTokensGrantedAt: new Date(),
              lastUpdated: new Date()
            };
            
            // Firestore에 저장
            try {
              await setDoc(statsRef, basicTokenStats);
              setTokenStats(basicTokenStats);
              console.log(`✅ [useTokenStats] ${currentUser.uid} 기본 토큰 30개 지급 완료`);
            } catch (saveError) {
              console.error('❌ [useTokenStats] 기본 토큰 저장 실패:', saveError);
              setTokenStats(basicTokenStats); // 로컬에만 설정
            }
          }
          setError(null);
        } catch (err) {
          console.error('❌ [useTokenStats] 토큰 현황 조회 실패:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ [useTokenStats] 실시간 구독 실패:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 포맷된 데이터 계산
  const formattedStats = {
    ...tokenStats,
    totalWatchTime: formatWatchTime(tokenStats.totalWatchSeconds),
    totalWatchHours: (tokenStats.totalWatchSeconds / 3600).toFixed(1),
    earnRate: calculateTokensFromTime(tokenStats.totalWatchSeconds),
    nextTokenIn: formatWatchTime(600 - (tokenStats.totalWatchSeconds % 600)), // 다음 토큰까지 남은 시간
    progressToNextToken: ((tokenStats.totalWatchSeconds % 600) / 600) * 100 // 다음 토큰까지 진행률
  };

  return {
    tokenStats: formattedStats,
    loading,
    error
  };
}; 
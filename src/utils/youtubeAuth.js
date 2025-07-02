// Firebase Auth에서 구글 accessToken 안전하게 얻는 함수
import { getAuth } from 'firebase/auth';

export async function getGoogleAccessToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  // Firebase Auth의 내부 토큰 매니저에서 accessToken 추출
  const token = user.stsTokenManager?.accessToken;
  return token || null;
}

// YouTube 채널ID를 받아서 내 구독 여부를 반환하는 함수
export async function checkYouTubeSubscription(channelId) {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) return null;

  const url = `https://www.googleapis.com/youtube/v3/subscriptions?part=id&forChannelId=${channelId}&mine=true`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await res.json();
  // items 배열이 1개 이상이면 구독 중
  return Array.isArray(data.items) && data.items.length > 0;
} 
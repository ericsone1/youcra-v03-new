import { useState } from 'react';

export function useHomeTokenState() {
  const [tokenCount, setTokenCount] = useState(0);

  const handleTokenEarned = () => {
    setTokenCount(prev => prev + 1);
    // TODO: API 호출 및 상태 업데이트
  };

  return {
    tokenCount,
    setTokenCount,
    handleTokenEarned,
  };
} 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCoins, FaTimes, FaVideo, FaExclamationTriangle } from 'react-icons/fa';
import { useTokenStats } from '../../../../hooks/useTokenStats';

export default function TokenAllocationModal({ 
  isOpen, 
  onClose, 
  selectedVideos, 
  onConfirm 
}) {
  const { tokenStats, loading } = useTokenStats();
  const [allocations, setAllocations] = useState({});
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [error, setError] = useState('');

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      const initialAllocations = {};
      selectedVideos.forEach(video => {
        initialAllocations[video.id] = 5; // 기본 5토큰 할당
      });
      setAllocations(initialAllocations);
      setTotalAllocated(selectedVideos.length * 5);
      setError('');
    }
  }, [isOpen, selectedVideos]);

  // 할당량 변경 핸들러
  const handleAllocationChange = (videoId, amount) => {
    const newAmount = Math.max(0, Math.min(100, parseInt(amount) || 0));
    const newAllocations = { ...allocations, [videoId]: newAmount };
    setAllocations(newAllocations);
    
    const newTotal = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);
    setTotalAllocated(newTotal);
    
    // 토큰 부족 체크
    if (newTotal > tokenStats.availableTokens) {
      setError(`보유 토큰이 부족합니다. (보유: ${tokenStats.availableTokens}개, 필요: ${newTotal}개)`);
    } else {
      setError('');
    }
  };

  // 일괄 할당
  const handleBulkAllocation = (amount) => {
    const newAllocations = {};
    selectedVideos.forEach(video => {
      newAllocations[video.id] = amount;
    });
    setAllocations(newAllocations);
    setTotalAllocated(selectedVideos.length * amount);
    
    const newTotal = selectedVideos.length * amount;
    if (newTotal > tokenStats.availableTokens) {
      setError(`보유 토큰이 부족합니다. (보유: ${tokenStats.availableTokens}개, 필요: ${newTotal}개)`);
    } else {
      setError('');
    }
  };

  // 자동 분배 (균등 분배)
  const handleAutoDistribute = () => {
    const perVideo = Math.floor(tokenStats.availableTokens / selectedVideos.length);
    const newAllocations = {};
    selectedVideos.forEach(video => {
      newAllocations[video.id] = perVideo;
    });
    setAllocations(newAllocations);
    setTotalAllocated(selectedVideos.length * perVideo);
    setError('');
  };

  // 확인 버튼 핸들러
  const handleConfirm = () => {
    if (totalAllocated > tokenStats.availableTokens) {
      setError('토큰이 부족합니다. 할당량을 줄여주세요.');
      return;
    }
    
    if (totalAllocated === 0) {
      setError('최소 1개 이상의 토큰을 할당해야 합니다.');
      return;
    }

    onConfirm(allocations);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-500 rounded-full p-2">
                  <FaCoins className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">토큰 할당</h2>
                  <p className="text-sm text-gray-600">영상별로 노출 토큰을 할당해주세요</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-yellow-100 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-500 text-xl" />
              </button>
            </div>
            
            {/* 토큰 현황 */}
            <div className="mt-4 flex items-center justify-between bg-white rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{tokenStats.availableTokens}</div>
                  <div className="text-xs text-gray-500">보유 토큰</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{totalAllocated}</div>
                  <div className="text-xs text-gray-500">할당 토큰</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{tokenStats.availableTokens - totalAllocated}</div>
                  <div className="text-xs text-gray-500">남은 토큰</div>
                </div>
              </div>
            </div>
          </div>

          {/* 컨텐츠 */}
          <div className="p-6">
            {/* 빠른 할당 버튼들 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">빠른 할당</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAllocation(3)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                >
                  각 3토큰
                </button>
                <button
                  onClick={() => handleBulkAllocation(5)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                >
                  각 5토큰
                </button>
                <button
                  onClick={() => handleBulkAllocation(10)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                >
                  각 10토큰
                </button>
                <button
                  onClick={handleAutoDistribute}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                >
                  자동 분배
                </button>
              </div>
            </div>

            {/* 영상별 할당 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">영상별 토큰 할당</h3>
              
              {selectedVideos.map((video) => (
                <div key={video.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={video.thumbnail || video.thumbnailUrl}
                      alt={video.title}
                      className="w-20 h-15 object-cover rounded"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${video.videoId || video.id}/mqdefault.jpg`;
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 truncate">{video.title}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">{video.channel}</span>
                        <span className="text-sm text-gray-500">{video.duration}</span>
                        <span className="text-sm text-gray-500">조회수 {video.viewCount}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <FaCoins className="text-yellow-500" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={allocations[video.id] || 0}
                        onChange={(e) => handleAllocationChange(video.id, e.target.value)}
                        className="w-20 p-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <span className="text-sm text-gray-500">토큰</span>
                    </div>
                  </div>
                  
                  {/* 토큰 효과 설명 */}
                  <div className="mt-2 text-xs text-gray-500">
                    💡 {allocations[video.id] || 0}토큰 = 최대 {allocations[video.id] || 0}회 노출 가능
                  </div>
                </div>
              ))}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <FaExclamationTriangle className="text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* 도움말 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">💡 토큰 할당 안내</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 토큰 1개 = 영상 1회 노출 기회</li>
                <li>• 할당된 토큰이 소진되면 해당 영상은 피드에서 숨겨집니다</li>
                <li>• 나중에 마이채널에서 추가 토큰을 할당할 수 있습니다</li>
                <li>• 영상을 10분 시청하면 1토큰을 획득할 수 있습니다</li>
              </ul>
            </div>
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                disabled={totalAllocated > tokenStats.availableTokens || totalAllocated === 0}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  totalAllocated > tokenStats.availableTokens || totalAllocated === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {totalAllocated === 0 ? '토큰을 할당해주세요' : '영상 등록하기'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 
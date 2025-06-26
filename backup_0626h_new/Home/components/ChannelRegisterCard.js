import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChannelRegisterCard = ({ onRegister, channelInfo, onEdit }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 샘플 채널 데이터 (데모용)
  const sampleChannel = {
    id: 'UC5F_A3MwEGCMrM0dhGF3Qvg',
    title: '유크라 크리에이터',
    handle: '@ucracreator',
    thumbnailUrl: 'https://yt3.googleusercontent.com/ytc/APkrFKYkn9Q9YQ8Q9Q9YQ9YQ9YQ9YQ9YQ9YQ9YQ9YQ=s800-c-k-c0x00ffffff-no-rj',
    subscriberCount: '1.2만',
    videoCount: '234',
    viewCount: '89만'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // TODO: 실제 YouTube API 연동
      // 데모를 위해 샘플 데이터 사용
      await new Promise(resolve => setTimeout(resolve, 1000));
      onRegister(sampleChannel);
    } catch (err) {
      setError('채널 정보를 가져오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (channelInfo) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        🎥 유튜브 채널 등록
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            채널 URL 또는 핸들(@) 입력
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="예) https://youtube.com/@ucracreator 또는 @ucracreator"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className={`w-full py-3 rounded-lg font-medium text-white transition-colors
            ${loading || !inputValue.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {loading ? '채널 정보 가져오는 중...' : '채널 등록하기'}
        </button>
      </form>
    </motion.div>
  );
}; 
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaYoutube } from 'react-icons/fa';

const ChannelRegisterCard = ({ onChannelRegister }) => {
  const [channelInput, setChannelInput] = useState('');
  const [channelInfo, setChannelInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChannelSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement actual YouTube API call
      const mockChannelInfo = {
        id: 'UC123456789',
        title: '샘플 채널',
        description: '채널 설명입니다.',
        thumbnailUrl: 'https://via.placeholder.com/150',
        subscriberCount: '1.2M',
        videoCount: '150'
      };
      
      setChannelInfo(mockChannelInfo);
      onChannelRegister?.(mockChannelInfo);
    } catch (err) {
      setError('채널 정보를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 mb-6"
    >
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FaYoutube className="text-red-600" />
        유튜브 채널 등록
      </h2>

      <form onSubmit={handleChannelSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder="채널 URL 또는 핸들을 입력하세요"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? '로딩중...' : '등록'}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {channelInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
        >
          <img
            src={channelInfo.thumbnailUrl}
            alt={channelInfo.title}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h3 className="font-bold text-lg">{channelInfo.title}</h3>
            <p className="text-gray-600 text-sm">{channelInfo.description}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>구독자 {channelInfo.subscriberCount}</span>
              <span>동영상 {channelInfo.videoCount}개</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChannelRegisterCard; 
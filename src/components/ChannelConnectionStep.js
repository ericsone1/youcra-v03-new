import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaYoutube } from 'react-icons/fa';
import { FiSettings } from 'react-icons/fi';

const ChannelConnectionStep = ({
  channelConnected,
  channelUrl,
  setChannelUrl,
  channelLoading,
  channelError,
  handleChannelConnect,
  channelInfo,
  handleAvatarError,
  formatViewCount,
  handleChannelEdit,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const manageBtnRef = useRef(null);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white rounded-2xl p-6 mx-4 shadow-lg mb-6"
      >
        <div className="text-center mb-6">
          <FaYoutube className="text-red-500 text-4xl mx-auto mb-2" />
          <h2 className="text-xl font-bold text-gray-800">유튜브 채널 연동</h2>
          <p className="text-gray-600 text-sm mt-2">
            내 채널을 연동하고 시청받을 영상을 선택하세요
          </p>
        </div>

        {(!channelConnected || editMode) ? (
          <div className="space-y-4">
            <input
              type="text"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="유튜브 채널 URL 또는 핸들 입력 (예: @채널명, https://youtube.com/@채널명)"
              className="w-full px-4 py-3 border-2 border-blue-400 rounded-xl focus:border-blue-500 focus:outline-none"
              disabled={channelLoading}
            />
            {channelError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {channelError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await handleChannelConnect();
                  setEditMode(false);
                }}
                disabled={channelLoading || !channelUrl.trim()}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {channelLoading ? '연동 중...' : '채널 등록하기'}
              </button>
              {channelConnected && (
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 border border-blue-500 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
                >취소</button>
              )}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-50 rounded-xl border-2 border-green-200 relative"
          >
            <div className="absolute top-4 right-4">
              <button
                ref={manageBtnRef}
                className="border border-blue-500 text-blue-600 p-2 rounded-full text-xl hover:bg-blue-50 transition-colors flex items-center justify-center"
                onClick={() => setShowManage((v) => !v)}
                title="설정"
                aria-label="설정"
              >
                <FiSettings />
              </button>
              {showManage && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-600"
                    onClick={() => { setEditMode(true); setShowManage(false); }}
                  >채널 수정</button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-500"
                    onClick={() => { setShowManage(false); if (typeof handleChannelEdit === 'function') { handleChannelEdit(); setEditMode(false); } }}
                  >채널 삭제</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mb-3">
              <img
                src={channelInfo?.avatar}
                alt="채널"
                className="w-16 h-16 rounded-full object-cover"
                onError={handleAvatarError}
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{channelInfo?.name}</h3>
                <p className="text-gray-500">구독자 {channelInfo?.subscribers}명</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="text-gray-500">업로드 영상</div>
                <div className="font-bold text-lg">{channelInfo?.videoCount?.toLocaleString() || 0}개</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-gray-500">총 조회수</div>
                <div className="font-bold text-lg">{formatViewCount(channelInfo?.viewCount)}</div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default React.memo(ChannelConnectionStep); 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabBar from './MyChannel/BottomTabBar';

/**
 * YouCra 설정 페이지
 * 1. 로컬 스토리지에 설정 저장/로드
 * 2. 토글, 선택, 버튼 형태의 간단한 UI 컴포넌트 제공
 */
function SettingsPage() {
  const navigate = useNavigate();

  // 로컬 스토리지에서 초기값 로드
  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('youcra_settings');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return null;
  };

  const defaultSettings = {
    // 알림
    messageNotification: true,
    inviteNotification: true,
    videoNotification: false,
    browserNotification: true,
    // 채팅
    fontSize: 'medium',
    theme: 'light',
    autoDownload: true,
    messagePreview: true,
    // YouTube
    autoPlay: true,
    subscribeNotification: false,
  };

  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    ...loadSettings(),
  }));

  // 저장
  useEffect(() => {
    localStorage.setItem('youcra_settings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  /* ----------  기본적인 서브 컴포넌트 ---------- */
  const SectionHeader = ({ children }) => (
    <div className="px-4 py-3 bg-gray-100">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
        {children}
      </h2>
    </div>
  );

  const SettingToggle = ({ label, description, settingKey, icon }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 px-4">
      <div className="flex items-center space-x-3">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="font-medium text-gray-800">{label}</div>
          {description && (
            <div className="text-sm text-gray-500">{description}</div>
          )}
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={settings[settingKey]}
          onChange={(e) => handleSettingChange(settingKey, e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
      </label>
    </div>
  );

  const SettingSelect = ({ label, settingKey, options, icon }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 px-4">
      <div className="flex items-center space-x-3">
        <span className="text-xl">{icon}</span>
        <div className="font-medium text-gray-800">{label}</div>
      </div>
      <select
        value={settings[settingKey]}
        onChange={(e) => handleSettingChange(settingKey, e.target.value)}
        className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const SettingButton = ({ label, description, onClick, icon }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center space-x-3 py-4 border-b border-gray-100 px-4 hover:bg-gray-50 transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1 text-left">
        <div className="font-medium text-blue-600">{label}</div>
        {description && (
          <div className="text-sm text-gray-500">{description}</div>
        )}
      </div>
      <svg
        className="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );

  /* ----------  화면 ---------- */
  return (
    <div className="min-h-screen bg-gray-50 pb-32 max-w-md mx-auto">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">설정</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="bg-white mt-2">
        {/* 프로필 */}
        <SectionHeader>프로필 관리</SectionHeader>
        <SettingButton
          icon="👤"
          label="프로필 편집"
          description="프로필 이미지, 닉네임 변경"
          onClick={() => navigate('/my')}
        />

        {/* 알림 설정 */}
        <SectionHeader>알림 설정</SectionHeader>
        <SettingToggle
          icon="💬"
          label="새 메시지 알림"
          settingKey="messageNotification"
          description="채팅방 새 메시지 알림"
        />
        <SettingToggle
          icon="📧"
          label="채팅방 초대 알림"
          settingKey="inviteNotification"
          description="채팅방 초대 시 알림"
        />
        <SettingToggle
          icon="📺"
          label="YouTube 영상 알림"
          settingKey="videoNotification"
          description="공유된 YouTube 영상 알림"
        />
        <SettingToggle
          icon="🌐"
          label="브라우저 푸시 알림"
          settingKey="browserNotification"
        />

        {/* 채팅 설정 */}
        <SectionHeader>채팅 설정</SectionHeader>
        <SettingSelect
          icon="🔤"
          label="글꼴 크기"
          settingKey="fontSize"
          options={[
            { value: 'small', label: '작게' },
            { value: 'medium', label: '보통' },
            { value: 'large', label: '크게' },
          ]}
        />
        <SettingSelect
          icon="🎨"
          label="테마"
          settingKey="theme"
          options={[
            { value: 'light', label: '라이트' },
            { value: 'dark', label: '다크' },
          ]}
        />
        <SettingToggle
          icon="📷"
          label="이미지 자동 다운로드"
          settingKey="autoDownload"
        />
        <SettingToggle
          icon="👁️"
          label="메시지 미리보기"
          settingKey="messagePreview"
        />

        {/* YouTube 설정 */}
        <SectionHeader>YouTube 연동</SectionHeader>
        <SettingToggle
          icon="▶️"
          label="영상 자동재생"
          settingKey="autoPlay"
        />
        <SettingToggle
          icon="🔔"
          label="구독 알림"
          settingKey="subscribeNotification"
        />
        <SettingButton
          icon="🔗"
          label="채널 연결 관리"
          onClick={() => navigate('/my/youtube-channel')}
        />
      </div>

      <BottomTabBar />
    </div>
  );
}

export default SettingsPage;
 
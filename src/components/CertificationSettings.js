import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roomIdFromParam } from '../utils/route';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

function CertificationSettings() {
  const navigate = useNavigate();
  const { roomId: rawRoomId } = useParams();
  const roomId = roomIdFromParam(rawRoomId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    watchRule: 'full', // full | 3min
    badgeColor: '#3b82f6',
  });

  // Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const roomRef = doc(db, 'chatRooms', roomId);
        const snap = await getDoc(roomRef);
        if (snap.exists() && snap.data().certSettings) {
          const loaded = snap.data().certSettings;
          setSettings(prev => ({ ...prev, ...loaded }));
        }
      } catch (err) {
        console.error('Failed to load cert settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [roomId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const roomRef = doc(db, 'chatRooms', roomId);
      // create doc if not exist
      await setDoc(roomRef, { certSettings: settings }, { merge: true });
      alert('설정이 저장되었습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative">
      {/* 헤더 */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-between px-4 py-3 border-b z-30 bg-white">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-blue-600">
          ←
        </button>
        <div className="flex-1 text-center font-bold text-lg">시청인증 설정</div>
        <div className="w-8" />
      </header>

      {/* 컨텐츠 */}
      <main className="flex-1 px-4 pt-20 pb-8 overflow-y-auto space-y-6">
        {/* 활성화 토글 */}
        <section className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium">시청인증 사용</span>
          <label className="inline-flex relative items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked })} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-full transition-transform"></div>
          </label>
        </section>

        {/* 시청 시간 규칙 */}
        <section className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h2 className="font-medium mb-1">시청 시간</h2>
          <select
            className="w-full border rounded px-3 py-2"
            value={settings.watchRule}
            onChange={e => setSettings({ ...settings, watchRule: e.target.value })}
          >
            <option value="full">영상 끝까지 시청</option>
            <option value="3min">3분 이상 시청</option>
          </select>
        </section>

        {/* 배지 색상 */}
        <section className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h2 className="font-medium mb-1">인증 뱃지 색상</h2>
          <input
            type="color"
            className="w-full h-10 rounded"
            value={settings.badgeColor}
            onChange={e => setSettings({ ...settings, badgeColor: e.target.value })}
          />
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </main>
    </div>
  );
}

export default CertificationSettings; 
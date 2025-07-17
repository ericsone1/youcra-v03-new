import React, { useEffect, useState } from 'react';
import { getAllVideos, deleteVideoByDocPath } from '../services/videoService';

function AdminVideoCleanup() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const list = await getAllVideos();
      setVideos(list);
      setLoading(false);
    };
    load();
  }, []);

  const handleDelete = async (docPath) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    setDeleting((prev) => ({ ...prev, [docPath]: true }));
    await deleteVideoByDocPath(docPath);
    setVideos((prev) => prev.filter((v) => v.docPath !== docPath));
    setDeleting((prev) => ({ ...prev, [docPath]: false }));
  };

  if (loading) return <div className="p-4">로딩 중...</div>;

  return (
    <div className="p-4 space-y-3">
      {/* 가로 스크롤 가능하도록 래퍼 추가 */}
      <div className="overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">전체 영상 관리 ({videos.length})</h2>
      <table className="w-full text-sm border table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 w-24">썸네일</th>
            <th className="border p-1 max-w-sm">제목</th>
            <th className="border p-1 w-16">관리</th>
          </tr>
        </thead>
        <tbody>
          {videos.map(({ roomId, docPath, data }) => (
            <tr key={docPath} className="border-b hover:bg-gray-50" title={`roomId: ${roomId}\nvideoId: ${data.videoId}`}>
              <td className="border p-1 w-24">
                <img src={data.thumbnail || data.snippet?.thumbnails?.default?.url} alt="thumb" className="w-20 h-12 object-cover" />
              </td>
              <td className="border p-1 max-w-sm truncate" title={data.title || data.snippet?.title}>
                {(() => {
                  const full = data.title || data.snippet?.title || '';
                  return full.length > 7 ? full.slice(0, 7) + '...' : full;
                })()}
              </td>
              <td className="border p-1 text-center">
                <button
                  disabled={deleting[docPath]}
                  onClick={() => handleDelete(docPath)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-xs"
                >
                  {deleting[docPath] ? '삭제 중' : '삭제'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export default AdminVideoCleanup; 
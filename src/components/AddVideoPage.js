import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVideo } from "../hooks/useVideo";

function AddVideoPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const {
    videoUrl,
    setVideoUrl,
    videoMeta,
    videoLoading,
    videoMsg,
    handleRegister
  } = useVideo(roomId);

  const handleSubmit = async () => {
    const success = await handleRegister();
    if (success) {
      setTimeout(() => navigate(-1), 1000);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mt-8">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="mr-2 text-lg text-gray-500">←</button>
        <div className="font-bold text-lg flex-1">내 영상 등록하기</div>
      </div>
      <div className="flex gap-2 items-center mb-2">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1"
          placeholder="유튜브 영상 링크를 입력하세요"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          disabled={videoLoading}
        />
      </div>
      {videoMsg && (
        <div className={`text-sm ${videoMsg === "영상이 등록되었습니다!" ? "text-green-500" : "text-red-500"} mb-2`}>
          {videoMsg}
        </div>
      )}
      {videoMeta && videoMsg !== "이미 등록된 영상입니다." && (
        <div className="flex items-center gap-2 mb-2">
          <img src={videoMeta.thumbnail} alt="썸네일" className="w-24 h-14 rounded" />
          <div>
            <div className="font-bold">{videoMeta.title}</div>
            <div className="text-xs text-gray-500">{videoMeta.channel}</div>
            <div className="text-xs text-gray-500">길이: {videoMeta.duration}초</div>
          </div>
          <button
            className="bg-green-500 text-white px-3 py-1 rounded ml-2"
            onClick={handleSubmit}
            disabled={videoLoading}
          >
            등록
          </button>
        </div>
      )}
    </div>
  );
}

export default AddVideoPage;

// src/components/Report.js
import React from "react";

function Report() {
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">🔥 인기 콘텐츠 리포트</h2>
      <p>여기에 유튜브 인기 영상 리스트, 썸네일, 제목, 조회수, 좋아요, 업로드일, 인증순위 등이 표시될 예정입니다.</p>
      <div className="mt-6 text-gray-500">
        <p>※ 실제 데이터 연동은 추후에 구현할 예정입니다.</p>
      </div>
    </div>
  );
}

export default Report;
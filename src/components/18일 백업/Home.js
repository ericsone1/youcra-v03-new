import React from "react";

function Home() {
  // 예시 데이터 (실제 데이터 연동은 추후에!)
  const notices = [
    { id: 1, text: "유크라앱 베타 오픈! 많은 피드백 부탁드립니다." },
    { id: 2, text: "인기 리포트, 채팅방 등 다양한 기능이 곧 추가됩니다." },
  ];
  const recentActivities = [
    { id: 1, activity: "ericsone4nd@gmail.com 님이 회원가입했습니다." },
    { id: 2, activity: "111@naver.com 님이 인기 리포트 탭을 방문했습니다." },
  ];

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">🏠 홈</h2>
      <p className="mb-6">유크라앱에 오신 것을 환영합니다!</p>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">📢 공지사항</h3>
        <ul className="list-disc pl-5 text-gray-700">
          {notices.map((notice) => (
            <li key={notice.id}>{notice.text}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">🕒 최근 활동</h3>
        <ul className="list-disc pl-5 text-gray-700">
          {recentActivities.map((item) => (
            <li key={item.id}>{item.activity}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Home;
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

function ChatRoomManage() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen rounded-2xl shadow p-0">
      {/* 상단바 */}
      <div className="flex items-center p-4 border-b">
        <button onClick={() => navigate(-1)} className="mr-2 text-lg text-gray-500">←</button>
        <div className="font-bold text-lg flex-1 text-center">오픈채팅방 관리</div>
      </div>
      <div className="p-4 flex flex-col gap-6">
        {/* 기본 정보 관리 */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="방 프로필" className="w-14 h-14 rounded-lg object-cover" />
            <div>
              <div className="font-bold text-base">맛집,먹방 유튜브 맞구톡방</div>
              <div className="text-xs text-gray-500">그룹채팅 · 자유수다</div>
            </div>
            <button className="ml-auto text-blue-500 text-sm font-bold">편집</button>
          </div>
        </section>
        {/* 기능 스위치/설정 */}
        <section className="flex flex-col gap-2">
          <SwitchItem label="검색 허용" defaultChecked />
        </section>
        {/* 멤버 및 권한 관리 */}
        <section className="flex flex-col gap-2">
          <SwitchItem label="부방장 지정/해제" />
          <SwitchItem label="방장 변경" />
          {/* 관리자만 말하기, 보이스룸 멤버 개설 허용 제외 */}
          <SwitchItem label="채팅방 멤버 전체 멘션" />
          <SwitchItem label="내보내기 해제" />
        </section>
        {/* 채팅방 기능 관리 */}
        <section className="flex flex-col gap-2">
          <SwitchItem label="신고된 정책 위반 메시지 가리기" />
          <SwitchItem label="링크 열람 허용" defaultChecked />
        </section>
        {/* 참여 관리 */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between py-2">
            <span>최대 인원 수</span>
            <span className="font-bold">100</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>참여 코드</span>
            <span className="font-bold text-gray-400">OFF</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>참여 프로필</span>
            <span className="font-bold text-gray-400">모든 프로필</span>
          </div>
        </section>
        {/* 링크/QR */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between py-2">
            <span>참여 링크</span>
            <a href="https://open.kakao.com/o/gyl6mevh" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm">https://open.kakao.com/o/gyl6mevh</a>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>QR 코드</span>
            <span className="bg-gray-200 rounded px-3 py-1 text-xs text-gray-500">(준비중)</span>
          </div>
        </section>
        {/* 방 삭제/나가기 */}
        <section className="mt-6">
          <button className="w-full bg-red-500 text-white py-3 rounded font-bold hover:bg-red-600">채팅방 삭제 및 나가기</button>
        </section>
      </div>
    </div>
  );
}

function SwitchItem({ label, defaultChecked }) {
  const [checked, setChecked] = React.useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between py-2">
      <span>{label}</span>
      <button
        className={`w-10 h-6 rounded-full border transition-colors duration-200 ${checked ? 'bg-yellow-400 border-yellow-400' : 'bg-gray-200 border-gray-300'}`}
        onClick={() => setChecked(v => !v)}
        style={{ position: 'relative' }}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow absolute top-0.5 left-0.5 transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
    </div>
  );
}

export default ChatRoomManage; 
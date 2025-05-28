import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";

function DMChatRoom() {
  const { uid } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // 메시지 전송
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { text: input, mine: true, time: new Date() }]);
    setInput("");
  };

  // 엔터로 전송
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend(e);
    }
  };

  // 스크롤 항상 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-blue-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-0 flex flex-col">
        {/* 상단 바 */}
        <div className="flex items-center justify-between px-4 py-3 border-b rounded-t-2xl bg-yellow-300">
          <div className="font-bold text-lg text-gray-800">1:1 채팅</div>
        </div>
        {/* 채팅 메시지 영역 */}
        <div className="flex-1 px-4 py-6 overflow-y-auto" style={{ minHeight: 300 }}>
          <div className="flex flex-col gap-2">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 items-center text-gray-400 text-sm">
                <div>여기에 1:1 채팅 메시지가 표시됩니다.</div>
                <div className="text-xs text-gray-300">상대방 UID: {uid}</div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs ${
                    msg.mine
                      ? "bg-yellow-300 text-gray-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {/* 입력창 */}
        <form
          className="flex items-center px-4 py-3 border-t bg-gray-50 rounded-b-2xl"
          onSubmit={handleSend}
        >
          <input
            type="text"
            className="flex-1 border rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            placeholder="메시지 입력"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            className="bg-yellow-400 text-white font-bold px-4 py-2 rounded-full"
            type="submit"
            disabled={!input.trim()}
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
}

export default DMChatRoom;
"use client";

import { useState } from "react";
import Link from "next/link";

// 픽셀 별 아바타 (상대방)
const PixelStarAvatar = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="7" y="1" width="2" height="2" fill="var(--yellow)" />
    <rect x="6" y="3" width="4" height="2" fill="var(--yellow)" />
    <rect x="2" y="5" width="12" height="2" fill="var(--yellow)" />
    <rect x="3" y="7" width="10" height="2" fill="var(--yellow)" />
    <rect x="4" y="9" width="8" height="2" fill="var(--yellow)" />
    <rect x="3" y="11" width="4" height="2" fill="var(--yellow)" />
    <rect x="9" y="11" width="4" height="2" fill="var(--yellow)" />
    <rect x="2" y="13" width="3" height="2" fill="var(--yellow)" />
    <rect x="11" y="13" width="3" height="2" fill="var(--yellow)" />
    <rect x="7" y="2" width="1" height="1" fill="#FFF8DC" />
    <rect x="7" y="5" width="2" height="1" fill="#FFF8DC" />
  </svg>
);

// 픽셀 뒤로가기 화살표
const PixelBackArrow = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="6" y="3" width="1" height="1" fill="var(--text)" />
    <rect x="5" y="4" width="1" height="1" fill="var(--text)" />
    <rect x="4" y="5" width="1" height="1" fill="var(--text)" />
    <rect x="3" y="6" width="1" height="1" fill="var(--text)" />
    <rect x="2" y="7" width="1" height="1" fill="var(--text)" />
    <rect x="3" y="8" width="1" height="1" fill="var(--text)" />
    <rect x="4" y="9" width="1" height="1" fill="var(--text)" />
    <rect x="5" y="10" width="1" height="1" fill="var(--text)" />
    <rect x="6" y="11" width="1" height="1" fill="var(--text)" />
    <rect x="3" y="7" width="10" height="1" fill="var(--text)" />
  </svg>
);


// 목업 데이터
const mockChat = {
  partner: {
    nickname: "별빛",
    isAI: false,
  },
  remainingMessages: 2,
  maxMessages: 2,
  messages: [
    {
      id: 1,
      sender: "partner",
      text: "안녕하세요. 오늘 피로감이 느껴지신다고 들었어요.",
      time: "오후 9:32",
    },
    {
      id: 2,
      sender: "me",
      text: "네, 요즘 퇴근하면 아무것도 하기 싫어요.",
      time: "오후 9:35",
    },
    {
      id: 3,
      sender: "partner",
      text: "저도 그래요. 그냥 멍하니 있고 싶을 때가 많아요.",
      time: "오후 9:38",
    },
  ],
};

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [hasSentMessage, setHasSentMessage] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      setHasSentMessage(true);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* 상단 헤더 */}
      <header className="bg-[var(--bg2)] border-b border-[var(--bg3)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/connect" className="p-1">
              <PixelBackArrow size={24} />
            </Link>
            <div className="flex items-center gap-2">
              <PixelStarAvatar size={32} />
              <div className="flex items-center gap-2">
                <span className="text-[var(--text)]">{mockChat.partner.nickname}</span>
                {mockChat.partner.isAI && (
                  <span className="bg-[var(--accent)] text-[var(--bg)] text-[8px] px-1 rounded">
                    AI
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-[var(--muted)] text-xs">
            {mockChat.remainingMessages}/{mockChat.maxMessages} 남음
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="text-[var(--muted)] text-[10px] text-center mt-2">
          대화 후 기록은 사라져요. 내 말만 보관함에 남아요.
        </p>
      </header>

      {/* 대화 내용 */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {mockChat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] ${
                  msg.sender === "me"
                    ? "bg-[var(--accent2)] text-[var(--text)]"
                    : "bg-[var(--bg2)] text-[var(--text)] border border-[var(--bg3)]"
                }`}
                style={{
                  padding: "10px 14px",
                  clipPath: msg.sender === "me"
                    ? "polygon(0 4px, 4px 4px, 4px 0, calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px))"
                    : "polygon(0 4px, 4px 4px, 4px 0, calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px))",
                }}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.sender === "me" ? "text-[var(--text)] opacity-60" : "text-[var(--muted)]"
                }`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 다음 메시지 안내 */}
        {hasSentMessage && (
          <div className="mt-6 text-center">
            <p className="text-[var(--muted)] text-xs">
              2시간 후 다음 메시지를 보낼 수 있어요
            </p>
          </div>
        )}
      </main>

      {/* 입력 영역 */}
      <footer className="bg-[var(--bg2)] border-t border-[var(--bg3)] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-[var(--bg)] border border-[var(--bg3)] px-4 py-3 text-[var(--text)] placeholder-[var(--muted)] text-sm focus:outline-none focus:border-[var(--accent)]"
            style={{ fontFamily: "'DotGothic16', monospace" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`px-4 py-3 bg-[var(--accent)] text-[var(--bg)] text-sm font-bold ${
              !message.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--accent2)]"
            }`}
            style={{
              boxShadow: message.trim() ? "3px 3px 0 var(--accent2)" : "none",
              fontFamily: "'DotGothic16', monospace",
            }}
          >
            전송
          </button>
        </div>
      </footer>
    </div>
  );
}

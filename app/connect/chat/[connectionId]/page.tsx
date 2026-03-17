"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import {
  getConnection,
  sendMessage,
} from "@/lib/firestore";
import { Connection, Message } from "@/types";

// 픽셀 별 아바타 (사람 상대방)
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

// 픽셀 로봇 아바타 (AI 상대방)
const PixelRobotAvatar = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="7" y="1" width="2" height="1" fill="var(--accent)" />
    <rect x="7" y="2" width="2" height="1" fill="var(--accent)" />
    <rect x="4" y="3" width="8" height="1" fill="var(--accent)" />
    <rect x="3" y="4" width="10" height="1" fill="var(--accent)" />
    <rect x="3" y="5" width="10" height="1" fill="var(--accent)" />
    <rect x="3" y="6" width="10" height="1" fill="var(--accent)" />
    <rect x="4" y="7" width="8" height="1" fill="var(--accent)" />
    <rect x="5" y="5" width="2" height="1" fill="var(--bg)" />
    <rect x="9" y="5" width="2" height="1" fill="var(--bg)" />
    <rect x="5" y="8" width="6" height="1" fill="var(--accent)" />
    <rect x="4" y="9" width="8" height="1" fill="var(--accent)" />
    <rect x="4" y="10" width="8" height="1" fill="var(--accent)" />
    <rect x="4" y="11" width="8" height="1" fill="var(--accent)" />
    <rect x="5" y="12" width="6" height="1" fill="var(--accent)" />
    <rect x="5" y="13" width="2" height="2" fill="var(--accent)" />
    <rect x="9" y="13" width="2" height="2" fill="var(--accent)" />
    <rect x="7" y="10" width="2" height="1" fill="var(--yellow)" />
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

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const connectionId = params.connectionId as string;

  const [user, setUser] = useState<User | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myMessageCount, setMyMessageCount] = useState(0);
  const [canSend, setCanSend] = useState(true);
  const [cooldownText, setCooldownText] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setUser(currentUser);
    });
    return () => unsub();
  }, [router]);

  // 연결 정보 로드
  useEffect(() => {
    if (!user || !connectionId) return;

    const loadConnection = async () => {
      const conn = await getConnection(connectionId);
      if (!conn) {
        router.replace("/connect");
        return;
      }
      setConnection(conn);
      setLoading(false);
    };

    loadConnection();
  }, [user, connectionId, router]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!connectionId) return;

    const q = query(
      collection(db, "connections", connectionId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Message[];
        setMessages(msgs);
      },
      () => {
        // 인덱스 에러 시 orderBy 없이 재시도
        const qSimple = collection(db, "connections", connectionId, "messages");
        onSnapshot(qSimple, (snapshot) => {
          const msgs = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Message[];
          msgs.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
          setMessages(msgs);
        });
      }
    );

    return () => unsub();
  }, [connectionId]);

  // 메시지 수 및 전송 가능 여부 업데이트
  useEffect(() => {
    if (!user) return;

    const myMsgs = messages.filter((m) => m.senderId === user.uid);
    setMyMessageCount(myMsgs.length);

    if (myMsgs.length >= 2) {
      setCanSend(false);
      setCooldownText("오늘의 메시지를 모두 보냈어요");
      return;
    }

    if (myMsgs.length > 0) {
      const last = myMsgs[myMsgs.length - 1];
      const lastDate = last.createdAt?.toDate();
      if (lastDate) {
        setLastSentAt(lastDate);
      }
    } else {
      setLastSentAt(null);
      setCanSend(true);
      setCooldownText(null);
    }
  }, [messages, user]);

  // 2시간 쿨다운 타이머
  useEffect(() => {
    if (!lastSentAt || myMessageCount >= 2) return;

    const check = () => {
      const now = Date.now();
      const elapsed = now - lastSentAt.getTime();
      const remaining = 1 * 60 * 60 * 1000 - elapsed;

      if (remaining <= 0) {
        setCanSend(true);
        setCooldownText(null);
      } else {
        setCanSend(false);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
        setCooldownText(
          `${hours}시간 ${minutes}분 ${seconds}초 후 전송 가능`
        );
      }
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [lastSentAt, myMessageCount]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !message.trim() || !canSend || sending) return;

    const content = message.trim();
    setMessage("");
    setSending(true);

    try {
      // 유저 메시지 저장
      await sendMessage(connectionId, user.uid, content);

      // AI 연결이면 AI 응답 생성
      if (connection?.isAI) {
        const chatHistory = [
          ...messages.map((m) => ({
            role: m.senderId === user.uid ? "user" : "assistant",
            content: m.content,
          })),
          { role: "user", content },
        ];

        const response = await fetch("/api/connect/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: chatHistory,
            emotion: connection.emotionTags?.[0] || "",
            userRecord: "",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          await sendMessage(connectionId, "ai", data.content);
        }
      }
    } catch (error) {
      console.error("[Chat] 전송 에러:", error);
    } finally {
      setSending(false);
    }
  };

  // 상대방 정보 결정
  const isUser1 = user && connection?.user1Id === user.uid;
  const partnerNickname = connection
    ? connection.isAI
      ? "달빛"
      : isUser1
        ? connection.user2Nickname
        : connection.user1Nickname
    : "";
  const maxMessages = 2;

  if (loading || !connection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-[var(--muted)]">로딩 중...</div>
      </div>
    );
  }

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
              {connection.isAI ? (
                <PixelRobotAvatar size={32} />
              ) : (
                <PixelStarAvatar size={32} />
              )}
              <div className="flex items-center gap-2">
                <span className="text-[var(--text)]">{partnerNickname}</span>
                {connection.isAI && (
                  <span className="bg-[var(--accent)] text-[var(--bg)] text-[8px] px-1 rounded">
                    AI
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-[var(--muted)] text-xs">
            {maxMessages - myMessageCount}/{maxMessages} 남음
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="text-[var(--muted)] text-[10px] text-center mt-2">
          {connection.isAI
            ? "AI와의 대화예요"
            : "대화 후 기록은 사라져요. 내 말만 보관함에 남아요."}
        </p>
      </header>

      {/* 대화 내용 */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] ${
                    isMe
                      ? "bg-[var(--accent2)] text-[var(--text)]"
                      : "bg-[var(--bg2)] text-[var(--text)] border border-[var(--bg3)]"
                  }`}
                  style={{ padding: "10px 14px" }}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe
                        ? "text-[var(--text)] opacity-60"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {msg.createdAt?.toDate?.()
                      ? msg.createdAt.toDate().toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 쿨다운 안내 */}
        {cooldownText && (
          <div className="mt-6 text-center">
            <p className="text-[var(--muted)] text-xs">{cooldownText}</p>
          </div>
        )}

        {/* 빈 상태 */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-[var(--muted)] text-sm">
              첫 메시지를 보내보세요
            </p>
          </div>
        )}
      </main>

      {/* 입력 영역 */}
      <footer className="bg-[var(--bg2)] border-t border-[var(--bg3)] p-4">
        {myMessageCount >= maxMessages ? (
          <p className="text-[var(--muted)] text-sm text-center">
            오늘의 대화가 끝났어요
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                canSend
                  ? "메시지를 입력하세요..."
                  : "아직 메시지를 보낼 수 없어요"
              }
              disabled={!canSend || sending}
              className="flex-1 bg-[var(--bg)] border border-[var(--bg3)] px-4 py-3 text-[var(--text)] placeholder-[var(--muted)] text-sm focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
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
              disabled={!message.trim() || !canSend || sending}
              className={`px-4 py-3 bg-[var(--accent)] text-[var(--bg)] text-sm font-bold ${
                !message.trim() || !canSend || sending
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[var(--accent2)]"
              }`}
              style={{
                boxShadow:
                  message.trim() && canSend
                    ? "3px 3px 0 var(--accent2)"
                    : "none",
                fontFamily: "'DotGothic16', monospace",
              }}
            >
              {sending ? "..." : "전송"}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

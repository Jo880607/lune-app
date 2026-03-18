"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  findMatch,
  getTodayConnection,
  getWeeklyAnalysis,
  getCurrentWeekKey,
} from "@/lib/firestore";

type ConnectionType = "human" | "ai" | "any" | null;

// 픽셀 아트 아이콘 컴포넌트들 (16x16 그리드)
const PixelMoonIcon = ({ size = 24, color = "var(--yellow)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    {/* 초승달 (🌙 방향 - 오른쪽 볼록) */}
    <rect x="9" y="2" width="3" height="1" fill={color} />
    <rect x="8" y="3" width="2" height="1" fill={color} />
    <rect x="11" y="3" width="2" height="1" fill={color} />
    <rect x="7" y="4" width="2" height="1" fill={color} />
    <rect x="12" y="4" width="2" height="1" fill={color} />
    <rect x="6" y="5" width="2" height="1" fill={color} />
    <rect x="13" y="5" width="1" height="1" fill={color} />
    <rect x="5" y="6" width="2" height="1" fill={color} />
    <rect x="13" y="6" width="1" height="1" fill={color} />
    <rect x="5" y="7" width="2" height="1" fill={color} />
    <rect x="13" y="7" width="1" height="1" fill={color} />
    <rect x="5" y="8" width="2" height="1" fill={color} />
    <rect x="13" y="8" width="1" height="1" fill={color} />
    <rect x="5" y="9" width="2" height="1" fill={color} />
    <rect x="13" y="9" width="1" height="1" fill={color} />
    <rect x="6" y="10" width="2" height="1" fill={color} />
    <rect x="13" y="10" width="1" height="1" fill={color} />
    <rect x="7" y="11" width="2" height="1" fill={color} />
    <rect x="12" y="11" width="2" height="1" fill={color} />
    <rect x="8" y="12" width="2" height="1" fill={color} />
    <rect x="11" y="12" width="2" height="1" fill={color} />
    <rect x="9" y="13" width="3" height="1" fill={color} />
  </svg>
);

const PixelNoteIcon = ({ size = 24, color = "var(--accent)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="3" y="1" width="1" height="1" fill={color} />
    <rect x="4" y="1" width="1" height="1" fill={color} />
    <rect x="5" y="1" width="1" height="1" fill={color} />
    <rect x="6" y="1" width="1" height="1" fill={color} />
    <rect x="7" y="1" width="1" height="1" fill={color} />
    <rect x="8" y="1" width="1" height="1" fill={color} />
    <rect x="9" y="1" width="1" height="1" fill={color} />
    <rect x="10" y="1" width="1" height="1" fill={color} />
    <rect x="2" y="2" width="1" height="1" fill={color} />
    <rect x="11" y="2" width="1" height="1" fill={color} />
    <rect x="2" y="3" width="1" height="1" fill={color} />
    <rect x="12" y="3" width="1" height="1" fill={color} />
    <rect x="2" y="4" width="1" height="1" fill={color} />
    <rect x="12" y="4" width="1" height="1" fill={color} />
    <rect x="2" y="5" width="1" height="1" fill={color} />
    <rect x="12" y="5" width="1" height="1" fill={color} />
    <rect x="2" y="6" width="1" height="1" fill={color} />
    <rect x="12" y="6" width="1" height="1" fill={color} />
    <rect x="2" y="7" width="1" height="1" fill={color} />
    <rect x="12" y="7" width="1" height="1" fill={color} />
    <rect x="2" y="8" width="1" height="1" fill={color} />
    <rect x="12" y="8" width="1" height="1" fill={color} />
    <rect x="2" y="9" width="1" height="1" fill={color} />
    <rect x="12" y="9" width="1" height="1" fill={color} />
    <rect x="2" y="10" width="1" height="1" fill={color} />
    <rect x="12" y="10" width="1" height="1" fill={color} />
    <rect x="2" y="11" width="1" height="1" fill={color} />
    <rect x="12" y="11" width="1" height="1" fill={color} />
    <rect x="2" y="12" width="1" height="1" fill={color} />
    <rect x="12" y="12" width="1" height="1" fill={color} />
    <rect x="3" y="13" width="1" height="1" fill={color} />
    <rect x="4" y="13" width="1" height="1" fill={color} />
    <rect x="5" y="13" width="1" height="1" fill={color} />
    <rect x="6" y="13" width="1" height="1" fill={color} />
    <rect x="7" y="13" width="1" height="1" fill={color} />
    <rect x="8" y="13" width="1" height="1" fill={color} />
    <rect x="9" y="13" width="1" height="1" fill={color} />
    <rect x="10" y="13" width="1" height="1" fill={color} />
    <rect x="11" y="13" width="1" height="1" fill={color} />
    <rect x="10" y="2" width="1" height="1" fill={color} />
    <rect x="11" y="3" width="1" height="1" fill={color} />
    <rect x="4" y="5" width="1" height="1" fill={color} />
    <rect x="5" y="5" width="1" height="1" fill={color} />
    <rect x="6" y="5" width="1" height="1" fill={color} />
    <rect x="7" y="5" width="1" height="1" fill={color} />
    <rect x="8" y="5" width="1" height="1" fill={color} />
    <rect x="9" y="5" width="1" height="1" fill={color} />
    <rect x="10" y="5" width="1" height="1" fill={color} />
    <rect x="4" y="7" width="1" height="1" fill={color} />
    <rect x="5" y="7" width="1" height="1" fill={color} />
    <rect x="6" y="7" width="1" height="1" fill={color} />
    <rect x="7" y="7" width="1" height="1" fill={color} />
    <rect x="8" y="7" width="1" height="1" fill={color} />
    <rect x="9" y="7" width="1" height="1" fill={color} />
    <rect x="10" y="7" width="1" height="1" fill={color} />
    <rect x="4" y="9" width="1" height="1" fill={color} />
    <rect x="5" y="9" width="1" height="1" fill={color} />
    <rect x="6" y="9" width="1" height="1" fill={color} />
    <rect x="7" y="9" width="1" height="1" fill={color} />
    <rect x="8" y="9" width="1" height="1" fill={color} />
  </svg>
);

const PixelSparkleIcon = ({ size = 24, color = "var(--yellow)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="7" y="2" width="1" height="1" fill={color} />
    <rect x="7" y="3" width="1" height="1" fill={color} />
    <rect x="7" y="4" width="1" height="1" fill={color} />
    <rect x="7" y="5" width="1" height="1" fill={color} />
    <rect x="7" y="6" width="1" height="1" fill={color} />
    <rect x="7" y="7" width="1" height="1" fill={color} />
    <rect x="7" y="8" width="1" height="1" fill={color} />
    <rect x="7" y="9" width="1" height="1" fill={color} />
    <rect x="7" y="10" width="1" height="1" fill={color} />
    <rect x="7" y="11" width="1" height="1" fill={color} />
    <rect x="7" y="12" width="1" height="1" fill={color} />
    <rect x="2" y="7" width="1" height="1" fill={color} />
    <rect x="3" y="7" width="1" height="1" fill={color} />
    <rect x="4" y="7" width="1" height="1" fill={color} />
    <rect x="5" y="7" width="1" height="1" fill={color} />
    <rect x="6" y="7" width="1" height="1" fill={color} />
    <rect x="8" y="7" width="1" height="1" fill={color} />
    <rect x="9" y="7" width="1" height="1" fill={color} />
    <rect x="10" y="7" width="1" height="1" fill={color} />
    <rect x="11" y="7" width="1" height="1" fill={color} />
    <rect x="12" y="7" width="1" height="1" fill={color} />
    <rect x="4" y="4" width="1" height="1" fill={color} />
    <rect x="5" y="5" width="1" height="1" fill={color} />
    <rect x="9" y="5" width="1" height="1" fill={color} />
    <rect x="10" y="4" width="1" height="1" fill={color} />
    <rect x="5" y="9" width="1" height="1" fill={color} />
    <rect x="4" y="10" width="1" height="1" fill={color} />
    <rect x="9" y="9" width="1" height="1" fill={color} />
    <rect x="10" y="10" width="1" height="1" fill={color} />
  </svg>
);

// 픽셀 아바타: 별 (사람)
const PixelStarAvatar = ({ size = 48 }: { size?: number }) => (
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

// 픽셀 아바타: 로봇 (AI)
const PixelRobotAvatar = ({ size = 48 }: { size?: number }) => (
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

// 픽셀 아바타: 반짝이는 점들 (상관없음)
const PixelDotsAvatar = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="3" y="2" width="2" height="2" fill="var(--yellow)" className="star" />
    <rect x="11" y="3" width="2" height="2" fill="var(--accent)" className="star-delayed" />
    <rect x="7" y="4" width="2" height="2" fill="var(--yellow)" className="star" />
    <rect x="2" y="7" width="2" height="2" fill="var(--accent)" className="star-delayed" />
    <rect x="12" y="8" width="2" height="2" fill="var(--yellow)" className="star" />
    <rect x="5" y="9" width="2" height="2" fill="var(--yellow)" className="star-delayed" />
    <rect x="9" y="10" width="2" height="2" fill="var(--accent)" className="star" />
    <rect x="3" y="12" width="2" height="2" fill="var(--accent)" className="star" />
    <rect x="7" y="13" width="2" height="2" fill="var(--yellow)" className="star-delayed" />
    <rect x="11" y="12" width="2" height="2" fill="var(--yellow)" className="star" />
  </svg>
);

export default function ConnectPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<ConnectionType>(null);
  const [pageState, setPageState] = useState<
    "loading" | "select" | "matching" | "waiting" | "ended"
  >("loading");
  const [waitingConnectionId, setWaitingConnectionId] = useState<string | null>(null);

  // Auth + 오늘 연결 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setUser(currentUser);

      try {
        const todayConn = await getTodayConnection(currentUser.uid);
        if (todayConn) {
          if (todayConn.status === "matched") {
            router.push(`/connect/chat/${todayConn.id}`);
            return;
          } else if (todayConn.status === "waiting") {
            setWaitingConnectionId(todayConn.id!);
            setPageState("waiting");
            return;
          } else if (todayConn.status === "ended") {
            setPageState("ended");
            return;
          }
        }
        setPageState("select");
      } catch (error) {
        console.error("[Connect] 초기화 에러:", error);
        setPageState("select");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 대기 중일 때 실시간 감시
  useEffect(() => {
    if (pageState !== "waiting" || !waitingConnectionId) return;

    const unsub = onSnapshot(
      doc(db, "connections", waitingConnectionId),
      (snap) => {
        const data = snap.data();
        if (data?.status === "matched") {
          router.push(`/connect/chat/${waitingConnectionId}`);
        }
      }
    );

    return () => unsub();
  }, [pageState, waitingConnectionId, router]);

  const handleStartConnection = async () => {
    if (!user || !selected) return;

    setPageState("matching");

    try {
      // 감정 태그 가져오기 (최근 주간 분석에서)
      const weekKey = getCurrentWeekKey();
      const analysis = await getWeeklyAnalysis(user.uid, weekKey);
      const emotionTags = analysis?.emotions || [];

      // 매칭 시작
      const result = await findMatch(user.uid, selected, emotionTags);

      if (result.status === "matched") {
        router.push(`/connect/chat/${result.connectionId}`);
      } else {
        setWaitingConnectionId(result.connectionId);
        setPageState("waiting");
      }
    } catch (error) {
      console.error("[Connect] 매칭 에러:", error);
      setPageState("select");
      alert("연결에 실패했어요. 다시 시도해주세요.");
    }
  };

  // 로딩 중
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-[var(--muted)]">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* 헤더 */}
      <header className="p-6 text-center">
        <h1 className="font-galmuri text-xl text-[var(--accent)]">연결</h1>
        <p className="font-galmuri text-[var(--muted)] text-sm mt-2">
          {pageState === "matching"
            ? "연결 중..."
            : pageState === "waiting"
            ? "상대를 기다리고 있어요..."
            : pageState === "ended"
            ? "오늘의 연결이 끝났어요"
            : "오늘 누구와 이야기할까요?"}
        </p>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 px-6 pb-24">

        {/* 매칭 중 */}
        {pageState === "matching" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-pulse mb-6">
              <PixelSparkleIcon size={64} color="var(--accent)" />
            </div>
            <p className="text-[var(--accent)] text-lg">연결 중...</p>
            <p className="text-[var(--muted)] text-sm mt-2">
              당신과 같은 감정을 느낀 사람을 찾고 있어요
            </p>
          </div>
        )}

        {/* 대기 중 */}
        {pageState === "waiting" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-bounce mb-6" style={{ animationDuration: "2s" }}>
              <PixelStarAvatar size={64} />
            </div>
            <p className="text-[var(--accent)] text-lg">상대를 기다리는 중</p>
            <p className="text-[var(--muted)] text-sm mt-2">
              누군가 연결되면 자동으로 이동해요
            </p>
            <p className="text-[var(--muted)] text-xs mt-4">
              이 페이지에서 기다려주세요
            </p>
          </div>
        )}

        {/* 연결 끝남 */}
        {pageState === "ended" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6">
              <PixelMoonIcon size={64} color="var(--yellow)" />
            </div>
            <p className="text-[var(--accent)] text-lg">오늘의 연결이 끝났어요</p>
            <p className="text-[var(--muted)] text-sm mt-2">
              내일 또 만나요
            </p>
          </div>
        )}

        {/* 선택 UI */}
        {pageState === "select" && (
          <>
            {/* 연결 선택 카드들 */}
            <div className="space-y-4">
              {/* 사람과 대화 */}
              <button
                onClick={() => setSelected("human")}
                className={`w-full p-5 rounded-lg border-2 transition-all flex items-center gap-4 ${
                  selected === "human"
                    ? "border-[var(--accent)] bg-[var(--bg2)] shadow-[4px_4px_0_var(--accent2)]"
                    : "border-[var(--bg3)] bg-[var(--bg2)] hover:border-[var(--muted)]"
                }`}
              >
                <PixelStarAvatar size={48} />
                <div className="text-left">
                  <p className={`text-base ${selected === "human" ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                    사람과 대화할게요
                  </p>
                  <p className="text-[var(--muted)] text-xs mt-1">
                    오늘 기록한 감정으로 매칭돼요
                  </p>
                </div>
              </button>

              {/* AI와 대화 */}
              <button
                onClick={() => setSelected("ai")}
                className={`w-full p-5 rounded-lg border-2 transition-all flex items-center gap-4 ${
                  selected === "ai"
                    ? "border-[var(--accent)] bg-[var(--bg2)] shadow-[4px_4px_0_var(--accent2)]"
                    : "border-[var(--bg3)] bg-[var(--bg2)] hover:border-[var(--muted)]"
                }`}
              >
                <div className="relative">
                  <PixelRobotAvatar size={48} />
                  <span className="absolute -top-1 -right-1 bg-[var(--accent)] text-[var(--bg)] text-[8px] px-1 rounded">
                    AI
                  </span>
                </div>
                <div className="text-left">
                  <p className={`text-base ${selected === "ai" ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                    AI와 대화할게요
                  </p>
                  <p className="text-[var(--muted)] text-xs mt-1">
                    AI가 오늘 당신의 기록을 읽었어요
                  </p>
                </div>
              </button>

              {/* 상관없음 */}
              <button
                onClick={() => setSelected("any")}
                className={`w-full p-5 rounded-lg border-2 transition-all flex items-center gap-4 ${
                  selected === "any"
                    ? "border-[var(--accent)] bg-[var(--bg2)] shadow-[4px_4px_0_var(--accent2)]"
                    : "border-[var(--bg3)] bg-[var(--bg2)] hover:border-[var(--muted)]"
                }`}
              >
                <PixelDotsAvatar size={48} />
                <div className="text-left">
                  <p className={`text-base ${selected === "any" ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                    상관없어요
                  </p>
                  <p className="text-[var(--muted)] text-xs mt-1">
                    랜덤으로 매칭돼요
                  </p>
                </div>
              </button>
            </div>

            {/* 연결 시작 버튼 */}
            <div className="mt-8">
              <button
                onClick={handleStartConnection}
                disabled={!selected}
                className={`pixel-btn w-full text-lg ${
                  !selected ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                오늘의 연결 시작
              </button>
            </div>

            {/* 안내 문구 */}
            <div className="mt-6 text-center">
              <p className="text-[var(--muted)] text-xs">
                하루 2회 왕복 · 2시간 간격 · 대화 후 기록 사라짐
              </p>
            </div>
          </>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg2)] border-t border-[var(--bg3)]">
        <div className="flex justify-around items-center h-16 max-w-[390px] mx-auto">
          <Link
            href="/record"
            className="flex flex-col items-center gap-1 group"
          >
            <PixelNoteIcon size={24} color="var(--muted)" />
            <span className="text-xs font-galmuri text-[var(--muted)] group-hover:text-[var(--text)]">기록</span>
          </Link>
          <Link
            href="/me"
            className="flex flex-col items-center gap-1 group"
          >
            <PixelMoonIcon size={24} color="var(--muted)" />
            <span className="text-xs font-galmuri text-[var(--muted)] group-hover:text-[var(--text)]">나</span>
          </Link>
          <Link
            href="/connect"
            className="flex flex-col items-center gap-1"
          >
            <PixelSparkleIcon size={24} color="var(--accent)" />
            <span className="text-xs font-galmuri text-[var(--accent)]">연결</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

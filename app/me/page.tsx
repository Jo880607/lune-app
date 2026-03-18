"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import {
  getUser,
  getThisWeekRecords,
  getWeeklyAnalysis,
  saveAnalysis,
  getCurrentWeekKey,
  getUserAvatar,
  saveAvatar,
} from "@/lib/firestore";
import { analyzeWeeklyRecords } from "@/lib/ai";
import { WeeklyAnalysis, AvatarData } from "@/types";
import PixelAvatar from "@/components/PixelAvatar";
import PixelAvatarEditor from "@/components/PixelAvatarEditor";

type TabType = "weekly" | "monthly" | "yearly";

// 픽셀 아트 아이콘 컴포넌트들 (16x16 그리드, 1x1 rect 단위)
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

const PixelPaletteIcon = ({ size = 24, color = "var(--accent)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="5" y="2" width="6" height="1" fill={color} />
    <rect x="3" y="3" width="2" height="1" fill={color} />
    <rect x="11" y="3" width="2" height="1" fill={color} />
    <rect x="2" y="4" width="1" height="1" fill={color} />
    <rect x="13" y="4" width="1" height="1" fill={color} />
    <rect x="1" y="5" width="1" height="1" fill={color} />
    <rect x="14" y="5" width="1" height="1" fill={color} />
    <rect x="1" y="6" width="1" height="1" fill={color} />
    <rect x="14" y="6" width="1" height="1" fill={color} />
    <rect x="1" y="7" width="1" height="1" fill={color} />
    <rect x="14" y="7" width="1" height="1" fill={color} />
    <rect x="1" y="8" width="1" height="1" fill={color} />
    <rect x="14" y="8" width="1" height="1" fill={color} />
    <rect x="1" y="9" width="1" height="1" fill={color} />
    <rect x="14" y="9" width="1" height="1" fill={color} />
    <rect x="2" y="10" width="1" height="1" fill={color} />
    <rect x="13" y="10" width="1" height="1" fill={color} />
    <rect x="3" y="11" width="1" height="1" fill={color} />
    <rect x="12" y="11" width="1" height="1" fill={color} />
    <rect x="4" y="12" width="8" height="1" fill={color} />
    <rect x="4" y="5" width="2" height="2" fill="#FF8FAB" />
    <rect x="7" y="4" width="2" height="2" fill="#FFE566" />
    <rect x="10" y="5" width="2" height="2" fill="#7BE4A8" />
    <rect x="5" y="8" width="2" height="2" fill="#9B72CF" />
    <rect x="9" y="8" width="2" height="2" fill="#C8A8E9" />
  </svg>
);

// 작은 픽셀 초승달 아이콘 (위로 문구용)
const PixelMoonSmall = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    {/* 초승달 (🌙 방향 - 오른쪽 볼록) */}
    <rect x="9" y="2" width="3" height="1" fill="var(--yellow)" />
    <rect x="8" y="3" width="2" height="1" fill="var(--yellow)" />
    <rect x="11" y="3" width="2" height="1" fill="var(--yellow)" />
    <rect x="7" y="4" width="2" height="1" fill="var(--yellow)" />
    <rect x="12" y="4" width="2" height="1" fill="var(--yellow)" />
    <rect x="6" y="5" width="2" height="1" fill="var(--yellow)" />
    <rect x="13" y="5" width="1" height="1" fill="var(--yellow)" />
    <rect x="5" y="6" width="2" height="1" fill="var(--yellow)" />
    <rect x="13" y="6" width="1" height="1" fill="var(--yellow)" />
    <rect x="5" y="7" width="2" height="1" fill="var(--yellow)" />
    <rect x="13" y="7" width="1" height="1" fill="var(--yellow)" />
    <rect x="5" y="8" width="2" height="1" fill="var(--yellow)" />
    <rect x="13" y="8" width="1" height="1" fill="var(--yellow)" />
    <rect x="5" y="9" width="2" height="1" fill="var(--yellow)" />
    <rect x="13" y="9" width="1" height="1" fill="var(--yellow)" />
    <rect x="6" y="10" width="2" height="1" fill="var(--yellow)" />
    <rect x="13" y="10" width="1" height="1" fill="var(--yellow)" />
    <rect x="7" y="11" width="2" height="1" fill="var(--yellow)" />
    <rect x="12" y="11" width="2" height="1" fill="var(--yellow)" />
    <rect x="8" y="12" width="2" height="1" fill="var(--yellow)" />
    <rect x="11" y="12" width="2" height="1" fill="var(--yellow)" />
    <rect x="9" y="13" width="3" height="1" fill="var(--yellow)" />
  </svg>
);

// 감정 분류 및 위로 문구 생성
const negativeEmotions = ["피로감", "지침", "힘듦", "슬픔", "우울", "불안", "외로움", "지쳤", "무기력"];
const positiveEmotions = ["기쁨", "설렘", "만족", "행복", "즐거움", "편안함", "감사", "희망", "기대"];

function getComfortMessage(emotions: string[]): { type: "negative" | "positive" | "neutral"; message: string } {
  const hasNegative = emotions.some((e) => negativeEmotions.some((ne) => e.includes(ne)));
  const hasPositive = emotions.some((e) => positiveEmotions.some((pe) => e.includes(pe)));

  if (hasNegative) {
    return {
      type: "negative",
      message: "많이 지쳤군요. 오늘 하루도 수고했어요.",
    };
  } else if (hasPositive) {
    return {
      type: "positive",
      message: "이번 주 좋은 에너지가 느껴져요.",
    };
  } else {
    return {
      type: "neutral",
      message: "차곡차곡 쌓이고 있어요. 잘 하고 있어요.",
    };
  }
}

// 목업 데이터
const mockUser = {
  nickname: "별빛", // TODO: Firebase Auth 연결 후 실제 닉네임으로 교체
  weeksRecorded: 2, // 기록된 주 수 (4주 이상이면 월간 탭 열림)
  monthsRecorded: 2, // 기록된 개월 수 (13개월 이상이면 연간 탭 열림)
};

const mockWeeklyAnalysis = {
  week: "3월 2주차",
  headline: "조용히 지쳐가고 있었어요",
  emotions: ["피로감", "그리움", "잔잔함"],
  keywords: ["퇴근", "커피", "비"],
  timePattern: "밤 11시~새벽 1시",
  changeFromLastWeek: "지난주보다 기록이 3회 늘었어요",
};

const mockMonthlyAnalysis = {
  month: "3월",
  headline: "3월의 당신",
  summary: "이번 달 가장 많이 느낀 감정은 피로감이었어요.",
  weeklySummaries: [
    "1주차: 새로운 시작에 대한 설렘",
    "2주차: 조용히 지쳐가는 중",
    "3주차: 작은 위로를 찾아가는 시간",
    "4주차: 천천히 회복 중",
  ],
};

const mockYearlyAnalysis = {
  year: "2026년",
  headline: "2026년의 당신",
  monthlyFlow: [
    { month: "1월", emotion: "기대" },
    { month: "2월", emotion: "설렘" },
    { month: "3월", emotion: "피로감" },
    { month: "4월", emotion: "회복" },
    { month: "5월", emotion: "안정" },
    { month: "6월", emotion: "즐거움" },
    { month: "7월", emotion: "여유" },
    { month: "8월", emotion: "휴식" },
    { month: "9월", emotion: "새로움" },
    { month: "10월", emotion: "감사" },
    { month: "11월", emotion: "따뜻함" },
    { month: "12월", emotion: "평온" },
  ],
};

export default function MePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("weekly");
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyAnalysis | null>(null);
  const [noRecords, setNoRecords] = useState(false);
  const [weekLabel, setWeekLabel] = useState("");
  const [avatarData, setAvatarData] = useState<AvatarData | null>(null);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(currentUser.uid);

      try {
        // 유저 정보 불러오기
        const userData = await getUser(currentUser.uid);
        if (userData) {
          setNickname(userData.nickname);
        }

        // 아바타 데이터 불러오기
        const avatar = await getUserAvatar(currentUser.uid);
        if (avatar) {
          setAvatarData(avatar);
        }

        // 주차 라벨 설정
        const now = new Date();
        const month = now.getMonth() + 1;
        const weekOfMonth = Math.ceil(now.getDate() / 7);
        setWeekLabel(`${month}월 ${weekOfMonth}주차`);

        const weekKey = getCurrentWeekKey();

        // 저장된 분석 확인
        const savedAnalysis = await getWeeklyAnalysis(currentUser.uid, weekKey);
        if (savedAnalysis) {
          setWeeklyAnalysis(savedAnalysis);
          setLoading(false);
          return;
        }

        // 이번 주 기록 가져오기
        const records = await getThisWeekRecords(currentUser.uid);

        if (records.length === 0) {
          setNoRecords(true);
          setLoading(false);
          return;
        }

        // AI 분석 시작
        setLoading(false);
        setAnalyzing(true);

        const contents = records.map((r) => r.content);
        const result = await analyzeWeeklyRecords(contents);

        // 분석 결과 저장
        await saveAnalysis(currentUser.uid, weekKey, result);

        setWeeklyAnalysis({
          userId: currentUser.uid,
          weekKey,
          ...result,
          createdAt: Timestamp.now(),
        });
      } catch (error) {
        console.error("[Me] 데이터 불러오기 실패:", error);
      } finally {
        setAnalyzing(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const comfort = weeklyAnalysis
    ? getComfortMessage(weeklyAnalysis.emotions)
    : getComfortMessage(mockWeeklyAnalysis.emotions);

  const handleSaveAvatar = async (data: AvatarData) => {
    if (!currentUserId) return;

    setSavingAvatar(true);
    try {
      await saveAvatar(currentUserId, data);
      setAvatarData(data);
      setShowAvatarEditor(false);
    } catch (error) {
      console.error("[Me] 아바타 저장 실패:", error);
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("[Me] 로그아웃 실패:", error);
    }
  };

  // 탭 잠금 상태 확인
  const isMonthlyUnlocked = mockUser.weeksRecorded >= 4;
  const isYearlyUnlocked = mockUser.monthsRecorded >= 13;

  const handleTabClick = (tab: TabType) => {
    if (tab === "monthly" && !isMonthlyUnlocked) {
      setLockMessage("4주 기록이 쌓이면 열려요 [LOCK]");
      setTimeout(() => setLockMessage(null), 2000);
      return;
    }
    if (tab === "yearly" && !isYearlyUnlocked) {
      setLockMessage("13개월 후에 열려요 [LOCK]");
      setTimeout(() => setLockMessage(null), 2000);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* 아바타 에디터 모달 */}
      {showAvatarEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <PixelAvatarEditor
            initialData={avatarData || undefined}
            onSave={handleSaveAvatar}
            onCancel={() => setShowAvatarEditor(false)}
            saving={savingAvatar}
          />
        </div>
      )}

      {/* 헤더 */}
      <header className="p-6 text-center">
        {/* 아바타 */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <PixelAvatar avatarData={avatarData} size="lg" />
          <button
            onClick={() => setShowAvatarEditor(true)}
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            편집하기
          </button>
        </div>
        <h1 className="font-galmuri text-xl text-[var(--accent)]">
          {loading ? "..." : `${nickname || "익명"}님`}
        </h1>
      </header>

      {/* 탭 네비게이션 */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 bg-[var(--bg2)] p-1 rounded-lg">
          <button
            onClick={() => handleTabClick("weekly")}
            className={`flex-1 py-2 px-3 text-sm rounded transition-all ${
              activeTab === "weekly"
                ? "bg-[var(--bg3)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            주간
          </button>
          <button
            onClick={() => handleTabClick("monthly")}
            className={`flex-1 py-2 px-3 text-sm rounded transition-all flex items-center justify-center gap-1 ${
              activeTab === "monthly"
                ? "bg-[var(--bg3)] text-[var(--accent)]"
                : isMonthlyUnlocked
                ? "text-[var(--muted)] hover:text-[var(--text)]"
                : "text-[var(--muted)] opacity-50 cursor-not-allowed"
            }`}
          >
            월간
            {!isMonthlyUnlocked && <span className="text-xs">[LOCK]</span>}
          </button>
          <button
            onClick={() => handleTabClick("yearly")}
            className={`flex-1 py-2 px-3 text-sm rounded transition-all flex items-center justify-center gap-1 ${
              activeTab === "yearly"
                ? "bg-[var(--bg3)] text-[var(--accent)]"
                : isYearlyUnlocked
                ? "text-[var(--muted)] hover:text-[var(--text)]"
                : "text-[var(--muted)] opacity-50 cursor-not-allowed"
            }`}
          >
            연간
            {!isYearlyUnlocked && <span className="text-xs">[LOCK]</span>}
          </button>
        </div>

        {/* 잠금 안내 메시지 */}
        {lockMessage && (
          <div className="mt-3 text-center">
            <p className="text-[var(--muted)] text-xs bg-[var(--bg2)] inline-block px-4 py-2 rounded">
              {lockMessage}
            </p>
          </div>
        )}
      </div>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 px-6 pb-24">
        {/* 주간 분석 카드 */}
        {activeTab === "weekly" && (
          <>
            {/* 분석 중 로딩 */}
            {analyzing && (
              <div className="flex flex-col items-center justify-center py-16">
                <PixelMoonSmall size={48} />
                <p className="text-[var(--muted)] mt-4">분석 중...</p>
              </div>
            )}

            {/* 기록 없음 */}
            {!analyzing && noRecords && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <PixelMoonSmall size={48} />
                <p className="text-[var(--muted)] mt-4 mb-6">
                  이번 주 기록이 없어요.<br />
                  오늘 첫 기록을 남겨볼까요?
                </p>
                <button
                  onClick={() => router.push("/record")}
                  className="pixel-btn"
                >
                  기록하러 가기
                </button>
              </div>
            )}

            {/* 분석 결과 */}
            {!analyzing && !noRecords && weeklyAnalysis && (
              <div className="bg-[var(--bg2)] border border-[var(--bg3)] rounded-lg p-6">
                {/* 주차 표시 */}
                <p className="text-[var(--muted)] text-xs mb-4">{weekLabel} 분석</p>

                {/* 레이블 */}
                <p className="text-[var(--muted)] text-sm mb-2">이번 주 당신은</p>

                {/* 헤드라인 */}
                <h2 className="text-base font-galmuri text-[var(--text)] mb-3">
                  {weeklyAnalysis.headline}
                  <span className="cursor-blink text-[var(--accent)]">_</span>
                </h2>

                {/* 감정 기반 위로 문구 */}
                <div className="flex items-center gap-2 mb-6">
                  {comfort.type === "negative" && <PixelMoonSmall size={14} />}
                  <p className="text-[var(--muted)] text-xs italic">
                    {weeklyAnalysis.comfortMessage || comfort.message}
                  </p>
                </div>

                {/* 구분선 */}
                <div className="border-t border-[var(--bg3)] my-6" />

                {/* 감정 태그들 */}
                <div className="mb-4">
                  <p className="text-[var(--muted)] text-xs mb-3">자주 느낀 감정</p>
                  <div className="flex flex-wrap gap-2">
                    {weeklyAnalysis.emotions.map((emotion) => (
                      <span key={emotion} className="pixel-tag">
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 키워드 태그들 */}
                <div className="mb-6">
                  <p className="text-[var(--muted)] text-xs mb-3">자주 등장한 단어</p>
                  <div className="flex flex-wrap gap-2">
                    {weeklyAnalysis.keywords.map((keyword) => (
                      <span key={keyword} className="pixel-tag yellow">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 구분선 */}
                <div className="border-t border-[var(--bg3)] my-6" />

                {/* 시간대 & 변화 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted)] text-sm">반복된 시간대</span>
                    <span className="text-[var(--text)] text-sm">{weeklyAnalysis.peakTime}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[var(--muted)] text-sm">지난주 대비</span>
                    <span className="text-[var(--accent)] text-sm text-right max-w-[180px]">
                      {weeklyAnalysis.comparison}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 월간 분석 카드 */}
        {activeTab === "monthly" && isMonthlyUnlocked && (
          <div className="bg-[var(--bg2)] border border-[var(--bg3)] rounded-lg p-6">
            {/* 월 표시 */}
            <p className="text-[var(--muted)] text-xs mb-4">{mockMonthlyAnalysis.month} 분석</p>

            {/* 헤드라인 */}
            <h2 className="text-base font-galmuri text-[var(--text)] mb-3">
              {mockMonthlyAnalysis.headline}
              <span className="cursor-blink text-[var(--accent)]">_</span>
            </h2>

            {/* 요약 */}
            <p className="text-[var(--muted)] text-sm mb-6">
              {mockMonthlyAnalysis.summary}
            </p>

            {/* 구분선 */}
            <div className="border-t border-[var(--bg3)] my-6" />

            {/* 주간 요약 */}
            <div>
              <p className="text-[var(--muted)] text-xs mb-3">주간 흐름</p>
              <div className="space-y-3">
                {mockMonthlyAnalysis.weeklySummaries.map((summary, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-[var(--yellow)] text-xs">*</span>
                    <span className="text-[var(--text)] text-sm">{summary}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 연간 분석 카드 */}
        {activeTab === "yearly" && isYearlyUnlocked && (
          <div className="bg-[var(--bg2)] border border-[var(--bg3)] rounded-lg p-6">
            {/* 연도 표시 */}
            <p className="text-[var(--muted)] text-xs mb-4">{mockYearlyAnalysis.year} 분석</p>

            {/* 헤드라인 */}
            <h2 className="text-base font-galmuri text-[var(--text)] mb-6">
              {mockYearlyAnalysis.headline}
              <span className="cursor-blink text-[var(--accent)]">_</span>
            </h2>

            {/* 구분선 */}
            <div className="border-t border-[var(--bg3)] my-6" />

            {/* 월별 감정 흐름 */}
            <div>
              <p className="text-[var(--muted)] text-xs mb-3">월별 감정 흐름</p>
              <div className="grid grid-cols-2 gap-2">
                {mockYearlyAnalysis.monthlyFlow.map((item) => (
                  <div
                    key={item.month}
                    className="flex justify-between items-center bg-[var(--bg3)] px-3 py-2 rounded"
                  >
                    <span className="text-[var(--muted)] text-xs">{item.month}</span>
                    <span className="text-[var(--accent)] text-xs">{item.emotion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 다음 분석 안내 */}
        <div className="mt-8 text-center">
          <p className="text-[var(--muted)] text-sm">
            {activeTab === "weekly" && "다음 분석은 일요일 저녁에 도착해요."}
            {activeTab === "monthly" && "다음 월간 분석은 월말에 도착해요."}
            {activeTab === "yearly" && "다음 연간 분석은 연말에 도착해요."}
          </p>
        </div>

        {/* 로그아웃 */}
        <div className="mt-12 text-center">
          <button
            onClick={handleLogout}
            className="text-[var(--muted)] text-xs hover:text-[var(--text)] transition-colors"
          >
            로그아웃
          </button>
        </div>
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
            className="flex flex-col items-center gap-1"
          >
            <PixelMoonIcon size={24} color="var(--accent)" />
            <span className="text-xs font-galmuri text-[var(--accent)]">나</span>
          </Link>
          <Link
            href="/connect"
            className="flex flex-col items-center gap-1 group"
          >
            <PixelSparkleIcon size={24} color="var(--muted)" />
            <span className="text-xs font-galmuri text-[var(--muted)] group-hover:text-[var(--text)]">연결</span>
          </Link>
          <Link
            href="/gallery"
            className="flex flex-col items-center gap-1 group"
          >
            <PixelPaletteIcon size={24} color="var(--muted)" />
            <span className="text-xs font-galmuri text-[var(--muted)] group-hover:text-[var(--text)]">갤러리</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

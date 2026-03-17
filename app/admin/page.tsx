"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

const ADMIN_UID = "25iRJKrVu9eJsjGWdZYrOHPimpZ2";

interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  totalRecords: number;
  recordsToday: number;
  totalConnections: number;
  waitlistCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.uid !== ADMIN_UID) {
        router.replace("/");
        return;
      }

      try {
        // 오늘 날짜 범위
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = Timestamp.fromDate(today);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endOfDay = Timestamp.fromDate(tomorrow);

        // 병렬로 모든 데이터 조회
        const [usersSnap, recordsSnap, connectionsSnap, waitlistSnap] =
          await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "records")),
            getDocs(collection(db, "connections")),
            getDocs(collection(db, "waitlist")),
          ]);

        // 오늘 기록 필터링
        const todayRecords = recordsSnap.docs.filter((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt;
          if (!createdAt) return false;
          const millis = createdAt.toMillis();
          return millis >= startOfDay.toMillis() && millis < endOfDay.toMillis();
        });

        // 오늘 활성 유저 (오늘 기록 남긴 고유 유저 수)
        const activeUserIds = new Set(
          todayRecords.map((doc) => doc.data().userId)
        );

        setStats({
          totalUsers: usersSnap.size,
          activeUsersToday: activeUserIds.size,
          totalRecords: recordsSnap.size,
          recordsToday: todayRecords.length,
          totalConnections: connectionsSnap.size,
          waitlistCount: waitlistSnap.size,
        });
      } catch (error) {
        console.error("[Admin] 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--muted)] text-sm">로딩 중...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--muted)] text-sm">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const cards = [
    { label: "전체 가입자", value: stats.totalUsers, icon: "USR" },
    { label: "오늘 활성 유저", value: stats.activeUsersToday, icon: "ACT" },
    { label: "전체 기록", value: stats.totalRecords, icon: "REC" },
    { label: "오늘 기록", value: stats.recordsToday, icon: "TOD" },
    { label: "전체 연결", value: stats.totalConnections, icon: "CON" },
    { label: "대기자 수", value: stats.waitlistCount, icon: "WAI" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* 헤더 */}
      <header className="p-6 text-center border-b border-[var(--bg3)]">
        <h1
          className="text-2xl text-[var(--yellow)]"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          ADMIN
        </h1>
        <p className="text-[var(--muted)] text-xs mt-2">Lune Dashboard</p>
      </header>

      {/* 대시보드 카드 그리드 */}
      <main className="p-6 max-w-[600px] mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-[var(--bg2)] border border-[var(--bg3)] rounded-lg p-5"
              style={{ boxShadow: "4px 4px 0 var(--bg3)" }}
            >
              {/* 픽셀 아이콘 라벨 */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[10px] text-[var(--bg)] bg-[var(--accent)] px-1.5 py-0.5 rounded-sm"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  {card.icon}
                </span>
              </div>

              {/* 숫자 */}
              <p
                className="text-3xl text-[var(--text)] mb-1"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                {card.value.toLocaleString()}
              </p>

              {/* 라벨 */}
              <p className="text-[var(--muted)] text-xs">{card.label}</p>
            </div>
          ))}
        </div>

        {/* 홈으로 돌아가기 */}
        <div className="mt-12 text-center">
          <button
            onClick={() => router.push("/record")}
            className="text-[var(--muted)] text-xs hover:text-[var(--text)] transition-colors"
          >
            돌아가기
          </button>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/record");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted)]">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* 배경 별들 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="star absolute w-1 h-1 bg-[var(--yellow)] rounded-full" style={{ top: '10%', left: '15%' }} />
        <div className="star-delayed absolute w-1.5 h-1.5 bg-[var(--yellow)] rounded-full" style={{ top: '20%', right: '20%' }} />
        <div className="star absolute w-1 h-1 bg-[var(--yellow)] rounded-full" style={{ top: '35%', left: '8%' }} />
        <div className="star-delayed absolute w-1 h-1 bg-[var(--yellow)] rounded-full" style={{ top: '15%', right: '35%' }} />
        <div className="star absolute w-1.5 h-1.5 bg-[var(--yellow)] rounded-full" style={{ top: '45%', right: '10%' }} />
        <div className="star-delayed absolute w-1 h-1 bg-[var(--yellow)] rounded-full" style={{ top: '60%', left: '20%' }} />
        <div className="star absolute w-1 h-1 bg-[var(--yellow)] rounded-full" style={{ top: '70%', right: '25%' }} />
        <div className="star-delayed absolute w-1.5 h-1.5 bg-[var(--yellow)] rounded-full" style={{ top: '80%', left: '30%' }} />
        <div className="star absolute w-1 h-1 bg-[var(--yellow)] rounded-full" style={{ top: '85%', right: '15%' }} />
      </div>

      {/* 메인 컨텐츠 */}
      <main className="flex flex-col items-center gap-8 z-10">
        {/* 픽셀 달 */}
        <div className="float mb-4">
          <svg width="120" height="120" viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
            {/* 달 외곽 */}
            <rect x="10" y="4" width="12" height="2" fill="var(--yellow)" />
            <rect x="8" y="6" width="2" height="2" fill="var(--yellow)" />
            <rect x="22" y="6" width="2" height="2" fill="var(--yellow)" />
            <rect x="6" y="8" width="2" height="2" fill="var(--yellow)" />
            <rect x="24" y="8" width="2" height="2" fill="var(--yellow)" />
            <rect x="4" y="10" width="2" height="12" fill="var(--yellow)" />
            <rect x="26" y="10" width="2" height="12" fill="var(--yellow)" />
            <rect x="6" y="22" width="2" height="2" fill="var(--yellow)" />
            <rect x="24" y="22" width="2" height="2" fill="var(--yellow)" />
            <rect x="8" y="24" width="2" height="2" fill="var(--yellow)" />
            <rect x="22" y="24" width="2" height="2" fill="var(--yellow)" />
            <rect x="10" y="26" width="12" height="2" fill="var(--yellow)" />
            {/* 달 내부 */}
            <rect x="10" y="6" width="12" height="2" fill="#FFF8DC" />
            <rect x="8" y="8" width="16" height="2" fill="#FFF8DC" />
            <rect x="6" y="10" width="20" height="12" fill="#FFF8DC" />
            <rect x="8" y="22" width="16" height="2" fill="#FFF8DC" />
            <rect x="10" y="24" width="12" height="2" fill="#FFF8DC" />
            {/* 달 크레이터 */}
            <rect x="10" y="12" width="2" height="2" fill="var(--accent)" opacity="0.4" />
            <rect x="18" y="10" width="4" height="2" fill="var(--accent)" opacity="0.3" />
            <rect x="12" y="18" width="3" height="2" fill="var(--accent)" opacity="0.35" />
            <rect x="20" y="16" width="2" height="2" fill="var(--accent)" opacity="0.3" />
          </svg>
        </div>

        {/* 로고 */}
        <h1 className="pixel-title text-3xl text-[var(--accent)] tracking-wider">
          LUNE
        </h1>

        {/* 카피 */}
        <div className="text-center space-y-3 mt-4">
          <p className="text-xl text-[var(--text)]">
            SNS 지쳤죠?
          </p>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            보여주기 위한 기록은 그만.<br />
            진짜 나를 알아가는 조용한 공간.
          </p>
        </div>

        {/* 버튼들 */}
        <div className="flex flex-col gap-4 mt-8 w-full max-w-xs">
          <button
            className="pixel-btn w-full text-lg"
            onClick={() => router.push("/onboarding")}
          >
            시작하기
          </button>
          <button
            className="pixel-btn-secondary w-full"
            onClick={() => router.push("/waitlist")}
          >
            대기자 명단 보기
          </button>
        </div>

        {/* 하단 안내 */}
        <p className="text-[var(--muted)] text-xs mt-8">
          1,000명 한정 / 조용히 나를 비추는 빛
        </p>
      </main>
    </div>
  );
}

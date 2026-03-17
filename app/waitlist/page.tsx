"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getWaitlistStats,
  joinWaitlist,
  dailyVisit,
  submitSurvey,
  subscribeToWaitlistPosition,
} from "@/lib/firestore";
import type { WaitlistEntry } from "@/types";

function formatPhone(value: string): string {
  const nums = value.replace(/[^0-9]/g, "").slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
}

export default function WaitlistPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<WaitlistEntry | null>(null);
  const [stats, setStats] = useState({ userCount: 0, waitlistCount: 0 });
  const [message, setMessage] = useState("");
  const [showSurvey, setShowSurvey] = useState(false);
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
  });

  // 통계 로드
  useEffect(() => {
    getWaitlistStats().then(setStats);
  }, []);

  // 실시간 순번 구독
  useEffect(() => {
    if (step !== 2 || !phone) return;
    const normalizedPhone = phone.replace(/[^0-9]/g, "");
    const unsubscribe = subscribeToWaitlistPosition(
      normalizedPhone,
      (data) => {
        if (data) setInfo(data);
      }
    );
    return () => unsubscribe();
  }, [step, phone]);

  // 대기 신청
  const handleJoin = async () => {
    const nums = phone.replace(/[^0-9]/g, "");
    if (nums.length !== 11 || !nums.startsWith("01")) return;

    setLoading(true);
    try {
      const result = await joinWaitlist(nums);
      setStep(2);
      if (!result.isExisting) {
        const newStats = await getWaitlistStats();
        setStats(newStats);
      }
    } catch (error) {
      console.error("대기 신청 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 매일 방문
  const handleVisit = async () => {
    setLoading(true);
    try {
      const result = await dailyVisit(phone.replace(/[^0-9]/g, ""));
      setMessage(result.message);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("방문 체크 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 설문 제출
  const handleSurvey = async () => {
    if (!answers.q1 || !answers.q2 || !answers.q3) return;
    setLoading(true);
    try {
      const result = await submitSurvey(
        phone.replace(/[^0-9]/g, ""),
        answers
      );
      setMessage(result.message);
      if (result.success) setShowSurvey(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("설문 제출 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const visitedToday = info?.lastVisitDate === today;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden">
      {/* 배경 별들 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="star absolute w-1 h-1 bg-[var(--yellow)] rounded-full"
          style={{ top: "8%", left: "12%" }}
        />
        <div
          className="star-delayed absolute w-1.5 h-1.5 bg-[var(--yellow)] rounded-full"
          style={{ top: "18%", right: "18%" }}
        />
        <div
          className="star absolute w-1 h-1 bg-[var(--yellow)] rounded-full"
          style={{ top: "32%", left: "6%" }}
        />
        <div
          className="star-delayed absolute w-1 h-1 bg-[var(--yellow)] rounded-full"
          style={{ top: "55%", right: "8%" }}
        />
        <div
          className="star absolute w-1.5 h-1.5 bg-[var(--yellow)] rounded-full"
          style={{ top: "72%", left: "22%" }}
        />
        <div
          className="star-delayed absolute w-1 h-1 bg-[var(--yellow)] rounded-full"
          style={{ top: "85%", right: "28%" }}
        />
      </div>

      <div className="w-full max-w-sm z-10">
        {/* 픽셀 달 */}
        <div className="flex justify-center mb-6 mt-8">
          <div className="float">
            <svg
              width="80"
              height="80"
              viewBox="0 0 32 32"
              style={{ imageRendering: "pixelated" }}
            >
              <rect
                x="10"
                y="4"
                width="12"
                height="2"
                fill="var(--yellow)"
              />
              <rect
                x="8"
                y="6"
                width="2"
                height="2"
                fill="var(--yellow)"
              />
              <rect
                x="22"
                y="6"
                width="2"
                height="2"
                fill="var(--yellow)"
              />
              <rect
                x="6"
                y="8"
                width="2"
                height="2"
                fill="var(--yellow)"
              />
              <rect
                x="24"
                y="8"
                width="2"
                height="2"
                fill="var(--yellow)"
              />
              <rect
                x="4"
                y="10"
                width="2"
                height="12"
                fill="var(--yellow)"
              />
              <rect
                x="26"
                y="10"
                width="2"
                height="12"
                fill="var(--yellow)"
              />
              <rect
                x="6"
                y="22"
                width="2"
                height="2"
                fill="var(--yellow)"
              />
              <rect
                x="24"
                y="22"
                width="2"
                height="2"
                fill="var(--yellow)"
              />
              <rect
                x="8"
                y="24"
                width="2"
                height="2"
                fill="var(--yellow)"
              />
              <rect
                x="22"
                y="24"
                width="2"
                height="2"
                fill="var(--yellow)"
              />
              <rect
                x="10"
                y="26"
                width="12"
                height="2"
                fill="var(--yellow)"
              />
              <rect x="10" y="6" width="12" height="2" fill="#FFF8DC" />
              <rect x="8" y="8" width="16" height="2" fill="#FFF8DC" />
              <rect x="6" y="10" width="20" height="12" fill="#FFF8DC" />
              <rect x="8" y="22" width="16" height="2" fill="#FFF8DC" />
              <rect x="10" y="24" width="12" height="2" fill="#FFF8DC" />
              <rect
                x="10"
                y="12"
                width="2"
                height="2"
                fill="var(--accent)"
                opacity="0.4"
              />
              <rect
                x="18"
                y="10"
                width="4"
                height="2"
                fill="var(--accent)"
                opacity="0.3"
              />
              <rect
                x="12"
                y="18"
                width="3"
                height="2"
                fill="var(--accent)"
                opacity="0.35"
              />
              <rect
                x="20"
                y="16"
                width="2"
                height="2"
                fill="var(--accent)"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>

        {/* 통계 */}
        <div className="text-center mb-8">
          <p className="text-[var(--yellow)] text-lg">
            현재{" "}
            <span className="pixel-title text-xs">{stats.userCount}</span>
            /1,000명 입장 중
          </p>
          <p className="text-[var(--muted)] text-sm mt-2">
            대기자{" "}
            <span className="text-[var(--accent)]">{stats.waitlistCount}</span>
            명
          </p>
        </div>

        {step === 1 ? (
          /* ===== 1단계: 전화번호 등록 ===== */
          <div className="flex flex-col gap-6">
            <div>
              <label className="text-[var(--muted)] text-sm mb-2 block">
                전화번호
              </label>
              <input
                type="tel"
                value={formatPhone(phone)}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full p-3 bg-[var(--bg2)] border-2 border-[var(--bg3)] text-[var(--text)] text-center text-lg tracking-wider focus:border-[var(--accent)] outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoin();
                }}
              />
            </div>

            <button
              className="pixel-btn w-full text-lg disabled:opacity-50"
              onClick={handleJoin}
              disabled={
                loading || phone.replace(/[^0-9]/g, "").length !== 11
              }
            >
              {loading ? "확인 중..." : "대기 신청하기"}
            </button>

            <button
              className="text-[var(--muted)] text-sm mt-4"
              onClick={() => router.push("/")}
            >
              &larr; 돌아가기
            </button>
          </div>
        ) : (
          /* ===== 2단계: 내 순번 화면 ===== */
          <div className="flex flex-col gap-5">
            {/* 순번 카드 */}
            <div className="text-center py-8 bg-[var(--bg2)] border-2 border-[var(--bg3)]">
              <p className="text-[var(--muted)] text-sm mb-3">내 순번</p>
              <p className="pixel-title text-4xl text-[var(--accent)] leading-relaxed">
                {info?.position ?? "..."}
              </p>
              <p className="text-[var(--text)] mt-3">번째로 대기 중이에요</p>
            </div>

            {/* 메시지 토스트 */}
            {message && (
              <div className="text-center py-3 bg-[var(--bg3)] text-[var(--yellow)] text-sm">
                {message}
              </div>
            )}

            {/* 매일 방문 버튼 */}
            <button
              className={`pixel-btn w-full ${visitedToday ? "opacity-50" : ""}`}
              onClick={handleVisit}
              disabled={loading || visitedToday}
            >
              {visitedToday
                ? "✓ 오늘 방문 완료"
                : "매일 방문하기 (+1칸)"}
            </button>

            {/* 질문 답변 섹션 */}
            {!info?.surveyDone ? (
              <div>
                <button
                  className="pixel-btn-secondary w-full"
                  onClick={() => setShowSurvey(!showSurvey)}
                >
                  {showSurvey
                    ? "접기"
                    : "질문에 답하기 (+15칸)"}
                </button>

                {showSurvey && (
                  <div className="mt-4 p-4 bg-[var(--bg2)] border-2 border-[var(--bg3)] flex flex-col gap-5">
                    {/* Q1 */}
                    <div>
                      <p className="text-sm text-[var(--text)] mb-2">
                        Lune을 어떻게 알게 됐나요?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["SNS", "지인", "검색", "기타"].map((opt) => (
                          <button
                            key={opt}
                            className={`px-3 py-1.5 text-sm border transition-colors ${
                              answers.q1 === opt
                                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg3)]"
                                : "border-[var(--bg3)] text-[var(--muted)] hover:border-[var(--muted)]"
                            }`}
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, q1: opt }))
                            }
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q2 */}
                    <div>
                      <p className="text-sm text-[var(--text)] mb-2">
                        주로 언제 쓸 것 같아요?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["아침", "점심", "저녁", "밤"].map((opt) => (
                          <button
                            key={opt}
                            className={`px-3 py-1.5 text-sm border transition-colors ${
                              answers.q2 === opt
                                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg3)]"
                                : "border-[var(--bg3)] text-[var(--muted)] hover:border-[var(--muted)]"
                            }`}
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, q2: opt }))
                            }
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q3 */}
                    <div>
                      <p className="text-sm text-[var(--text)] mb-2">
                        Lune에서 가장 기대되는 건?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["기록", "AI분석", "연결", "대화"].map((opt) => (
                          <button
                            key={opt}
                            className={`px-3 py-1.5 text-sm border transition-colors ${
                              answers.q3 === opt
                                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg3)]"
                                : "border-[var(--bg3)] text-[var(--muted)] hover:border-[var(--muted)]"
                            }`}
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, q3: opt }))
                            }
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q4 */}
                    <div>
                      <p className="text-sm text-[var(--text)] mb-2">
                        있었으면 하는 기능이 있나요?
                      </p>
                      <input
                        type="text"
                        value={answers.q4}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            q4: e.target.value,
                          }))
                        }
                        placeholder="자유롭게 적어주세요"
                        className="w-full p-2 bg-[var(--bg)] border border-[var(--bg3)] text-[var(--text)] text-sm outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <button
                      className="pixel-btn w-full disabled:opacity-50"
                      onClick={handleSurvey}
                      disabled={
                        loading ||
                        !answers.q1 ||
                        !answers.q2 ||
                        !answers.q3
                      }
                    >
                      {loading ? "제출 중..." : "답변 제출하기"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-[var(--muted)] py-2">
                ✓ 질문 답변 완료
              </div>
            )}

            {/* 안내 */}
            <p className="text-center text-[var(--muted)] text-xs mt-4">
              순번이 되면 문자로 알려드릴게요
            </p>

            {/* 돌아가기 */}
            <button
              className="text-[var(--muted)] text-sm mt-2 text-center"
              onClick={() => router.push("/")}
            >
              &larr; 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

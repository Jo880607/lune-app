"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUser, saveRecord } from "@/lib/firestore";
import { analyzeFirstRecord, FirstRecordAnalysis } from "@/lib/ai";

type Step = 1 | 2 | 3;
type RecordMode = "voice" | "text" | null;

// 픽셀 초승달 (page.tsx에서 재활용)
const PixelMoon = () => (
  <div className="float">
    <svg width="120" height="120" viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
      {/* 초승달 - 왼쪽 볼록, 오른쪽 파임, 채워진 형태 */}
      <rect x="18" y="2" width="2" height="2" fill="var(--yellow)" />
      <rect x="16" y="4" width="4" height="2" fill="var(--yellow)" />
      <rect x="14" y="6" width="6" height="2" fill="var(--yellow)" />
      <rect x="12" y="8" width="8" height="2" fill="var(--yellow)" />
      <rect x="10" y="10" width="10" height="2" fill="var(--yellow)" />
      <rect x="8" y="12" width="10" height="2" fill="var(--yellow)" />
      <rect x="8" y="14" width="8" height="2" fill="var(--yellow)" />
      <rect x="8" y="16" width="8" height="2" fill="var(--yellow)" />
      <rect x="8" y="18" width="10" height="2" fill="var(--yellow)" />
      <rect x="10" y="20" width="10" height="2" fill="var(--yellow)" />
      <rect x="12" y="22" width="8" height="2" fill="var(--yellow)" />
      <rect x="14" y="24" width="6" height="2" fill="var(--yellow)" />
      <rect x="16" y="26" width="4" height="2" fill="var(--yellow)" />
      <rect x="18" y="28" width="2" height="2" fill="var(--yellow)" />
    </svg>
  </div>
);

// 픽셀 마이크 아이콘
const PixelMicIcon = ({ size = 32, color = "var(--accent)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="6" y="1" width="1" height="1" fill={color} />
    <rect x="7" y="1" width="1" height="1" fill={color} />
    <rect x="8" y="1" width="1" height="1" fill={color} />
    <rect x="9" y="1" width="1" height="1" fill={color} />
    <rect x="5" y="2" width="1" height="1" fill={color} />
    <rect x="6" y="2" width="1" height="1" fill={color} />
    <rect x="7" y="2" width="1" height="1" fill={color} />
    <rect x="8" y="2" width="1" height="1" fill={color} />
    <rect x="9" y="2" width="1" height="1" fill={color} />
    <rect x="10" y="2" width="1" height="1" fill={color} />
    <rect x="5" y="3" width="6" height="1" fill={color} />
    <rect x="5" y="4" width="6" height="1" fill={color} />
    <rect x="5" y="5" width="6" height="1" fill={color} />
    <rect x="6" y="6" width="4" height="1" fill={color} />
    <rect x="3" y="4" width="1" height="4" fill={color} />
    <rect x="12" y="4" width="1" height="4" fill={color} />
    <rect x="4" y="8" width="2" height="1" fill={color} />
    <rect x="10" y="8" width="2" height="1" fill={color} />
    <rect x="6" y="9" width="4" height="1" fill={color} />
    <rect x="7" y="10" width="2" height="3" fill={color} />
    <rect x="5" y="13" width="6" height="1" fill={color} />
  </svg>
);

// 픽셀 연필 아이콘
const PixelPencilIcon = ({ size = 32, color = "var(--accent)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="12" y="1" width="1" height="1" fill={color} />
    <rect x="13" y="1" width="1" height="1" fill={color} />
    <rect x="13" y="2" width="1" height="1" fill={color} />
    <rect x="14" y="2" width="1" height="1" fill={color} />
    <rect x="11" y="2" width="1" height="1" fill={color} />
    <rect x="12" y="2" width="1" height="1" fill={color} />
    <rect x="10" y="3" width="3" height="1" fill={color} />
    <rect x="9" y="4" width="3" height="1" fill={color} />
    <rect x="8" y="5" width="3" height="1" fill={color} />
    <rect x="7" y="6" width="3" height="1" fill={color} />
    <rect x="6" y="7" width="3" height="1" fill={color} />
    <rect x="5" y="8" width="3" height="1" fill={color} />
    <rect x="4" y="9" width="3" height="1" fill={color} />
    <rect x="3" y="10" width="3" height="1" fill={color} />
    <rect x="2" y="11" width="3" height="1" fill={color} />
    <rect x="1" y="12" width="3" height="1" fill={color} />
    <rect x="1" y="13" width="2" height="1" fill={color} />
    <rect x="1" y="14" width="1" height="1" fill={color} />
  </svg>
);

// 스텝 인디케이터 (픽셀 도트)
const StepIndicator = ({ currentStep }: { currentStep: Step }) => (
  <div className="flex gap-3 justify-center">
    {[1, 2, 3].map((step) => (
      <div
        key={step}
        className={`w-3 h-3 ${
          step <= currentStep ? "bg-[var(--accent)]" : "bg-[var(--bg3)]"
        }`}
        style={{ imageRendering: 'pixelated' }}
      />
    ))}
  </div>
);

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [nickname, setNickname] = useState("");
  const [recordMode, setRecordMode] = useState<RecordMode>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState("");
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<FirstRecordAnalysis | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleNextStep = async () => {
    if (step === 2 && user) {
      // 2단계에서 3단계로 넘어갈 때 유저 정보 저장
      setSaving(true);
      try {
        await saveUser(user.uid, nickname.trim(), "moon");
        console.log("[Onboarding] 유저 저장 완료:", user.uid);
        setStep(3);
      } catch (error) {
        console.error("[Onboarding] 유저 저장 실패:", error);
        alert("저장에 실패했어요. 다시 시도해주세요.");
      } finally {
        setSaving(false);
      }
    } else if (step < 3) {
      setStep((prev) => (prev + 1) as Step);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-[var(--muted)]">로딩 중...</div>
      </div>
    );
  }

  const handleRecord = async () => {
    if (!user || !text.trim()) return;

    setShowAIResponse(true);
    setAnalyzing(true);

    try {
      // 1. 기록 저장
      console.log("[Onboarding] 첫 기록 저장 시작");
      await saveRecord(user.uid, "text", text.trim(), true);
      console.log("[Onboarding] 첫 기록 저장 완료");

      // 2. AI 분석 호출
      console.log("[Onboarding] AI 분석 시작");
      const result = await analyzeFirstRecord(text.trim());
      console.log("[Onboarding] AI 분석 완료:", result);
      setAiResult(result);
    } catch (error) {
      console.error("[Onboarding] 기록/분석 실패:", error);
      // 실패해도 기본 결과 표시
      setAiResult({
        emotion: "오늘",
        message: "오늘 하루도 수고했어요.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const canProceedStep2 = nickname.trim().length > 0;
  const canProceedStep3 = recordMode === "voice" || (recordMode === "text" && text.trim().length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] p-6">
      {/* 스텝 인디케이터 */}
      <div className="pt-4 pb-8">
        <StepIndicator currentStep={step} />
        <p className="text-[var(--muted)] text-xs text-center mt-2">
          {step}/3
        </p>
      </div>

      {/* 스텝 1: 환영 */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <PixelMoon />

          <h1 className="pixel-title text-2xl text-[var(--accent)] mt-8 mb-4">
            안녕하세요
          </h1>

          <p className="text-[var(--text)] text-base mb-2">
            여기선 그냥 오늘을 남기면 돼요.
          </p>
          <p className="text-[var(--muted)] text-sm">
            보여주기 위한 기록이 아닌,<br />
            나를 알기 위한 조용한 공간.
          </p>

          <div className="mt-12 w-full max-w-xs">
            <button
              onClick={handleNextStep}
              className="pixel-btn w-full text-lg"
            >
              시작할게요
            </button>
          </div>
        </div>
      )}

      {/* 스텝 2: 닉네임 설정 */}
      {step === 2 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="pixel-title text-xl text-[var(--accent)] mb-8">
            어떻게 불러드릴까요?
          </h1>

          <div className="w-full max-w-xs">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              maxLength={10}
              className="w-full bg-[var(--bg2)] border-2 border-[var(--bg3)] px-4 py-4 text-[var(--text)] text-center text-lg placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <p className="text-[var(--muted)] text-xs mt-3">
              닉네임은 나중에 바꿀 수 있어요
            </p>
          </div>

          <div className="mt-12 w-full max-w-xs">
            <button
              onClick={handleNextStep}
              disabled={!canProceedStep2 || saving}
              className={`pixel-btn w-full text-lg ${
                !canProceedStep2 || saving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "저장 중..." : "다음"}
            </button>
          </div>
        </div>
      )}

      {/* 스텝 3: 첫 기록 */}
      {step === 3 && !showAIResponse && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-6">
            <h1 className="pixel-title text-xl text-[var(--accent)] mb-2">
              오늘을 남겨볼까요?
            </h1>
            <p className="text-[var(--muted)] text-sm">
              첫 기록이에요. 잘 들을게요.
            </p>
          </div>

          {/* 가이드 문구 */}
          <div className="text-center mb-8 space-y-2">
            <p className="text-[var(--muted)] text-xs leading-relaxed">
              잘 쓰려고 하지 않아도 돼요.
            </p>
            <p className="text-[var(--muted)] text-xs leading-relaxed">
              오늘 느낀 것, 스친 생각, 지금 이 순간.
            </p>
            <p className="text-[var(--muted)] text-xs leading-relaxed">
              그냥 떠오르는 대로.
            </p>
          </div>

          {/* 모드 선택 카드 */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setRecordMode("voice")}
              className={`flex-1 p-6 border-2 transition-all flex flex-col items-center ${
                recordMode === "voice"
                  ? "border-[var(--accent)] bg-[var(--bg2)]"
                  : "border-[var(--bg3)] bg-[var(--bg2)] hover:border-[var(--muted)]"
              }`}
            >
              <PixelMicIcon size={36} color={recordMode === "voice" ? "var(--accent)" : "var(--muted)"} />
              <span className={`text-sm mt-2 ${recordMode === "voice" ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                음성으로
              </span>
            </button>
            <button
              onClick={() => setRecordMode("text")}
              className={`flex-1 p-6 border-2 transition-all flex flex-col items-center ${
                recordMode === "text"
                  ? "border-[var(--accent)] bg-[var(--bg2)]"
                  : "border-[var(--bg3)] bg-[var(--bg2)] hover:border-[var(--muted)]"
              }`}
            >
              <PixelPencilIcon size={36} color={recordMode === "text" ? "var(--accent)" : "var(--muted)"} />
              <span className={`text-sm mt-2 ${recordMode === "text" ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                텍스트로
              </span>
            </button>
          </div>

          {/* 음성 녹음 UI */}
          {recordMode === "voice" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`w-20 h-20 flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 animate-pulse"
                    : "bg-[var(--bg3)] hover:bg-[var(--accent2)]"
                }`}
              >
                <PixelMicIcon size={40} color={isRecording ? "#fff" : "var(--text)"} />
              </button>
              <p className="text-[var(--muted)] text-xs">
                {isRecording ? "녹음 중... 다시 누르면 멈춰요" : "버튼을 눌러 녹음"}
              </p>
            </div>
          )}

          {/* 텍스트 입력 UI */}
          {recordMode === "text" && (
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="오늘 어떤 하루였나요?"
                className="w-full h-40 p-4 bg-[var(--bg2)] border-2 border-[var(--bg3)] text-[var(--text)] placeholder-[var(--muted)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <p className="text-[var(--muted)] text-xs text-right mt-1">
                {text.length}자
              </p>
            </div>
          )}

          {/* 제출 버튼 */}
          {recordMode && (
            <div className="mt-auto pt-6">
              <button
                onClick={handleRecord}
                disabled={!canProceedStep3}
                className={`pixel-btn w-full text-lg ${
                  !canProceedStep3 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                오늘을 남기기
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI 반응 (첫 기록 후) */}
      {step === 3 && showAIResponse && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <PixelMoon />

          {analyzing ? (
            <div className="mt-8">
              <p className="text-[var(--muted)] text-lg">잠시만요...</p>
            </div>
          ) : (
            <>
              <div className="mt-8 space-y-4">
                <p className="text-[var(--text)] text-lg">
                  첫 기록을 남겼어요.
                </p>
                <p className="text-[var(--accent)] text-base">
                  오늘 당신의 <span className="text-[var(--yellow)]">{aiResult?.emotion || "마음"}</span>이 느껴졌어요.
                </p>
                <p className="text-[var(--muted)] text-sm">
                  {aiResult?.message || "오늘 하루도 수고했어요."}
                </p>
                <p className="text-[var(--muted)] text-sm mt-4">
                  매주 일요일, 쌓인 당신을 정리해드릴게요.
                </p>
              </div>

              {/* 아바타 안내 */}
              <div className="mt-8 p-4 bg-[var(--bg2)] border border-[var(--bg3)] rounded-lg text-center">
                <p className="text-[var(--accent)] text-sm mb-2">
                  나만의 아바타를 만들어보세요!
                </p>
                <p className="text-[var(--muted)] text-xs">
                  연결할 때 상대에게 보여지는 나의 모습이에요
                </p>
              </div>

              <div className="mt-8 w-full max-w-xs space-y-3">
                <button
                  onClick={() => router.push("/me")}
                  className="pixel-btn w-full text-lg"
                >
                  아바타 만들기
                </button>
                <button
                  onClick={() => router.push("/record")}
                  className="w-full py-3 text-[var(--muted)] text-sm hover:text-[var(--text)] transition-colors"
                >
                  나중에 할게요
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

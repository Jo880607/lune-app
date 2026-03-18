"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationResult } from "firebase/auth";
import {
  initRecaptcha,
  sendVerificationCode,
  verifyCode,
  formatPhoneNumber,
  onAuthStateChanged,
} from "@/lib/auth";

type Step = "phone" | "code" | "loading";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// 픽셀 달 아이콘
const PixelMoon = ({ size = 80 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
    <rect x="10" y="4" width="12" height="2" fill="#FFE566" />
    <rect x="8" y="6" width="2" height="2" fill="#FFE566" />
    <rect x="22" y="6" width="2" height="2" fill="#FFE566" />
    <rect x="6" y="8" width="2" height="2" fill="#FFE566" />
    <rect x="24" y="8" width="2" height="2" fill="#FFE566" />
    <rect x="4" y="10" width="2" height="12" fill="#FFE566" />
    <rect x="26" y="10" width="2" height="12" fill="#FFE566" />
    <rect x="6" y="22" width="2" height="2" fill="#FFE566" />
    <rect x="24" y="22" width="2" height="2" fill="#FFE566" />
    <rect x="8" y="24" width="2" height="2" fill="#FFE566" />
    <rect x="22" y="24" width="2" height="2" fill="#FFE566" />
    <rect x="10" y="26" width="12" height="2" fill="#FFE566" />
    <rect x="10" y="6" width="12" height="2" fill="#FFF8DC" />
    <rect x="8" y="8" width="16" height="2" fill="#FFF8DC" />
    <rect x="6" y="10" width="20" height="12" fill="#FFF8DC" />
    <rect x="8" y="22" width="16" height="2" fill="#FFF8DC" />
    <rect x="10" y="24" width="12" height="2" fill="#FFF8DC" />
    <rect x="10" y="12" width="2" height="2" fill="#C8A8E9" opacity="0.4" />
    <rect x="18" y="10" width="4" height="2" fill="#C8A8E9" opacity="0.3" />
    <rect x="12" y="18" width="3" height="2" fill="#C8A8E9" opacity="0.35" />
  </svg>
);

export default function LoginForm() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaInitialized = useRef(false);

  // 인증 상태 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        router.replace("/record");
      } else {
        setAuthStatus("unauthenticated");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // RecaptchaVerifier 초기화
  useEffect(() => {
    if (authStatus !== "unauthenticated") return;

    if (recaptchaRef.current && !recaptchaInitialized.current) {
      try {
        initRecaptcha("recaptcha-container");
        recaptchaInitialized.current = true;
      } catch (err) {
        console.error("reCAPTCHA 초기화 실패:", err);
      }
    }
  }, [authStatus]);

  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    let formatted = numbers;

    if (numbers.length > 3 && numbers.length <= 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length > 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }

    setPhoneNumber(formatted);
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/[^0-9]/g, "").length < 10) {
      setError("올바른 전화번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await sendVerificationCode(formattedPhone);
      setConfirmationResult(result);
      setStep("code");
    } catch (err: unknown) {
      console.error("인증번호 전송 실패:", err);
      if (err instanceof Error && err.message.includes("too-many-requests")) {
        setError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError("인증번호 전송에 실패했어요. 다시 시도해주세요.");
      }
      recaptchaInitialized.current = false;
      if (recaptchaRef.current) {
        initRecaptcha("recaptcha-container");
        recaptchaInitialized.current = true;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult || verificationCode.length !== 6) {
      setError("6자리 인증번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyCode(confirmationResult, verificationCode);
      setStep("loading");
      router.push("/onboarding");
    } catch (err) {
      console.error("인증 실패:", err);
      setError("인증번호가 올바르지 않아요.");
    } finally {
      setIsLoading(false);
    }
  };

  const isPhoneValid = phoneNumber.replace(/[^0-9]/g, "").length >= 10;
  const isCodeValid = verificationCode.length === 6;

  // 인증 상태 확인 중일 때 로딩 화면
  if (authStatus === "loading") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: '#0D0D1A' }}
      >
        <div className="float">
          <PixelMoon size={80} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6" style={{ backgroundColor: '#0D0D1A' }}>
      <div id="recaptcha-container" ref={recaptchaRef} />

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-8 float">
          <PixelMoon size={80} />
        </div>

        <h1 className="pixel-title text-xl text-center mb-2" style={{ color: '#C8A8E9' }}>
          LUNE
        </h1>
        <p className="text-center mb-8" style={{ color: '#E8E8F0' }}>
          Lune에 오신 걸 환영해요
        </p>

        {step === "phone" && (
          <div className="w-full max-w-xs">
            <label className="text-xs mb-2 block" style={{ color: '#6B6B8A' }}>
              전화번호
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="010-1234-5678"
              maxLength={13}
              className="w-full border-2 px-4 py-4 text-center text-lg focus:outline-none transition-colors"
              style={{
                backgroundColor: '#1A1A2E',
                borderColor: '#16213E',
                color: '#E8E8F0',
              }}
            />

            {error && (
              <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
            )}

            <button
              onClick={handleSendCode}
              disabled={!isPhoneValid || isLoading}
              className={`pixel-btn w-full text-base mt-6 ${
                !isPhoneValid || isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "전송 중..." : "인증번호 받기"}
            </button>

            <p className="text-xs text-center mt-4" style={{ color: '#6B6B8A' }}>
              본인 확인을 위해 전화번호 인증이 필요해요
            </p>
          </div>
        )}

        {step === "code" && (
          <div className="w-full max-w-xs">
            <label className="text-xs mb-2 block" style={{ color: '#6B6B8A' }}>
              인증번호 6자리
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full border-2 px-4 py-4 text-center text-2xl tracking-[0.5em] focus:outline-none transition-colors"
              style={{
                backgroundColor: '#1A1A2E',
                borderColor: '#16213E',
                color: '#E8E8F0',
              }}
            />

            {error && (
              <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
            )}

            <button
              onClick={handleVerifyCode}
              disabled={!isCodeValid || isLoading}
              className={`pixel-btn w-full text-base mt-6 ${
                !isCodeValid || isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "확인 중..." : "확인"}
            </button>

            <button
              onClick={() => {
                setStep("phone");
                setVerificationCode("");
                setError(null);
              }}
              className="w-full text-xs text-center mt-4 hover:opacity-80"
              style={{ color: '#6B6B8A' }}
            >
              전화번호 다시 입력하기
            </button>
          </div>
        )}

        {step === "loading" && (
          <div className="text-center">
            <p style={{ color: '#C8A8E9' }}>잠시만요...</p>
          </div>
        )}
      </div>

      <div className="text-center pb-8">
        <p className="text-xs" style={{ color: '#6B6B8A' }}>
          계속 진행하면 서비스 이용약관에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}

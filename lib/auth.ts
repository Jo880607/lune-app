import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "./firebase";

// RecaptchaVerifier 인스턴스 저장
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * RecaptchaVerifier 초기화
 * 전화번호 인증 전에 호출 필요
 */
export const initRecaptcha = (containerId: string): RecaptchaVerifier => {
  if (!auth) {
    throw new Error("Firebase Auth가 초기화되지 않았습니다.");
  }

  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA 완료 시 호출
    },
    "expired-callback": () => {
      // reCAPTCHA 만료 시 호출
    },
  });

  return recaptchaVerifier;
};

/**
 * 전화번호로 인증번호 전송
 * @param phoneNumber - 국제 형식 전화번호 (예: +821012345678)
 * @returns ConfirmationResult - 인증 확인용 객체
 */
export const sendVerificationCode = async (
  phoneNumber: string
): Promise<ConfirmationResult> => {
  if (!auth) {
    throw new Error("Firebase Auth가 초기화되지 않았습니다.");
  }
  if (!recaptchaVerifier) {
    throw new Error("RecaptchaVerifier가 초기화되지 않았습니다.");
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    return confirmationResult;
  } catch (error) {
    // reCAPTCHA 리셋
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
    throw error;
  }
};

/**
 * 인증번호 확인
 * @param confirmationResult - sendVerificationCode에서 반환된 객체
 * @param code - 6자리 인증번호
 * @returns User - 인증된 사용자
 */
export const verifyCode = async (
  confirmationResult: ConfirmationResult,
  code: string
): Promise<User> => {
  const result = await confirmationResult.confirm(code);
  return result.user;
};

/**
 * 인증 상태 변경 리스너
 * @param callback - 인증 상태 변경 시 호출될 콜백
 * @returns unsubscribe 함수
 */
export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  console.log("[Auth] onAuthStateChanged 호출, auth 존재:", !!auth);
  if (!auth) {
    // auth가 없으면 미인증 상태로 처리
    console.log("[Auth] auth 없음, 미인증 상태로 콜백 호출");
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, callback);
};

/**
 * 현재 로그인된 사용자 가져오기
 * @returns User | null
 */
export const getCurrentUser = (): User | null => {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
};

/**
 * 로그아웃
 */
export const signOut = async (): Promise<void> => {
  if (!auth) {
    return;
  }
  await firebaseSignOut(auth);
};

/**
 * 전화번호를 국제 형식으로 변환 (한국)
 * @param phoneNumber - 010-1234-5678 또는 01012345678 형식
 * @returns +821012345678 형식
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // 숫자만 추출
  const numbers = phoneNumber.replace(/[^0-9]/g, "");

  // 010으로 시작하면 +82로 변환
  if (numbers.startsWith("010")) {
    return `+82${numbers.slice(1)}`;
  }

  // 이미 국제 형식이면 그대로 반환
  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }

  return `+82${numbers}`;
};

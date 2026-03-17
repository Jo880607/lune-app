import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Record, User, WeeklyAnalysis } from "@/types";

// 기록 저장
export async function saveRecord(
  userId: string,
  type: "voice" | "text",
  content: string,
  isFirstRecord: boolean = false
): Promise<string> {
  console.log("[Firestore] saveRecord 시작:", { userId, type, contentLength: content.length, isFirstRecord });

  const recordData: Omit<Record, "id"> = {
    userId,
    type,
    content,
    createdAt: Timestamp.now(),
    isFirstRecord,
  };

  try {
    const docRef = await addDoc(collection(db, "records"), recordData);
    console.log("[Firestore] saveRecord 성공:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[Firestore] saveRecord 실패:", error);
    throw error;
  }
}

// 기록 불러오기 (createdAt 내림차순)
export async function getRecords(userId: string): Promise<Record[]> {
  console.log("[Firestore] getRecords 시작:", userId);

  try {
    const q = query(
      collection(db, "records"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Record[];
    console.log("[Firestore] getRecords 성공:", records.length, "개");
    return records;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("[Firestore] getRecords 실패:", error);
    // 인덱스 에러인 경우 orderBy 없이 재시도
    if (err.code === "failed-precondition" || err.message?.includes("index")) {
      console.log("[Firestore] 인덱스 없음 - orderBy 없이 재시도");
      const q = query(
        collection(db, "records"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Record[];
      // 클라이언트에서 정렬
      records.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      console.log("[Firestore] getRecords (fallback) 성공:", records.length, "개");
      return records;
    }
    throw error;
  }
}

// 오늘 기록 여부 확인
export async function hasTodayRecord(userId: string): Promise<boolean> {
  console.log("[Firestore] hasTodayRecord 시작:", userId);

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = Timestamp.fromDate(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfDay = Timestamp.fromDate(tomorrow);

    const q = query(
      collection(db, "records"),
      where("userId", "==", userId),
      where("createdAt", ">=", startOfDay),
      where("createdAt", "<", endOfDay)
    );

    const snapshot = await getDocs(q);
    console.log("[Firestore] hasTodayRecord 결과:", !snapshot.empty);
    return !snapshot.empty;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("[Firestore] hasTodayRecord 실패:", error);
    // 인덱스 에러인 경우 전체 조회 후 필터링
    if (err.code === "failed-precondition" || err.message?.includes("index")) {
      console.log("[Firestore] 인덱스 없음 - 전체 조회 후 필터링");
      const q = query(
        collection(db, "records"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hasToday = snapshot.docs.some((doc) => {
        const data = doc.data();
        const recordDate = data.createdAt.toDate();
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });
      console.log("[Firestore] hasTodayRecord (fallback) 결과:", hasToday);
      return hasToday;
    }
    throw error;
  }
}

// 유저 정보 저장
export async function saveUser(
  uid: string,
  nickname: string,
  avatarId?: string
): Promise<void> {
  const userData: User = {
    uid,
    nickname,
    createdAt: Timestamp.now(),
    isActive: true,
    avatarId,
    firstRecordDone: false,
  };

  await setDoc(doc(db, "users", uid), userData);
}

// 유저 정보 불러오기
export async function getUser(uid: string): Promise<User | null> {
  const docRef = doc(db, "users", uid);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as User;
}

// 현재 주차 키 생성 (ISO week: "2026-W12")
export function getCurrentWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
}

// 이번 주 기록 가져오기
export async function getThisWeekRecords(userId: string): Promise<Record[]> {
  console.log("[Firestore] getThisWeekRecords 시작:", userId);

  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);

  try {
    const q = query(
      collection(db, "records"),
      where("userId", "==", userId),
      where("createdAt", ">=", Timestamp.fromDate(monday)),
      where("createdAt", "<", Timestamp.fromDate(sunday))
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Record[];
    console.log("[Firestore] getThisWeekRecords 성공:", records.length, "개");
    return records;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("[Firestore] getThisWeekRecords 실패:", error);
    // 인덱스 에러 시 전체 조회 후 필터링
    if (err.code === "failed-precondition" || err.message?.includes("index")) {
      console.log("[Firestore] 인덱스 없음 - 전체 조회 후 필터링");
      const allRecords = await getRecords(userId);
      const filtered = allRecords.filter((r) => {
        const recordDate = r.createdAt.toDate();
        return recordDate >= monday && recordDate < sunday;
      });
      console.log("[Firestore] getThisWeekRecords (fallback) 성공:", filtered.length, "개");
      return filtered;
    }
    throw error;
  }
}

// 주간 분석 저장
export async function saveAnalysis(
  userId: string,
  weekKey: string,
  analysis: {
    headline: string;
    emotions: string[];
    keywords: string[];
    peakTime: string;
    comparison: string;
    comfortMessage: string;
  }
): Promise<string> {
  console.log("[Firestore] saveAnalysis 시작:", { userId, weekKey });

  const analysisData: Omit<WeeklyAnalysis, "id"> = {
    userId,
    weekKey,
    ...analysis,
    createdAt: Timestamp.now(),
  };

  // weekKey를 문서 ID로 사용하여 중복 방지
  const docId = `${userId}_${weekKey}`;
  await setDoc(doc(db, "analyses", docId), analysisData);
  console.log("[Firestore] saveAnalysis 성공:", docId);
  return docId;
}

// 이번 주 분석 가져오기
export async function getWeeklyAnalysis(
  userId: string,
  weekKey: string
): Promise<WeeklyAnalysis | null> {
  console.log("[Firestore] getWeeklyAnalysis 시작:", { userId, weekKey });

  const docId = `${userId}_${weekKey}`;
  const docRef = doc(db, "analyses", docId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    console.log("[Firestore] getWeeklyAnalysis: 분석 없음");
    return null;
  }

  const data = { id: snapshot.id, ...snapshot.data() } as WeeklyAnalysis;
  console.log("[Firestore] getWeeklyAnalysis 성공:", data.headline);
  return data;
}

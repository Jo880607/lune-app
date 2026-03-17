import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  getCountFromServer,
  onSnapshot,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { Record, User, WeeklyAnalysis, Connection, Message, WaitlistEntry } from "@/types";

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

  // 유저 수 카운터 업데이트
  try {
    await setDoc(
      doc(db, "stats", "global"),
      { userCount: increment(1) },
      { merge: true }
    );
  } catch (error) {
    console.error("[Firestore] stats userCount 업데이트 실패:", error);
  }
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

// ===== 연결 (Connect) 관련 함수 =====

// 연결 생성
export async function createConnection(
  userId: string,
  type: "human" | "ai" | "any",
  emotionTags: string[]
): Promise<string> {
  const user = await getUser(userId);
  const nickname = user?.nickname || "익명";
  const today = new Date().toISOString().split("T")[0];

  const connectionData: Omit<Connection, "id"> = {
    user1Id: userId,
    user2Id: type === "ai" ? "ai" : null,
    type,
    emotionTags,
    status: type === "ai" ? "matched" : "waiting",
    isAI: type === "ai",
    user1Nickname: nickname,
    user2Nickname: type === "ai" ? "달빛" : "",
    date: today,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, "connections"), connectionData);
  console.log("[Firestore] createConnection 성공:", docRef.id);
  return docRef.id;
}

// 매칭 상대 찾기
export async function findMatch(
  userId: string,
  type: "human" | "ai" | "any",
  emotionTags: string[]
): Promise<{ connectionId: string; status: "matched" | "waiting" }> {
  console.log("[Firestore] findMatch 시작:", { userId, type, emotionTags });

  // AI 연결
  if (type === "ai") {
    const id = await createConnection(userId, "ai", emotionTags);
    return { connectionId: id, status: "matched" };
  }

  const today = new Date().toISOString().split("T")[0];

  // 대기 중인 연결 찾기
  try {
    const q = query(
      collection(db, "connections"),
      where("status", "==", "waiting"),
      limit(50)
    );
    const snapshot = await getDocs(q);

    // 오늘 날짜 + 자기 자신 제외 필터링
    const candidates = snapshot.docs.filter((d) => {
      const data = d.data();
      return data.date === today && data.user1Id !== userId;
    });

    if (candidates.length > 0) {
      let bestMatch = candidates[0];

      if (type === "human" && emotionTags.length > 0) {
        // 감정 태그 유사도 기반 정렬
        const scored = candidates.map((d) => {
          const data = d.data();
          const overlap = emotionTags.filter(
            (t) => data.emotionTags?.includes(t)
          ).length;
          return { doc: d, score: overlap };
        });
        scored.sort((a, b) => b.score - a.score);
        bestMatch = scored[0].doc;
      } else {
        // 랜덤 선택
        bestMatch = candidates[Math.floor(Math.random() * candidates.length)];
      }

      // 매칭 성공
      const currentUser = await getUser(userId);
      const nickname = currentUser?.nickname || "익명";
      await updateDoc(doc(db, "connections", bestMatch.id), {
        user2Id: userId,
        user2Nickname: nickname,
        status: "matched",
      });
      console.log("[Firestore] findMatch 매칭 성공:", bestMatch.id);
      return { connectionId: bestMatch.id, status: "matched" };
    }
  } catch (error) {
    console.error("[Firestore] findMatch 검색 에러:", error);
  }

  // 매칭 실패
  if (type === "any") {
    // 상관없음이면 AI로 폴백
    const id = await createConnection(userId, "ai", emotionTags);
    console.log("[Firestore] findMatch AI 폴백:", id);
    return { connectionId: id, status: "matched" };
  }

  // 사람 매칭 대기
  const id = await createConnection(userId, "human", emotionTags);
  console.log("[Firestore] findMatch 대기 생성:", id);
  return { connectionId: id, status: "waiting" };
}

// 연결 정보 조회
export async function getConnection(
  connectionId: string
): Promise<Connection | null> {
  const docRef = doc(db, "connections", connectionId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Connection;
}

// 오늘 연결 조회
export async function getTodayConnection(
  userId: string
): Promise<Connection | null> {
  const today = new Date().toISOString().split("T")[0];

  // user1 또는 user2로 참여한 연결 찾기
  const q1 = query(
    collection(db, "connections"),
    where("user1Id", "==", userId)
  );
  const q2 = query(
    collection(db, "connections"),
    where("user2Id", "==", userId)
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const allDocs = [...snap1.docs, ...snap2.docs];
  // 오늘 날짜 필터링
  const todayDocs = allDocs.filter((d) => d.data().date === today);

  if (todayDocs.length === 0) return null;

  // 활성 연결 우선 (matched > waiting > ended)
  const matched = todayDocs.find((d) => d.data().status === "matched");
  if (matched) return { id: matched.id, ...matched.data() } as Connection;

  const waiting = todayDocs.find((d) => d.data().status === "waiting");
  if (waiting) return { id: waiting.id, ...waiting.data() } as Connection;

  const ended = todayDocs.find((d) => d.data().status === "ended");
  if (ended) return { id: ended.id, ...ended.data() } as Connection;

  return { id: todayDocs[0].id, ...todayDocs[0].data() } as Connection;
}

// 메시지 전송
export async function sendMessage(
  connectionId: string,
  senderId: string,
  content: string
): Promise<string> {
  const messageData: Omit<Message, "id"> = {
    senderId,
    content,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(
    collection(db, "connections", connectionId, "messages"),
    messageData
  );
  console.log("[Firestore] sendMessage 성공:", docRef.id);
  return docRef.id;
}

// 메시지 목록 조회
export async function getMessages(
  connectionId: string
): Promise<Message[]> {
  try {
    const q = query(
      collection(db, "connections", connectionId, "messages"),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Message[];
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "failed-precondition" || err.message?.includes("index")) {
      const snapshot = await getDocs(
        collection(db, "connections", connectionId, "messages")
      );
      const messages = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Message[];
      messages.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
      return messages;
    }
    throw error;
  }
}

// 오늘 메시지 횟수 확인 (최대 2회)
export async function checkMessageCount(
  connectionId: string,
  userId: string
): Promise<{ count: number; canSend: boolean; lastSentAt: Date | null }> {
  const snapshot = await getDocs(
    collection(db, "connections", connectionId, "messages")
  );

  let lastSentAt: Date | null = null;
  let count = 0;

  for (const d of snapshot.docs) {
    const data = d.data();
    if (data.senderId === userId) {
      count++;
      const sentDate = data.createdAt.toDate();
      if (!lastSentAt || sentDate.getTime() > lastSentAt.getTime()) {
        lastSentAt = sentDate;
      }
    }
  }

  // 1시간 간격 체크
  const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
  const canSend =
    count < 2 &&
    (!lastSentAt || lastSentAt.getTime() < oneHourAgo.getTime());

  return { count, canSend, lastSentAt };
}

// ===== 대기자 명단 (Waitlist) 관련 함수 =====

// 대기자 통계 조회
export async function getWaitlistStats(): Promise<{
  userCount: number;
  waitlistCount: number;
}> {
  let userCount = 0;
  let waitlistCount = 0;

  try {
    const statsDoc = await getDoc(doc(db, "stats", "global"));
    if (statsDoc.exists()) {
      userCount = statsDoc.data().userCount || 0;
    }
  } catch (error) {
    console.error("[Firestore] getWaitlistStats userCount 실패:", error);
  }

  try {
    const snapshot = await getCountFromServer(collection(db, "waitlist"));
    waitlistCount = snapshot.data().count;
  } catch (error) {
    console.error("[Firestore] getWaitlistStats waitlistCount 실패:", error);
  }

  return { userCount, waitlistCount };
}

// 대기 신청
export async function joinWaitlist(
  phone: string
): Promise<{ position: number; isExisting: boolean }> {
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  console.log("[Firestore] joinWaitlist 시작:", normalizedPhone);

  // 이미 신청했는지 확인
  const existingDoc = await getDoc(doc(db, "waitlist", normalizedPhone));
  if (existingDoc.exists()) {
    const data = existingDoc.data();
    console.log("[Firestore] joinWaitlist 이미 등록됨:", data.position);
    return { position: data.position, isExisting: true };
  }

  // 현재 대기자 수로 순번 결정
  const snapshot = await getCountFromServer(collection(db, "waitlist"));
  const position = snapshot.data().count + 1;

  await setDoc(doc(db, "waitlist", normalizedPhone), {
    phone: normalizedPhone,
    position,
    surveyDone: false,
    surveyAnswers: null,
    lastVisitDate: null,
    createdAt: Timestamp.now(),
  });

  console.log("[Firestore] joinWaitlist 성공:", { position });
  return { position, isExisting: false };
}

// 내 순번 조회
export async function getWaitlistInfo(
  phone: string
): Promise<WaitlistEntry | null> {
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  const snapshot = await getDoc(doc(db, "waitlist", normalizedPhone));

  if (!snapshot.exists()) return null;
  return snapshot.data() as WaitlistEntry;
}

// 매일 방문 (1칸 앞당김, 하루 1회)
export async function dailyVisit(
  phone: string
): Promise<{ success: boolean; newPosition: number; message: string }> {
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  const docRef = doc(db, "waitlist", normalizedPhone);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return { success: false, newPosition: 0, message: "등록된 정보가 없어요" };
  }

  const data = snapshot.data();
  const today = new Date().toISOString().split("T")[0];

  if (data.lastVisitDate === today) {
    return {
      success: false,
      newPosition: data.position,
      message: "오늘은 이미 방문했어요",
    };
  }

  const newPosition = Math.max(1, data.position - 1);
  await updateDoc(docRef, {
    position: newPosition,
    lastVisitDate: today,
  });

  return {
    success: true,
    newPosition,
    message: "오늘 방문 완료! 1칸 앞당겨졌어요",
  };
}

// 질문 답변 + 15칸 앞당김 (1회만)
export async function submitSurvey(
  phone: string,
  answers: { q1: string; q2: string; q3: string; q4: string }
): Promise<{ success: boolean; newPosition: number; message: string }> {
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  const docRef = doc(db, "waitlist", normalizedPhone);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return { success: false, newPosition: 0, message: "등록된 정보가 없어요" };
  }

  const data = snapshot.data();
  if (data.surveyDone) {
    return {
      success: false,
      newPosition: data.position,
      message: "이미 질문에 답변했어요",
    };
  }

  const newPosition = Math.max(1, data.position - 15);
  await updateDoc(docRef, {
    surveyAnswers: answers,
    surveyDone: true,
    position: newPosition,
  });

  return {
    success: true,
    newPosition,
    message: "답변 완료! 15칸 앞당겨졌어요",
  };
}

// 실시간 순번 구독 (onSnapshot)
export function subscribeToWaitlistPosition(
  phone: string,
  callback: (data: WaitlistEntry | null) => void
): () => void {
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  return onSnapshot(doc(db, "waitlist", normalizedPhone), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as WaitlistEntry);
    } else {
      callback(null);
    }
  });
}

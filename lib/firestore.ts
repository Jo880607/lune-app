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
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { Record, User, WeeklyAnalysis, Connection, Message, WaitlistEntry, SavedConversation } from "@/types";

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

  type WaitingDoc = QueryDocumentSnapshot<DocumentData>;

  // 대기 중인 연결 검색 함수
  const searchWaiting = async (): Promise<WaitingDoc[]> => {
    const q = query(
      collection(db, "connections"),
      where("status", "==", "waiting"),
      where("date", "==", today),
      limit(50)
    );
    const snapshot = await getDocs(q);
    // 자기 자신 제외 + AI 연결 제외
    return snapshot.docs.filter((d) => {
      const data = d.data();
      return data.user1Id !== userId && data.type !== "ai";
    });
  };

  // 후보 중 최적 매칭 선택 함수
  const pickBest = (candidates: WaitingDoc[]): WaitingDoc => {
    if (emotionTags.length > 0) {
      const scored = candidates.map((d) => {
        const data = d.data();
        const overlap = emotionTags.filter(
          (t) => data.emotionTags?.includes(t)
        ).length;
        return { doc: d, score: overlap };
      });
      scored.sort((a, b) => b.score - a.score);
      return scored[0].doc;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  // 매칭 실행 함수
  const tryMatch = async (bestMatch: WaitingDoc) => {
    const currentUser = await getUser(userId);
    const nickname = currentUser?.nickname || "익명";
    await updateDoc(doc(db, "connections", bestMatch.id), {
      user2Id: userId,
      user2Nickname: nickname,
      status: "matched",
    });
    console.log("[Firestore] findMatch 매칭 성공:", bestMatch.id);
    return { connectionId: bestMatch.id, status: "matched" as const };
  };

  // 1차 검색: 대기 중인 연결 찾기
  const candidates = await searchWaiting();
  console.log("[findMatch] 1차 검색 결과:", {
    후보수: candidates.length,
    후보목록: candidates.map((d) => ({ id: d.id, user1: d.data().user1Id, type: d.data().type })),
  });

  if (candidates.length > 0) {
    const best = pickBest(candidates);
    console.log("[findMatch] 1차 매칭 시도:", { targetId: best.id, targetUser1: best.data().user1Id });
    const result = await tryMatch(best);
    console.log("[findMatch] 1차 매칭 성공:", result);
    return result;
  }

  // 대기 상대 없음 — "상관없음"이면 AI 폴백
  if (type === "any") {
    console.log("[findMatch] 대기 상대 없음 + type=any → AI 폴백");
    const id = await createConnection(userId, "ai", emotionTags);
    return { connectionId: id, status: "matched" };
  }

  // 사람 매칭 대기 생성
  const id = await createConnection(userId, "human", emotionTags);
  console.log("[findMatch] 대기 연결 생성 완료:", { connectionId: id, userId });

  // 2차 검색: 대기 생성 직후 다시 검색 (레이스 컨디션 방지)
  // 두 유저가 동시에 대기를 만든 경우, 여기서 서로를 발견
  const retryCandidates = await searchWaiting();
  console.log("[findMatch] 2차 검색 결과:", {
    후보수: retryCandidates.length,
    후보목록: retryCandidates.map((d) => ({ id: d.id, user1: d.data().user1Id, status: d.data().status })),
  });

  if (retryCandidates.length > 0) {
    const best = pickBest(retryCandidates);
    console.log("[findMatch] 2차 매칭 시도:", { myId: id, targetId: best.id, targetUser1: best.data().user1Id });

    // Tie-breaking: ID가 더 작은 쪽이 cancel하고 상대에게 매칭
    // ID가 더 큰 쪽은 대기 유지 → onSnapshot으로 매칭 감지
    if (id < best.id) {
      console.log("[findMatch] 내 ID가 더 작음 → 내가 cancel하고 상대에게 매칭:", { myId: id, targetId: best.id });
      try {
        await updateDoc(doc(db, "connections", id), { status: "cancelled" });
        console.log("[findMatch] 내 대기 취소 완료:", id);
      } catch (e) {
        console.warn("[findMatch] 내 대기 취소 실패:", e);
      }
      const result = await tryMatch(best);
      console.log("[findMatch] 2차 매칭 성공:", result);
      return result;
    } else {
      console.log("[findMatch] 내 ID가 더 큼 → 대기 유지 (상대가 매칭해줄 것):", { myId: id, targetId: best.id });
      // 대기 유지 — 상대 클라이언트가 내 connection을 매칭해줌
      // onSnapshot 리스너가 status=matched를 감지하면 자동으로 채팅 이동
    }
  }

  console.log("[findMatch] 매칭 상대 없음 → 대기 유지:", id);
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

// ===== 대화 보관 (Keep) 관련 함수 =====

// 보관 요청 (유저가 "보관하기" 선택)
export async function requestKeep(
  connectionId: string,
  userId: string,
  wantsToKeep: boolean
): Promise<void> {
  console.log("[Firestore] requestKeep:", { connectionId, userId, wantsToKeep });

  const connectionDoc = await getDoc(doc(db, "connections", connectionId));
  if (!connectionDoc.exists()) {
    throw new Error("연결을 찾을 수 없어요");
  }

  const connection = connectionDoc.data() as Connection;
  const isUser1 = connection.user1Id === userId;

  const currentKeepRequest = connection.keepRequest || {
    user1: null,
    user2: null,
  };

  const updateData = {
    keepRequest: {
      ...currentKeepRequest,
      [isUser1 ? "user1" : "user2"]: wantsToKeep,
      requestedAt: Timestamp.now(),
    },
  };

  await updateDoc(doc(db, "connections", connectionId), updateData);
  console.log("[Firestore] requestKeep 성공");
}

// 보관 상태 조회
export async function getKeepStatus(
  connectionId: string
): Promise<{
  user1: boolean | null;
  user2: boolean | null;
  bothAgreed: boolean;
  anyDeclined: boolean;
  bothResponded: boolean;
}> {
  const connectionDoc = await getDoc(doc(db, "connections", connectionId));
  if (!connectionDoc.exists()) {
    return {
      user1: null,
      user2: null,
      bothAgreed: false,
      anyDeclined: false,
      bothResponded: false,
    };
  }

  const connection = connectionDoc.data() as Connection;
  const keepRequest = connection.keepRequest || { user1: null, user2: null };

  const bothResponded =
    keepRequest.user1 !== null && keepRequest.user2 !== null;
  const bothAgreed = keepRequest.user1 === true && keepRequest.user2 === true;
  const anyDeclined = keepRequest.user1 === false || keepRequest.user2 === false;

  return {
    user1: keepRequest.user1,
    user2: keepRequest.user2,
    bothAgreed,
    anyDeclined,
    bothResponded,
  };
}

// 대화 보관 (conversations 컬렉션에 저장)
export async function saveConversation(
  connectionId: string
): Promise<string> {
  console.log("[Firestore] saveConversation 시작:", connectionId);

  const connection = await getConnection(connectionId);
  if (!connection) {
    throw new Error("연결을 찾을 수 없어요");
  }

  const messages = await getMessages(connectionId);
  if (messages.length === 0) {
    throw new Error("저장할 메시지가 없어요");
  }

  const conversationData: Omit<SavedConversation, "id"> = {
    connectionId,
    user1Id: connection.user1Id,
    user2Id: connection.user2Id || "",
    user1Nickname: connection.user1Nickname,
    user2Nickname: connection.user2Nickname,
    emotionTags: connection.emotionTags,
    messages: messages.map((m) => ({
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt,
    })),
    savedAt: Timestamp.now(),
    date: connection.date,
  };

  const docRef = await addDoc(collection(db, "conversations"), conversationData);
  console.log("[Firestore] saveConversation 성공:", docRef.id);

  // 연결 상태 ended로 변경
  await updateDoc(doc(db, "connections", connectionId), {
    status: "ended",
  });

  return docRef.id;
}

// 대화 삭제 (메시지 subcollection 삭제 + 상태 ended)
export async function deleteConversationMessages(
  connectionId: string
): Promise<void> {
  console.log("[Firestore] deleteConversationMessages 시작:", connectionId);

  // 메시지 subcollection 조회
  const messagesSnapshot = await getDocs(
    collection(db, "connections", connectionId, "messages")
  );

  // 각 메시지 삭제 (Firestore는 batch delete 필요)
  const { writeBatch } = await import("firebase/firestore");
  const batch = writeBatch(db);

  messagesSnapshot.docs.forEach((msgDoc) => {
    batch.delete(doc(db, "connections", connectionId, "messages", msgDoc.id));
  });

  await batch.commit();
  console.log("[Firestore] 메시지 삭제 완료:", messagesSnapshot.size, "개");

  // 연결 상태 ended로 변경
  await updateDoc(doc(db, "connections", connectionId), {
    status: "ended",
  });

  console.log("[Firestore] deleteConversationMessages 완료");
}

// 보관된 대화 목록 조회
export async function getSavedConversations(
  userId: string
): Promise<SavedConversation[]> {
  console.log("[Firestore] getSavedConversations 시작:", userId);

  // user1 또는 user2로 참여한 대화 조회
  const q1 = query(
    collection(db, "conversations"),
    where("user1Id", "==", userId),
    orderBy("savedAt", "desc")
  );
  const q2 = query(
    collection(db, "conversations"),
    where("user2Id", "==", userId),
    orderBy("savedAt", "desc")
  );

  try {
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const conversations = [
      ...snap1.docs.map((d) => ({ id: d.id, ...d.data() } as SavedConversation)),
      ...snap2.docs.map((d) => ({ id: d.id, ...d.data() } as SavedConversation)),
    ];

    // 중복 제거 및 정렬
    const unique = Array.from(
      new Map(conversations.map((c) => [c.id, c])).values()
    );
    unique.sort((a, b) => b.savedAt.toMillis() - a.savedAt.toMillis());

    console.log("[Firestore] getSavedConversations 성공:", unique.length, "개");
    return unique;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "failed-precondition" || err.message?.includes("index")) {
      console.log("[Firestore] 인덱스 없음 - 전체 조회 후 필터링");
      const snapshot = await getDocs(collection(db, "conversations"));
      const conversations = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as SavedConversation))
        .filter((c) => c.user1Id === userId || c.user2Id === userId);
      conversations.sort((a, b) => b.savedAt.toMillis() - a.savedAt.toMillis());
      return conversations;
    }
    throw error;
  }
}

// 연결 상태 실시간 구독 (보관 요청 감지용)
export function subscribeToConnection(
  connectionId: string,
  callback: (connection: Connection | null) => void
): () => void {
  return onSnapshot(doc(db, "connections", connectionId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Connection);
    } else {
      callback(null);
    }
  });
}

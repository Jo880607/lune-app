"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveRecord, getRecords, hasTodayRecord } from "@/lib/firestore";
import { Record } from "@/types";

type RecordMode = "voice" | "text" | null;

// 픽셀 아트 아이콘 컴포넌트들 (16x16 그리드, 1x1 rect 단위)
const PixelMicIcon = ({ size = 32, color = "var(--accent)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    {/* 마이크 헤드 */}
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
    <rect x="5" y="3" width="1" height="1" fill={color} />
    <rect x="6" y="3" width="1" height="1" fill={color} />
    <rect x="7" y="3" width="1" height="1" fill={color} />
    <rect x="8" y="3" width="1" height="1" fill={color} />
    <rect x="9" y="3" width="1" height="1" fill={color} />
    <rect x="10" y="3" width="1" height="1" fill={color} />
    <rect x="5" y="4" width="1" height="1" fill={color} />
    <rect x="6" y="4" width="1" height="1" fill={color} />
    <rect x="7" y="4" width="1" height="1" fill={color} />
    <rect x="8" y="4" width="1" height="1" fill={color} />
    <rect x="9" y="4" width="1" height="1" fill={color} />
    <rect x="10" y="4" width="1" height="1" fill={color} />
    <rect x="5" y="5" width="1" height="1" fill={color} />
    <rect x="6" y="5" width="1" height="1" fill={color} />
    <rect x="7" y="5" width="1" height="1" fill={color} />
    <rect x="8" y="5" width="1" height="1" fill={color} />
    <rect x="9" y="5" width="1" height="1" fill={color} />
    <rect x="10" y="5" width="1" height="1" fill={color} />
    <rect x="6" y="6" width="1" height="1" fill={color} />
    <rect x="7" y="6" width="1" height="1" fill={color} />
    <rect x="8" y="6" width="1" height="1" fill={color} />
    <rect x="9" y="6" width="1" height="1" fill={color} />
    {/* 마이크 받침대 */}
    <rect x="3" y="4" width="1" height="1" fill={color} />
    <rect x="3" y="5" width="1" height="1" fill={color} />
    <rect x="3" y="6" width="1" height="1" fill={color} />
    <rect x="3" y="7" width="1" height="1" fill={color} />
    <rect x="12" y="4" width="1" height="1" fill={color} />
    <rect x="12" y="5" width="1" height="1" fill={color} />
    <rect x="12" y="6" width="1" height="1" fill={color} />
    <rect x="12" y="7" width="1" height="1" fill={color} />
    <rect x="4" y="8" width="1" height="1" fill={color} />
    <rect x="5" y="8" width="1" height="1" fill={color} />
    <rect x="10" y="8" width="1" height="1" fill={color} />
    <rect x="11" y="8" width="1" height="1" fill={color} />
    <rect x="6" y="9" width="1" height="1" fill={color} />
    <rect x="7" y="9" width="1" height="1" fill={color} />
    <rect x="8" y="9" width="1" height="1" fill={color} />
    <rect x="9" y="9" width="1" height="1" fill={color} />
    {/* 스탠드 */}
    <rect x="7" y="10" width="1" height="1" fill={color} />
    <rect x="8" y="10" width="1" height="1" fill={color} />
    <rect x="7" y="11" width="1" height="1" fill={color} />
    <rect x="8" y="11" width="1" height="1" fill={color} />
    <rect x="7" y="12" width="1" height="1" fill={color} />
    <rect x="8" y="12" width="1" height="1" fill={color} />
    {/* 베이스 */}
    <rect x="5" y="13" width="1" height="1" fill={color} />
    <rect x="6" y="13" width="1" height="1" fill={color} />
    <rect x="7" y="13" width="1" height="1" fill={color} />
    <rect x="8" y="13" width="1" height="1" fill={color} />
    <rect x="9" y="13" width="1" height="1" fill={color} />
    <rect x="10" y="13" width="1" height="1" fill={color} />
  </svg>
);

const PixelPencilIcon = ({ size = 32, color = "var(--accent)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    {/* 연필 끝 (지우개) */}
    <rect x="12" y="1" width="1" height="1" fill={color} />
    <rect x="13" y="1" width="1" height="1" fill={color} />
    <rect x="13" y="2" width="1" height="1" fill={color} />
    <rect x="14" y="2" width="1" height="1" fill={color} />
    {/* 연필 몸통 */}
    <rect x="11" y="2" width="1" height="1" fill={color} />
    <rect x="12" y="2" width="1" height="1" fill={color} />
    <rect x="10" y="3" width="1" height="1" fill={color} />
    <rect x="11" y="3" width="1" height="1" fill={color} />
    <rect x="12" y="3" width="1" height="1" fill={color} />
    <rect x="9" y="4" width="1" height="1" fill={color} />
    <rect x="10" y="4" width="1" height="1" fill={color} />
    <rect x="11" y="4" width="1" height="1" fill={color} />
    <rect x="8" y="5" width="1" height="1" fill={color} />
    <rect x="9" y="5" width="1" height="1" fill={color} />
    <rect x="10" y="5" width="1" height="1" fill={color} />
    <rect x="7" y="6" width="1" height="1" fill={color} />
    <rect x="8" y="6" width="1" height="1" fill={color} />
    <rect x="9" y="6" width="1" height="1" fill={color} />
    <rect x="6" y="7" width="1" height="1" fill={color} />
    <rect x="7" y="7" width="1" height="1" fill={color} />
    <rect x="8" y="7" width="1" height="1" fill={color} />
    <rect x="5" y="8" width="1" height="1" fill={color} />
    <rect x="6" y="8" width="1" height="1" fill={color} />
    <rect x="7" y="8" width="1" height="1" fill={color} />
    <rect x="4" y="9" width="1" height="1" fill={color} />
    <rect x="5" y="9" width="1" height="1" fill={color} />
    <rect x="6" y="9" width="1" height="1" fill={color} />
    <rect x="3" y="10" width="1" height="1" fill={color} />
    <rect x="4" y="10" width="1" height="1" fill={color} />
    <rect x="5" y="10" width="1" height="1" fill={color} />
    {/* 연필 촉 */}
    <rect x="2" y="11" width="1" height="1" fill={color} />
    <rect x="3" y="11" width="1" height="1" fill={color} />
    <rect x="4" y="11" width="1" height="1" fill={color} />
    <rect x="1" y="12" width="1" height="1" fill={color} />
    <rect x="2" y="12" width="1" height="1" fill={color} />
    <rect x="3" y="12" width="1" height="1" fill={color} />
    <rect x="1" y="13" width="1" height="1" fill={color} />
    <rect x="2" y="13" width="1" height="1" fill={color} />
    <rect x="1" y="14" width="1" height="1" fill={color} />
  </svg>
);

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
    {/* 종이 외곽 */}
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
    {/* 접힌 모서리 */}
    <rect x="10" y="2" width="1" height="1" fill={color} />
    <rect x="11" y="3" width="1" height="1" fill={color} />
    {/* 줄 */}
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
    {/* 중앙 십자 */}
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
    {/* 대각선 */}
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

const PixelMicLarge = ({ isRecording = false }: { isRecording?: boolean }) => {
  const c = isRecording ? "#fff" : "var(--text)";
  return (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* 마이크 헤드 */}
      <rect x="6" y="1" width="1" height="1" fill={c} />
      <rect x="7" y="1" width="1" height="1" fill={c} />
      <rect x="8" y="1" width="1" height="1" fill={c} />
      <rect x="9" y="1" width="1" height="1" fill={c} />
      <rect x="5" y="2" width="1" height="1" fill={c} />
      <rect x="6" y="2" width="1" height="1" fill={c} />
      <rect x="7" y="2" width="1" height="1" fill={c} />
      <rect x="8" y="2" width="1" height="1" fill={c} />
      <rect x="9" y="2" width="1" height="1" fill={c} />
      <rect x="10" y="2" width="1" height="1" fill={c} />
      <rect x="5" y="3" width="1" height="1" fill={c} />
      <rect x="6" y="3" width="1" height="1" fill={c} />
      <rect x="7" y="3" width="1" height="1" fill={c} />
      <rect x="8" y="3" width="1" height="1" fill={c} />
      <rect x="9" y="3" width="1" height="1" fill={c} />
      <rect x="10" y="3" width="1" height="1" fill={c} />
      <rect x="5" y="4" width="1" height="1" fill={c} />
      <rect x="6" y="4" width="1" height="1" fill={c} />
      <rect x="7" y="4" width="1" height="1" fill={c} />
      <rect x="8" y="4" width="1" height="1" fill={c} />
      <rect x="9" y="4" width="1" height="1" fill={c} />
      <rect x="10" y="4" width="1" height="1" fill={c} />
      <rect x="5" y="5" width="1" height="1" fill={c} />
      <rect x="6" y="5" width="1" height="1" fill={c} />
      <rect x="7" y="5" width="1" height="1" fill={c} />
      <rect x="8" y="5" width="1" height="1" fill={c} />
      <rect x="9" y="5" width="1" height="1" fill={c} />
      <rect x="10" y="5" width="1" height="1" fill={c} />
      <rect x="6" y="6" width="1" height="1" fill={c} />
      <rect x="7" y="6" width="1" height="1" fill={c} />
      <rect x="8" y="6" width="1" height="1" fill={c} />
      <rect x="9" y="6" width="1" height="1" fill={c} />
      {/* 마이크 받침대 */}
      <rect x="3" y="4" width="1" height="1" fill={c} />
      <rect x="3" y="5" width="1" height="1" fill={c} />
      <rect x="3" y="6" width="1" height="1" fill={c} />
      <rect x="3" y="7" width="1" height="1" fill={c} />
      <rect x="12" y="4" width="1" height="1" fill={c} />
      <rect x="12" y="5" width="1" height="1" fill={c} />
      <rect x="12" y="6" width="1" height="1" fill={c} />
      <rect x="12" y="7" width="1" height="1" fill={c} />
      <rect x="4" y="8" width="1" height="1" fill={c} />
      <rect x="5" y="8" width="1" height="1" fill={c} />
      <rect x="10" y="8" width="1" height="1" fill={c} />
      <rect x="11" y="8" width="1" height="1" fill={c} />
      <rect x="6" y="9" width="1" height="1" fill={c} />
      <rect x="7" y="9" width="1" height="1" fill={c} />
      <rect x="8" y="9" width="1" height="1" fill={c} />
      <rect x="9" y="9" width="1" height="1" fill={c} />
      {/* 스탠드 */}
      <rect x="7" y="10" width="1" height="1" fill={c} />
      <rect x="8" y="10" width="1" height="1" fill={c} />
      <rect x="7" y="11" width="1" height="1" fill={c} />
      <rect x="8" y="11" width="1" height="1" fill={c} />
      <rect x="7" y="12" width="1" height="1" fill={c} />
      <rect x="8" y="12" width="1" height="1" fill={c} />
      {/* 베이스 */}
      <rect x="5" y="13" width="1" height="1" fill={c} />
      <rect x="6" y="13" width="1" height="1" fill={c} />
      <rect x="7" y="13" width="1" height="1" fill={c} />
      <rect x="8" y="13" width="1" height="1" fill={c} />
      <rect x="9" y="13" width="1" height="1" fill={c} />
      <rect x="10" y="13" width="1" height="1" fill={c} />
    </svg>
  );
};

export default function RecordPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<RecordMode>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [todayRecord, setTodayRecord] = useState<Record | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setUser(currentUser);

      try {
        // 오늘 기록 여부 확인
        const hasRecord = await hasTodayRecord(currentUser.uid);
        console.log("[Record] hasTodayRecord:", hasRecord);
        if (hasRecord) {
          const records = await getRecords(currentUser.uid);
          console.log("[Record] getRecords:", records);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todaysRecord = records.find((r) => {
            const recordDate = r.createdAt.toDate();
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === today.getTime();
          });
          if (todaysRecord) {
            setTodayRecord(todaysRecord);
          }
        }
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        console.error("[Record] 초기화 에러:", err);
        console.error("[Record] 에러 코드:", err.code);
        console.error("[Record] 에러 메시지:", err.message);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async () => {
    if (!user || !text.trim()) return;

    console.log("[Record] 저장 시작:", { userId: user.uid, textLength: text.trim().length });
    setSaving(true);
    try {
      // 첫 기록인지 확인
      console.log("[Record] getRecords 호출...");
      const records = await getRecords(user.uid);
      console.log("[Record] 기존 기록 수:", records.length);
      const isFirstRecord = records.length === 0;

      console.log("[Record] saveRecord 호출...", { isFirstRecord });
      await saveRecord(user.uid, "text", text.trim(), isFirstRecord);
      console.log("[Record] 저장 성공!");

      if (isFirstRecord) {
        // 첫 기록이면 온보딩 AI 반응 페이지로 이동
        router.push("/onboarding?step=complete");
      } else {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setText("");
          setMode(null);
        }, 2000);
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("[Record] 저장 실패 - 전체 에러:", error);
      console.error("[Record] 에러 코드:", err.code);
      console.error("[Record] 에러 메시지:", err.message);
      alert(`저장에 실패했어요.\n에러: ${err.message || "알 수 없는 오류"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      // 녹음 중지
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // 녹음 시작
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // 스트림 트랙 정리
          stream.getTracks().forEach((track) => track.stop());

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

          if (audioBlob.size === 0) return;

          // Whisper API 호출
          setTranscribing(true);
          try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();

            if (response.ok && data.text) {
              setText(data.text);
            } else {
              alert(data.error || "음성 변환에 실패했어요.");
            }
          } catch {
            alert("음성 변환 중 오류가 발생했어요.");
          } finally {
            setTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch {
        alert("마이크 접근이 허용되지 않았어요.");
      }
    }
  };

  const canSubmit = text.trim().length > 0 && !isRecording && !transcribing;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-[var(--muted)]">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* 헤더 */}
      <header className="p-6 text-center">
        <h1 className="pixel-title text-xl text-[var(--accent)]">기록</h1>
        <p className="text-[var(--muted)] text-sm mt-2">오늘의 나를 남겨보세요</p>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 px-6 pb-24">
        {/* 저장 완료 메시지 */}
        {saved && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[var(--accent)] text-[var(--bg)] px-8 py-4 rounded-lg z-50">
            <p className="text-lg">기록했어요</p>
          </div>
        )}

        {/* 오늘 이미 기록한 경우 */}
        {todayRecord && (
          <div className="flex flex-col items-center py-12">
            <div className="mb-6">
              <PixelMoonIcon size={64} color="var(--yellow)" />
            </div>
            <p className="text-[var(--accent)] text-lg mb-4">오늘의 기록을 남겼어요</p>
            <div className="w-full max-w-sm bg-[var(--bg2)] rounded-lg p-6 border border-[var(--bg3)]">
              <p className="text-[var(--text)] whitespace-pre-wrap">{todayRecord.content}</p>
              <p className="text-[var(--muted)] text-xs mt-4">
                {todayRecord.createdAt.toDate().toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <p className="text-[var(--muted)] text-sm mt-8">
              내일도 기다릴게요
            </p>
          </div>
        )}

        {/* 기록 입력 UI (오늘 기록 안한 경우만) */}
        {!todayRecord && (
          <>
        {/* 모드 선택 카드 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setMode("voice")}
            className={`flex-1 p-6 rounded-lg border-2 transition-all flex flex-col items-center ${
              mode === "voice"
                ? "border-[var(--accent)] bg-[var(--bg2)]"
                : "border-[var(--bg3)] bg-[var(--bg2)] hover:border-[var(--muted)]"
            }`}
          >
            <div className="mb-2">
              <PixelMicIcon size={36} color={mode === "voice" ? "var(--accent)" : "var(--muted)"} />
            </div>
            <div className={`text-sm ${mode === "voice" ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
              음성으로
            </div>
          </button>
          <button
            onClick={() => setMode("text")}
            className={`flex-1 p-6 rounded-lg border-2 transition-all flex flex-col items-center ${
              mode === "text"
                ? "border-[var(--accent)] bg-[var(--bg2)]"
                : "border-[var(--bg3)] bg-[var(--bg2)] hover:border-[var(--muted)]"
            }`}
          >
            <div className="mb-2">
              <PixelPencilIcon size={36} color={mode === "text" ? "var(--accent)" : "var(--muted)"} />
            </div>
            <div className={`text-sm ${mode === "text" ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
              텍스트로
            </div>
          </button>
        </div>

        {/* 음성 녹음 UI */}
        {mode === "voice" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <button
              onClick={handleVoiceToggle}
              disabled={transcribing}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-500 animate-pulse"
                  : transcribing
                  ? "bg-[var(--bg3)] opacity-50 cursor-not-allowed"
                  : "bg-[var(--bg3)] hover:bg-[var(--accent2)]"
              }`}
            >
              <PixelMicLarge isRecording={isRecording} />
            </button>
            <p className="text-[var(--muted)] text-sm">
              {transcribing
                ? "음성을 텍스트로 변환 중..."
                : isRecording
                ? "녹음 중... 다시 누르면 멈춰요"
                : text
                ? "변환 완료! 아래에서 확인하세요"
                : "버튼을 눌러 녹음 시작"}
            </p>
            {/* 변환된 텍스트 또는 안내 */}
            {!isRecording && (
              <div className="w-full max-w-sm">
                {transcribing ? (
                  <div className="bg-[var(--bg2)] rounded-lg p-4 border border-[var(--bg3)] flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                ) : text ? (
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-32 p-4 bg-[var(--bg2)] border-2 border-[var(--bg3)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                ) : (
                  <div className="bg-[var(--bg2)] rounded-lg p-4 border border-[var(--bg3)]">
                    <p className="text-[var(--muted)] text-xs text-center">
                      녹음된 음성이 여기에 표시됩니다
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 텍스트 입력 UI */}
        {mode === "text" && (
          <div className="flex flex-col gap-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="오늘 어떤 하루였나요?"
              className="w-full h-48 p-4 bg-[var(--bg2)] border-2 border-[var(--bg3)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <p className="text-[var(--muted)] text-xs text-right">
              {text.length}자
            </p>
          </div>
        )}

        {/* 모드 미선택 시 안내 */}
        {mode === null && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4">
              <PixelMoonIcon size={48} color="var(--yellow)" />
            </div>
            <p className="text-[var(--muted)]">
              음성 또는 텍스트를 선택해주세요
            </p>
          </div>
        )}

        {/* 안내 문구 */}
        {mode !== null && (
          <div className="mt-8 text-center">
            <p className="text-[var(--muted)] text-sm">
              올린 후엔 수정할 수 없어요.<br />
              그게 오늘의 나예요.
            </p>
          </div>
        )}

        {/* 제출 버튼 */}
        {mode !== null && (
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className={`pixel-btn w-full text-lg ${
                !canSubmit || saving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "저장 중..." : "오늘을 남기기"}
            </button>
          </div>
        )}
          </>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg2)] border-t border-[var(--bg3)]">
        <div className="flex justify-around items-center h-16 max-w-[390px] mx-auto">
          <Link
            href="/record"
            className="flex flex-col items-center gap-1"
          >
            <PixelNoteIcon size={24} color="var(--accent)" />
            <span className="text-xs text-[var(--accent)]">기록</span>
          </Link>
          <Link
            href="/me"
            className="flex flex-col items-center gap-1 group"
          >
            <PixelMoonIcon size={24} color="var(--muted)" />
            <span className="text-xs text-[var(--muted)] group-hover:text-[var(--text)]">나</span>
          </Link>
          <Link
            href="/connect"
            className="flex flex-col items-center gap-1 group"
          >
            <PixelSparkleIcon size={24} color="var(--muted)" />
            <span className="text-xs text-[var(--muted)] group-hover:text-[var(--text)]">연결</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

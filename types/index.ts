import { Timestamp } from "firebase/firestore";

export interface Record {
  id?: string;
  userId: string;
  type: "voice" | "text";
  content: string;
  createdAt: Timestamp;
  isFirstRecord?: boolean;
}

export interface User {
  uid: string;
  nickname: string;
  createdAt: Timestamp;
  isActive: boolean;
  avatarId?: string;
  firstRecordDone?: boolean;
}

export interface WeeklyAnalysis {
  id?: string;
  userId: string;
  weekKey: string; // "2026-W12" 형식
  headline: string;
  emotions: string[];
  keywords: string[];
  peakTime: string;
  comparison: string;
  comfortMessage: string;
  createdAt: Timestamp;
}

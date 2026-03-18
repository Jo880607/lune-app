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

export interface Connection {
  id?: string;
  user1Id: string;
  user2Id: string | null;
  type: "human" | "ai" | "any";
  emotionTags: string[];
  status: "waiting" | "matched" | "ended";
  isAI: boolean;
  user1Nickname: string;
  user2Nickname: string;
  date: string; // "2026-03-17" 형식
  createdAt: Timestamp;
  keepRequest?: {
    user1: boolean | null; // null = 아직 응답 안함, true = 보관, false = 거부
    user2: boolean | null;
    requestedAt?: Timestamp;
  };
}

export interface SavedConversation {
  id?: string;
  connectionId: string;
  user1Id: string;
  user2Id: string;
  user1Nickname: string;
  user2Nickname: string;
  emotionTags: string[];
  messages: {
    senderId: string;
    content: string;
    createdAt: Timestamp;
  }[];
  savedAt: Timestamp;
  date: string;
}

export interface Message {
  id?: string;
  senderId: string;
  content: string;
  createdAt: Timestamp;
}

export interface WaitlistEntry {
  phone: string;
  position: number;
  surveyDone: boolean;
  surveyAnswers: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  } | null;
  lastVisitDate: string | null;
  createdAt: Timestamp;
}

// 16x16 픽셀 아바타 데이터 (각 픽셀은 색상 hex 또는 null)
export type AvatarData = (string | null)[][];

export interface GalleryAvatar {
  id?: string;
  userId: string;
  avatarData: AvatarData;
  likes: number;
  likedBy: string[]; // 좋아요 누른 유저 uid 목록
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

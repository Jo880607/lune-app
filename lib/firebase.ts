import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDX33D8gK7bbiMkLDw8TNzReM5N9wb_iVY",
  authDomain: "lune-app-fd23c.firebaseapp.com",
  projectId: "lune-app-fd23c",
  storageBucket: "lune-app-fd23c.firebasestorage.app",
  messagingSenderId: "556188934508",
  appId: "1:556188934508:web:e47612bc8a121d0dbcd349",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
console.log("[Firebase] App 초기화 완료:", app.name);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("[Firebase] Auth/Firestore/Storage 초기화 완료");

export default app;

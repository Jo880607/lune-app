"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getGalleryAvatars, toggleAvatarLike } from "@/lib/firestore";
import { GalleryAvatar } from "@/types";
import PixelAvatar from "@/components/PixelAvatar";

// 픽셀 아트 아이콘 컴포넌트들
const PixelMoonIcon = ({ size = 24, color = "var(--yellow)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
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
    <rect x="10" y="2" width="1" height="1" fill={color} />
    <rect x="11" y="3" width="1" height="1" fill={color} />
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

const PixelPaletteIcon = ({ size = 24, color = "var(--accent)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    {/* 팔레트 외곽 */}
    <rect x="5" y="2" width="6" height="1" fill={color} />
    <rect x="3" y="3" width="2" height="1" fill={color} />
    <rect x="11" y="3" width="2" height="1" fill={color} />
    <rect x="2" y="4" width="1" height="1" fill={color} />
    <rect x="13" y="4" width="1" height="1" fill={color} />
    <rect x="1" y="5" width="1" height="1" fill={color} />
    <rect x="14" y="5" width="1" height="1" fill={color} />
    <rect x="1" y="6" width="1" height="1" fill={color} />
    <rect x="14" y="6" width="1" height="1" fill={color} />
    <rect x="1" y="7" width="1" height="1" fill={color} />
    <rect x="14" y="7" width="1" height="1" fill={color} />
    <rect x="1" y="8" width="1" height="1" fill={color} />
    <rect x="14" y="8" width="1" height="1" fill={color} />
    <rect x="1" y="9" width="1" height="1" fill={color} />
    <rect x="14" y="9" width="1" height="1" fill={color} />
    <rect x="2" y="10" width="1" height="1" fill={color} />
    <rect x="13" y="10" width="1" height="1" fill={color} />
    <rect x="3" y="11" width="1" height="1" fill={color} />
    <rect x="12" y="11" width="1" height="1" fill={color} />
    <rect x="4" y="12" width="8" height="1" fill={color} />
    {/* 색상 점들 */}
    <rect x="4" y="5" width="2" height="2" fill="#FF8FAB" />
    <rect x="7" y="4" width="2" height="2" fill="#FFE566" />
    <rect x="10" y="5" width="2" height="2" fill="#7BE4A8" />
    <rect x="5" y="8" width="2" height="2" fill="#9B72CF" />
    <rect x="9" y="8" width="2" height="2" fill="#C8A8E9" />
  </svg>
);

// 픽셀 하트 아이콘
const PixelHeartIcon = ({ size = 16, filled = false }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    {filled ? (
      <>
        <rect x="2" y="4" width="2" height="1" fill="#FF8FAB" />
        <rect x="6" y="4" width="2" height="1" fill="#FF8FAB" />
        <rect x="10" y="4" width="2" height="1" fill="#FF8FAB" />
        <rect x="1" y="5" width="4" height="1" fill="#FF8FAB" />
        <rect x="5" y="5" width="4" height="1" fill="#FF8FAB" />
        <rect x="9" y="5" width="4" height="1" fill="#FF8FAB" />
        <rect x="1" y="6" width="6" height="1" fill="#FF8FAB" />
        <rect x="7" y="6" width="6" height="1" fill="#FF8FAB" />
        <rect x="2" y="7" width="5" height="1" fill="#FF8FAB" />
        <rect x="7" y="7" width="5" height="1" fill="#FF8FAB" />
        <rect x="3" y="8" width="4" height="1" fill="#FF8FAB" />
        <rect x="7" y="8" width="4" height="1" fill="#FF8FAB" />
        <rect x="4" y="9" width="3" height="1" fill="#FF8FAB" />
        <rect x="7" y="9" width="3" height="1" fill="#FF8FAB" />
        <rect x="5" y="10" width="2" height="1" fill="#FF8FAB" />
        <rect x="7" y="10" width="2" height="1" fill="#FF8FAB" />
        <rect x="6" y="11" width="2" height="1" fill="#FF8FAB" />
      </>
    ) : (
      <>
        <rect x="2" y="4" width="2" height="1" fill="var(--muted)" />
        <rect x="6" y="4" width="2" height="1" fill="var(--muted)" />
        <rect x="10" y="4" width="2" height="1" fill="var(--muted)" />
        <rect x="1" y="5" width="1" height="1" fill="var(--muted)" />
        <rect x="4" y="5" width="1" height="1" fill="var(--muted)" />
        <rect x="5" y="5" width="1" height="1" fill="var(--muted)" />
        <rect x="8" y="5" width="1" height="1" fill="var(--muted)" />
        <rect x="9" y="5" width="1" height="1" fill="var(--muted)" />
        <rect x="12" y="5" width="1" height="1" fill="var(--muted)" />
        <rect x="1" y="6" width="1" height="1" fill="var(--muted)" />
        <rect x="12" y="6" width="1" height="1" fill="var(--muted)" />
        <rect x="2" y="7" width="1" height="1" fill="var(--muted)" />
        <rect x="11" y="7" width="1" height="1" fill="var(--muted)" />
        <rect x="3" y="8" width="1" height="1" fill="var(--muted)" />
        <rect x="10" y="8" width="1" height="1" fill="var(--muted)" />
        <rect x="4" y="9" width="1" height="1" fill="var(--muted)" />
        <rect x="9" y="9" width="1" height="1" fill="var(--muted)" />
        <rect x="5" y="10" width="1" height="1" fill="var(--muted)" />
        <rect x="8" y="10" width="1" height="1" fill="var(--muted)" />
        <rect x="6" y="11" width="2" height="1" fill="var(--muted)" />
      </>
    )}
  </svg>
);

export default function GalleryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<GalleryAvatar[]>([]);
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUserId(currentUser.uid);

      try {
        const galleryAvatars = await getGalleryAvatars();
        setAvatars(galleryAvatars);
      } catch (error) {
        console.error("[Gallery] 아바타 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLike = async (avatarId: string) => {
    if (!userId || likingId) return;

    setLikingId(avatarId);
    try {
      const result = await toggleAvatarLike(avatarId, userId);
      setAvatars((prev) =>
        prev.map((a) =>
          a.id === avatarId
            ? {
                ...a,
                likes: result.newLikes,
                likedBy: result.liked
                  ? [...(a.likedBy || []), userId]
                  : (a.likedBy || []).filter((id) => id !== userId),
              }
            : a
        )
      );
    } catch (error) {
      console.error("[Gallery] 좋아요 실패:", error);
    } finally {
      setLikingId(null);
    }
  };

  const isLiked = (avatar: GalleryAvatar) =>
    userId ? avatar.likedBy?.includes(userId) : false;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* 헤더 */}
      <header className="p-6 text-center">
        <h1 className="font-galmuri text-xl text-[var(--accent)]">
          오늘의 갤러리
        </h1>
        <p className="text-[var(--muted)] text-xs mt-2">
          다른 사람들의 아바타를 구경해보세요
        </p>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <p className="text-[var(--muted)]">불러오는 중...</p>
          </div>
        ) : avatars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PixelPaletteIcon size={48} color="var(--muted)" />
            <p className="text-[var(--muted)] mt-4 mb-6">
              아직 아바타가 없어요.<br />
              첫 번째로 만들어볼까요?
            </p>
            <Link href="/me" className="pixel-btn">
              내 아바타 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {avatars.map((avatar) => (
              <div
                key={avatar.id}
                className="flex flex-col items-center gap-2 p-3 bg-[var(--bg2)] border border-[var(--bg3)] rounded-lg"
              >
                <PixelAvatar avatarData={avatar.avatarData} size="lg" />
                <button
                  onClick={() => avatar.id && handleLike(avatar.id)}
                  disabled={likingId === avatar.id}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--bg3)] transition-colors disabled:opacity-50"
                >
                  <PixelHeartIcon size={16} filled={isLiked(avatar)} />
                  <span className="text-xs text-[var(--muted)]">
                    {avatar.likes}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg2)] border-t border-[var(--bg3)]">
        <div className="flex justify-around items-center h-16 max-w-[390px] mx-auto">
          <Link
            href="/record"
            className="flex flex-col items-center gap-1 group"
          >
            <PixelNoteIcon size={24} color="var(--muted)" />
            <span className="text-xs font-galmuri text-[var(--muted)] group-hover:text-[var(--text)]">
              기록
            </span>
          </Link>
          <Link href="/me" className="flex flex-col items-center gap-1 group">
            <PixelMoonIcon size={24} color="var(--muted)" />
            <span className="text-xs font-galmuri text-[var(--muted)] group-hover:text-[var(--text)]">
              나
            </span>
          </Link>
          <Link
            href="/connect"
            className="flex flex-col items-center gap-1 group"
          >
            <PixelSparkleIcon size={24} color="var(--muted)" />
            <span className="text-xs font-galmuri text-[var(--muted)] group-hover:text-[var(--text)]">
              연결
            </span>
          </Link>
          <Link href="/gallery" className="flex flex-col items-center gap-1">
            <PixelPaletteIcon size={24} color="var(--accent)" />
            <span className="text-xs font-galmuri text-[var(--accent)]">
              갤러리
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

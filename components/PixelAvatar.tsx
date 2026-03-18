"use client";

import { AvatarData } from "@/types";

interface PixelAvatarProps {
  avatarData: AvatarData | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: 24,  // 1.5px per pixel
  md: 32,  // 2px per pixel
  lg: 64,  // 4px per pixel
};

// 기본 아바타 (빈 상태일 때 표시할 달 모양)
const DEFAULT_AVATAR: AvatarData = Array(16).fill(null).map(() => Array(16).fill(null));

export default function PixelAvatar({
  avatarData,
  size = "md",
  className = "",
}: PixelAvatarProps) {
  const pixelSize = SIZES[size];
  const data = avatarData || DEFAULT_AVATAR;

  // 아바타가 비어있는지 확인
  const isEmpty = !avatarData || avatarData.every((row) => row.every((cell) => cell === null));

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 16 16"
      style={{ imageRendering: "pixelated" }}
      className={className}
    >
      {/* 배경 (어두운 원형) */}
      <rect x="0" y="0" width="16" height="16" fill="var(--bg2)" rx="2" />

      {isEmpty ? (
        // 기본 달 아이콘 (아바타가 없을 때) - 16x16 보름달 픽셀 아트
        <>
          {/* 달 외곽 */}
          <rect x="5" y="2" width="6" height="1" fill="#C8A8E9" />
          <rect x="3" y="3" width="2" height="1" fill="#C8A8E9" />
          <rect x="11" y="3" width="2" height="1" fill="#C8A8E9" />
          <rect x="2" y="4" width="1" height="1" fill="#C8A8E9" />
          <rect x="13" y="4" width="1" height="1" fill="#C8A8E9" />
          <rect x="2" y="5" width="1" height="2" fill="#C8A8E9" />
          <rect x="13" y="5" width="1" height="2" fill="#C8A8E9" />
          <rect x="1" y="7" width="1" height="2" fill="#C8A8E9" />
          <rect x="14" y="7" width="1" height="2" fill="#C8A8E9" />
          <rect x="2" y="9" width="1" height="2" fill="#C8A8E9" />
          <rect x="13" y="9" width="1" height="2" fill="#C8A8E9" />
          <rect x="2" y="11" width="1" height="1" fill="#C8A8E9" />
          <rect x="13" y="11" width="1" height="1" fill="#C8A8E9" />
          <rect x="3" y="12" width="2" height="1" fill="#C8A8E9" />
          <rect x="11" y="12" width="2" height="1" fill="#C8A8E9" />
          <rect x="5" y="13" width="6" height="1" fill="#C8A8E9" />
          {/* 달 내부 채우기 */}
          <rect x="5" y="3" width="6" height="1" fill="#E8D4F8" />
          <rect x="3" y="4" width="10" height="1" fill="#E8D4F8" />
          <rect x="3" y="5" width="10" height="2" fill="#E8D4F8" />
          <rect x="2" y="7" width="12" height="2" fill="#E8D4F8" />
          <rect x="3" y="9" width="10" height="2" fill="#E8D4F8" />
          <rect x="3" y="11" width="10" height="1" fill="#E8D4F8" />
          <rect x="5" y="12" width="6" height="1" fill="#E8D4F8" />
          {/* 달 크레이터 (작은 점들) */}
          <rect x="5" y="5" width="2" height="1" fill="#C8A8E9" />
          <rect x="10" y="7" width="2" height="1" fill="#C8A8E9" />
          <rect x="6" y="10" width="1" height="1" fill="#C8A8E9" />
        </>
      ) : (
        // 사용자 정의 아바타
        data.map((row, y) =>
          row.map((color, x) =>
            color ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={color}
              />
            ) : null
          )
        )
      )}
    </svg>
  );
}

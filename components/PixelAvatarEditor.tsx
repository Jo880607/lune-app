"use client";

import { useState, useCallback, useRef } from "react";
import { AvatarData } from "@/types";

interface PixelAvatarEditorProps {
  initialData?: AvatarData;
  onSave: (data: AvatarData) => void;
  onCancel: () => void;
  saving?: boolean;
}

const PALETTE = [
  "#C8A8E9", // 달빛 연보라 (accent)
  "#FFE566", // 별빛 노랑 (yellow)
  "#E8E8F0", // 기본 텍스트 (text)
  "#9B72CF", // 포인트 진한 (accent2)
  "#6B6B8A", // 흐린 텍스트 (muted)
  "#7BE4A8", // 민트 그린
  "#FF8FAB", // 핑크
];

const GRID_SIZE = 16;
const PIXEL_SIZE = 16; // 캔버스에서 각 픽셀 크기 (px)

// 빈 16x16 배열 생성
function createEmptyGrid(): AvatarData {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));
}

export default function PixelAvatarEditor({
  initialData,
  onSave,
  onCancel,
  saving = false,
}: PixelAvatarEditorProps) {
  const [grid, setGrid] = useState<AvatarData>(
    initialData || createEmptyGrid()
  );
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE[0]);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 픽셀 색칠
  const paintPixel = useCallback(
    (x: number, y: number) => {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

      setGrid((prev) => {
        const newGrid = prev.map((row) => [...row]);
        newGrid[y][x] = isEraser ? null : selectedColor;
        return newGrid;
      });
    },
    [selectedColor, isEraser]
  );

  // 마우스/터치 좌표를 그리드 좌표로 변환
  const getGridPosition = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!canvasRef.current) return null;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / PIXEL_SIZE);
      const y = Math.floor((clientY - rect.top) / PIXEL_SIZE);

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        return { x, y };
      }
      return null;
    },
    []
  );

  // 마우스 이벤트
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const pos = getGridPosition(e.clientX, e.clientY);
    if (pos) paintPixel(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getGridPosition(e.clientX, e.clientY);
    if (pos) paintPixel(pos.x, pos.y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // 터치 이벤트
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const touch = e.touches[0];
    const pos = getGridPosition(touch.clientX, touch.clientY);
    if (pos) paintPixel(pos.x, pos.y);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing) return;
    const touch = e.touches[0];
    const pos = getGridPosition(touch.clientX, touch.clientY);
    if (pos) paintPixel(pos.x, pos.y);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  // 색상 선택
  const handleColorSelect = (color: string) => {
    setIsEraser(false);
    setSelectedColor(color);
  };

  // 지우개 선택
  const handleEraserSelect = () => {
    setIsEraser(true);
  };

  // 전체 지우기
  const handleClear = () => {
    setGrid(createEmptyGrid());
  };

  // 저장
  const handleSave = () => {
    onSave(grid);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-[var(--bg)] rounded-lg">
      {/* 타이틀 */}
      <h2 className="text-[var(--accent)] text-lg font-galmuri">아바타 편집</h2>

      {/* 캔버스 */}
      <div
        ref={canvasRef}
        className="relative border-2 border-[var(--bg3)] rounded cursor-crosshair touch-none"
        style={{
          width: GRID_SIZE * PIXEL_SIZE,
          height: GRID_SIZE * PIXEL_SIZE,
          backgroundColor: "var(--bg2)",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 그리드 */}
        {grid.map((row, y) =>
          row.map((color, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: x * PIXEL_SIZE,
                top: y * PIXEL_SIZE,
                width: PIXEL_SIZE,
                height: PIXEL_SIZE,
                backgroundColor: color || "transparent",
                boxSizing: "border-box",
              }}
            />
          ))
        )}

        {/* 그리드 라인 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--bg3) 1px, transparent 1px),
              linear-gradient(to bottom, var(--bg3) 1px, transparent 1px)
            `,
            backgroundSize: `${PIXEL_SIZE}px ${PIXEL_SIZE}px`,
            opacity: 0.3,
          }}
        />
      </div>

      {/* 팔레트 */}
      <div className="flex flex-wrap gap-2 justify-center items-center">
        {PALETTE.map((color) => (
          <button
            key={color}
            onClick={() => handleColorSelect(color)}
            className={`w-8 h-8 rounded border-2 transition-all ${
              !isEraser && selectedColor === color
                ? "border-[var(--yellow)] scale-110"
                : "border-[var(--bg3)]"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        {/* 지우개 버튼 */}
        <button
          onClick={handleEraserSelect}
          className={`h-8 px-3 rounded border-2 transition-all font-galmuri text-sm ${
            isEraser
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-[var(--bg3)] text-[var(--muted)]"
          }`}
          style={{ backgroundColor: "var(--bg2)" }}
          title="지우개"
        >
          ✕ 지우개
        </button>
      </div>

      {/* 현재 도구 표시 */}
      <p className="text-[var(--muted)] text-xs">
        {isEraser ? "지우개 선택됨" : `선택 색상: ${selectedColor}`}
      </p>

      {/* 버튼들 */}
      <div className="flex gap-3">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm text-[var(--muted)] border border-[var(--bg3)] rounded hover:text-[var(--text)] hover:border-[var(--muted)] transition-colors"
        >
          전체 지우기
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-[var(--muted)] border border-[var(--bg3)] rounded hover:text-[var(--text)] hover:border-[var(--muted)] transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="pixel-btn disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";

/**
 * 太極圖(陰陽魚)疊加層:半透明陰陽魚蓋住成個九宮格,用嚟切割/演示
 * 課文 §4 嗰條太極線——上陰下陽、陰陽交合;拖住轉就見到
 * 陰魚游入陽位、陽魚游入陰位(陰極轉陽、陽極轉陰)。
 * (前身係八卦環,Hector 指正:要疊嘅係陰陽魚,唔係八卦環。)
 * 正位(角度 0):SVG 內部預轉 -90°,令陰魚喺上、陽魚喺下。
 * 外層 borderRadius 50% + overflow hidden 裁成正圓:旋轉嗰陣
 * 唔會有角黐出嚟撐爆版面;九宮格每格方形,成格係正方形,魚先係正圓。
 */
export default function TaijiOverlay({
  angle,
  snapping,
  onRotate,
  onDragStart,
  onRelease,
}: {
  angle: number;
  snapping: boolean;
  onRotate: (deg: number) => void;
  onDragStart: () => void;
  onRelease: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ startPointer: number; startAngle: number } | null>(null);

  const pointerAngle = (e: React.PointerEvent) => {
    const el = rootRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    return (Math.atan2(y, x) * 180) / Math.PI;
  };

  const norm = (d: number) => {
    let v = d % 360;
    if (v > 180) v -= 360;
    if (v < -180) v += 360;
    return v;
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        overflow: "hidden",
        touchAction: "none",
        cursor: "grab",
        zIndex: 3,
      }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        drag.current = { startPointer: pointerAngle(e), startAngle: angle };
        onDragStart();
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const delta = norm(pointerAngle(e) - drag.current.startPointer);
        onRotate(drag.current.startAngle + delta);
      }}
      onPointerUp={() => {
        drag.current = null;
        onRelease();
      }}
      onPointerCancel={() => {
        drag.current = null;
        onRelease();
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `rotate(${angle}deg)`,
          transition: snapping ? "transform 0.3s ease" : "none",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label="太極圖(陰陽魚,可拖拽旋轉)"
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          {/* 預轉 -90°:呢條 path 本身陽在左、陰在右;轉完陰在上、陽在下(上陰下陽) */}
          <g transform="rotate(-90 50 50)">
            {/* 陽魚(淺) */}
            <circle cx="50" cy="50" r="49" fill="rgba(245,245,240,0.55)" />
            {/* 陰魚(深) */}
            <path
              d="M50,1 a49,49 0 0,1 0,98 a24.5,24.5 0 0,1 0,-49 a24.5,24.5 0 0,0 0,-49 Z"
              fill="rgba(12,12,16,0.62)"
            />
            {/* 魚眼:陽中陰種、陰中陽種 */}
            <circle cx="50" cy="25.5" r="6" fill="rgba(12,12,16,0.85)" />
            <circle cx="50" cy="74.5" r="6" fill="rgba(245,245,240,0.9)" />
          </g>
          <circle cx="50" cy="50" r="49" fill="none" stroke="var(--ink-faint)" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  );
}

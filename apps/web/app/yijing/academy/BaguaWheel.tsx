"use client";

import { useRef } from "react";

/**
 * 八卦圓圖疊加層:圓環載住八隻卦,疊喺九宮格上面俾人拖住轉。
 * 拖拽計角度(以格心為軸),放手由 parent snap 去最近 45°;
 * 每隻卦牌 counter-rotate,轉幾多都保持正向易讀。
 */
export default function BaguaWheel({
  seats,
  symbols,
  angle,
  snapping,
  onRotate,
  onDragStart,
  onRelease,
}: {
  seats: (string | null)[];
  symbols: Record<string, string>;
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
      role="img"
      aria-label="八卦圓圖(可拖拽旋轉)"
      style={{
        position: "absolute",
        inset: 0,
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
        {/* 圓環 */}
        <div
          style={{
            position: "absolute",
            inset: "3.5%",
            border: "1.5px dashed var(--ink-faint)",
            borderRadius: "50%",
          }}
        />
        {/* 中宮本身已有 ☯,圓環唔再疊多個(免雙重影);中心點細圈標示轉軸 */}
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "var(--ink-faint)",
          }}
        />
        {seats.map((name, i) => {
          if (!name) return null;
          const dx = (i % 3) - 1;
          const dy = Math.floor(i / 3) - 1;
          const a = Math.atan2(dy, dx);
          const x = 50 + 33.5 * Math.cos(a);
          const y = 50 + 33.5 * Math.sin(a);
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${-angle}deg)`,
                transition: snapping ? "transform 0.3s ease" : "none",
                background: "var(--card)",
                border: "1.5px solid var(--line-strong)",
                borderRadius: "999px",
                padding: "0.14rem 0.5rem",
                fontSize: "0.8rem",
                fontWeight: 800,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
              }}
            >
              {name} {symbols[name]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

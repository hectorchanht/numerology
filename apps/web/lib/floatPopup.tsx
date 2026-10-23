"use client";

import {
  createElement,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type Placement,
} from "@floating-ui/react";

/* ── 全應用唯一的浮動彈窗定位(POPUP POSITIONING RULE,2026-10-23) ──
 * 所有 popup/tooltip/dropdown 一律經此 hook 定位,不再手寫 left/top。
 * flip() + shift({ padding: 8 }) 保證彈窗永不超出 viewport;
 * strategy "fixed" 使其逃出 overflow 容器;autoUpdate 在 scroll/resize 時重算。
 * 在 360px 窄屏同樣有效(shift 會把彈窗推回可視區)。
 */

export interface FloatPopup {
  open: boolean;
  setOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  /** 掛到浮動元素上的 ref */
  floatingRef: (el: HTMLElement | null) => void;
  /** 攤到浮動元素 style 上的定位樣式(position:fixed + left/top) */
  floatingStyles: CSSProperties;
}

export function useFloatPopup(
  anchorRef: RefObject<HTMLElement | null>,
  placement: Placement = "bottom-start",
): FloatPopup {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    placement,
    strategy: "fixed",
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  // anchor 可能比 hook 晚掛載,每 render 確保 reference 已設定。
  useEffect(() => {
    if (anchorRef.current) refs.setReference(anchorRef.current);
  });

  // POPUP DISMISSAL RULE(standing):點別處 / 按 Escape 即關。
  // anchor 內的 pointerdown 交給 anchor 自己的 onClick 切換,不在此關閉。
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (refs.floating.current?.contains(t)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, anchorRef, refs]);

  return { open, setOpen, floatingRef: refs.setFloating, floatingStyles };
}

/* ── 彈窗卡片外觀(沿用 redesign 的深色 Apple-minimal 卡片語言) ── */

const CARD_STYLE: CSSProperties = {
  zIndex: 50,
  minWidth: "220px",
  maxWidth: "300px",
  background: "var(--card-2)",
  border: "1px solid var(--label-2)",
  borderRadius: "8px",
  padding: "0.6rem 0.8rem",
  fontSize: "0.8rem",
  lineHeight: 1.6,
  color: "var(--label)",
  boxShadow: "var(--pop-shadow)",
};

/**
 * 浮動卡片:把 useFloatPopup 的 floatingRef + floatingStyles 攤上來即完成定位。
 * 用法:
 *   const anchorRef = useRef<HTMLSpanElement | null>(null);
 *   const { open, setOpen, floatingRef, floatingStyles } = useFloatPopup(anchorRef);
 *   <span ref={anchorRef} onClick={() => setOpen(v => !v)}>…</span>
 *   {open && <FloatingCard floatingRef={floatingRef} floatingStyles={floatingStyles}>…</FloatingCard>}
 */
export function FloatingCard({
  floatingRef,
  floatingStyles,
  style,
  children,
}: {
  floatingRef: (el: HTMLElement | null) => void;
  floatingStyles: CSSProperties;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return createElement(
    "div",
    {
      ref: floatingRef,
      role: "dialog",
      style: { ...CARD_STYLE, ...floatingStyles, ...style } as CSSProperties,
    },
    children,
  );
}

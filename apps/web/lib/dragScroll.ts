/**
 * 桌面滑鼠拖拽捲動橫向 strip(.strip / .filter-chips 等)。
 *
 * 做法:document 層事件委派,一次掛載就覆蓋全站所有現在同將來嘅橫向 strip,
 * 唔使每個 strip 逐個加 ref。只處理 pointerType === "mouse"——
 * 觸控照用瀏覽器原生捲動,完全唔受影響。
 * 拖過門檻(DRAG_THRESHOLD px)先算拖拽:之前一律當普通點擊,chip 照常可按;
 * 真係拖咗之後,吞掉隨後嗰下 click,免得放手時誤按到 chip。
 */

/** 會被拖拽捲動嘅橫向容器。 */
export const DRAG_SCROLL_SELECTOR = ".strip, .filter-chips";
/** 移動超過幾多 px 先當拖拽(少過呢個 = 點擊)。 */
export const DRAG_THRESHOLD = 6;

/** 純狀態機(無 DOM,可測試):記住起點,按指標位置計出新 scrollLeft。 */
export function createDragTracker(threshold = DRAG_THRESHOLD) {
  let startX = 0;
  let startScroll = 0;
  let active = false;
  let dragging = false;
  return {
    start(x: number, scrollLeft: number) {
      startX = x;
      startScroll = scrollLeft;
      active = true;
      dragging = false;
    },
    /** 回傳 null = 未算拖拽(仍係點擊);否則係應設嘅 scrollLeft。 */
    move(x: number): number | null {
      if (!active) return null;
      const dx = x - startX;
      if (!dragging && Math.abs(dx) < threshold) return null;
      dragging = true;
      return startScroll - dx;
    },
    /** 結束;回傳今次係咪拖拽(係就要吞 click)。 */
    end(): boolean {
      const was = active && dragging;
      active = false;
      dragging = false;
      return was;
    },
    get dragging() {
      return dragging;
    },
  };
}

/** 喺 document 掛上拖拽捲動;回傳解除函數。 */
export function attachDragScroll(doc: Document): () => void {
  const tracker = createDragTracker();
  let el: HTMLElement | null = null;
  let pointerId = -1;

  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const target = e.target instanceof Element ? e.target : null;
    const strip = target?.closest<HTMLElement>(DRAG_SCROLL_SELECTOR) ?? null;
    // 冇得捲(內容未爆闊,或桌面版變咗直排目錄)就唔理。
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return;
    el = strip;
    pointerId = e.pointerId;
    tracker.start(e.clientX, strip.scrollLeft);
  };

  const onMove = (e: PointerEvent) => {
    if (!el || e.pointerId !== pointerId) return;
    const next = tracker.move(e.clientX);
    if (next === null) return;
    if (!el.classList.contains("dragging")) {
      el.classList.add("dragging");
      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* 指標已釋放:忽略 */
      }
    }
    el.scrollLeft = next;
    e.preventDefault();
  };

  const onUp = (e: PointerEvent) => {
    if (!el || e.pointerId !== pointerId) return;
    const strip = el;
    el = null;
    pointerId = -1;
    strip.classList.remove("dragging");
    if (tracker.end()) {
      // 吞掉放手後嗰下 click(只一次;下一個事件循環自動解除,唔會食咗之後嘅正常點擊)。
      const swallow = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      doc.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => doc.removeEventListener("click", swallow, { capture: true }), 0);
    }
  };

  // 拖拽時唔好觸發原生 link/圖片拖放。
  const onDragStart = (e: DragEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest(DRAG_SCROLL_SELECTOR)) e.preventDefault();
  };

  doc.addEventListener("pointerdown", onDown);
  doc.addEventListener("pointermove", onMove, { passive: false });
  doc.addEventListener("pointerup", onUp);
  doc.addEventListener("pointercancel", onUp);
  doc.addEventListener("dragstart", onDragStart);
  return () => {
    doc.removeEventListener("pointerdown", onDown);
    doc.removeEventListener("pointermove", onMove);
    doc.removeEventListener("pointerup", onUp);
    doc.removeEventListener("pointercancel", onUp);
    doc.removeEventListener("dragstart", onDragStart);
  };
}

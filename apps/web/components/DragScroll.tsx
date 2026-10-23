"use client";

import { useEffect } from "react";
import { attachDragScroll } from "@/lib/dragScroll";

/** 全站一次掛載:桌面滑鼠可拖拽捲動所有橫向 strip(觸控唔受影響)。冇 UI。 */
export function DragScroll() {
  useEffect(() => attachDragScroll(document), []);
  return null;
}

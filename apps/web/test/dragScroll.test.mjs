import { test } from "node:test";
import assert from "node:assert/strict";
import { createDragTracker, DRAG_SCROLL_SELECTOR, DRAG_THRESHOLD } from "../test-dist/dragScroll.js";

test("細過門檻 = 點擊(唔捲、唔吞 click)", () => {
  const t = createDragTracker();
  t.start(100, 50);
  assert.equal(t.move(100 + DRAG_THRESHOLD - 1), null);
  assert.equal(t.end(), false);
});

test("過門檻 = 拖拽:反向捲動,放手時要吞 click", () => {
  const t = createDragTracker(6);
  t.start(100, 50);
  assert.equal(t.move(80), 70); // 向左拖 20px → 內容向右捲 20px
  assert.equal(t.move(140), 10); // 已係拖拽:之後細移動都照跟
  assert.equal(t.dragging, true);
  assert.equal(t.end(), true);
  assert.equal(t.move(0), null); // 結束後唔再反應
});

test("選擇器覆蓋 .strip 同 .filter-chips", () => {
  assert.ok(DRAG_SCROLL_SELECTOR.includes(".strip"));
  assert.ok(DRAG_SCROLL_SELECTOR.includes(".filter-chips"));
});

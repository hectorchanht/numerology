import { test } from "node:test";
import assert from "node:assert/strict";
import { speechText } from "../test-dist/speechText.js";

test("去標題/粗體/斜體符號,留文字", () => {
  assert.equal(
    speechText("## 性格特質\n此命**正官**透干,*聰明*過人。"),
    "性格特質\n此命正官透干,聰明過人。",
  );
});

test("連結與圖片只留文字", () => {
  assert.equal(
    speechText("見[紫微](https://x)與![圖](y)"),
    "見紫微與圖",
  );
});

test("去列表符號與引用", () => {
  assert.equal(
    speechText("- 甲\n- 乙\n> 註:好"),
    "甲\n乙\n註:好",
  );
});

test("去行內代碼與代碼塊", () => {
  assert.equal(
    speechText("用 `x` 函數\n```js\ncode();\n```完"),
    "用 x 函數\n完",
  );
});

test("空字串 → 空字串", () => {
  assert.equal(speechText(""), "");
});

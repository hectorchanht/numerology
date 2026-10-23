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

test("fixYijingSpeech:易經多音字按語言代入同音字", async () => {
  const { fixYijingSpeech } = await import("../test-dist/speechText.js");
  // 普通話:乾→錢(qián) 屯→諄(zhūn) 否→匹(pǐ) 賁→幣(bì) 解→謝(xiè) 畜→蓄(xù)
  assert.equal(fixYijingSpeech("乾。元亨利貞。", "zh-CN"), "錢。元亨利貞。");
  assert.equal(fixYijingSpeech("屯否賁解畜", "zh-CN"), "諄匹幣謝蓄");
  // 廣東話:乾→堅(kin4) 屯→樽(zeon1) 否→痞(pei2) 賁→臂(bei3) 解→亥(haai6) 畜→速(cuk1)
  assert.equal(fixYijingSpeech("乾。元亨利貞。", "zh-HK"), "堅。元亨利貞。");
  assert.equal(fixYijingSpeech("屯否賁解畜", "zh-HK"), "樽痞臂亥速");
  // 無多音字 → 原文唔變
  assert.equal(fixYijingSpeech("Hello world", "zh-CN"), "Hello world");
  assert.equal(fixYijingSpeech("坤。元亨。", "zh-HK"), "坤。元亨。");
});

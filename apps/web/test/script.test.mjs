import { test } from "node:test";
import assert from "node:assert/strict";
import { warmScript } from "@dawn-studio/zh-convert";
import { lockScript, scriptLocker } from "../test-dist/script.js";

// —— 占(卜筮義)保護:tongwen s2t 會將「占」→「佔」,app 層用 PUA 擋住 ——
test("script:占(卜筮義)唔會被轉做佔", async () => {
  await warmScript("zh-Hant");
  assert.equal(lockScript("易經占例庫", "zht"), "易經占例庫");
  assert.equal(lockScript("占辭原文", "zht"), "占辭原文");
  assert.equal(lockScript("陳敬仲占", "zht"), "陳敬仲占");
  assert.equal(lockScript("占卜結果", "zht"), "占卜結果");
});

test("script:占有照轉佔有(正確繁體)", async () => {
  await warmScript("zh-Hant");
  assert.equal(lockScript("占有慾很強", "zht"), "佔有慾很強");
});

test("script:簡體目標唔受影響", async () => {
  await warmScript("zh-Hans");
  assert.equal(lockScript("易經占例庫", "zhs"), "易经占例库");
  assert.equal(lockScript("佔有慾", "zhs"), "占有欲");
});

test("script:scriptLocker(AI 輸出)同樣保護占", async () => {
  const lock = await scriptLocker("zht");
  assert.ok(lock);
  assert.equal(lock("占得觀之否,占斷如下"), "占得觀之否,占斷如下");
});

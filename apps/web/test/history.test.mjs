import { test } from "node:test";
import assert from "node:assert/strict";
import {
  archiveSectionInto,
  versionsOf,
  deleteVersionFrom,
  MAX_SECTION_VERSIONS,
} from "../test-dist/history.js";

const KEY = "report:personality";
const sec = (markdown, at, provider = "p1", model = "m1") => ({
  markdown, lens: "both", provider, model, at,
});
const reading = (sections = {}, sectionHistory) => ({
  id: "id1", createdAt: 1, updatedAt: 1, input: {}, locale: "zht", chart: {},
  sections,
  ...(sectionHistory ? { sectionHistory } : {}),
});

test("history:archive 新版後舊版保留(舊記錄現行版做種子)", () => {
  const v1 = sec("第一版", 100);
  const v2 = sec("第二版", 200, "mac-llm", "qwen3:30b");
  const r = reading({ [KEY]: v1 }); // 舊記錄:冇 sectionHistory
  const out = archiveSectionInto(r, KEY, v2);
  assert.equal(out.sections[KEY], v2);
  assert.deepEqual(versionsOf(out, KEY), [v2, v1]);
  // 原記錄唔被污染
  assert.equal(r.sections[KEY], v1);
  assert.equal(r.sectionHistory, undefined);
});

test("history:versionsOf 對舊記錄以現行版合成一版", () => {
  const v1 = sec("唯一版", 100);
  assert.deepEqual(versionsOf(reading({ [KEY]: v1 }), KEY), [v1]);
  assert.deepEqual(versionsOf(reading({}), KEY), []);
});

test("history:versionsOf 現行版排第一且同已存版本去重", () => {
  const v1 = sec("舊版", 100);
  const v2 = sec("現行", 200);
  // 已存列表入面已包含現行版嗰一份(正常寫入路徑就係咁)
  const r = reading({ [KEY]: v2 }, { [KEY]: [v2, v1] });
  assert.deepEqual(versionsOf(r, KEY), [v2, v1]);
});

test("history:archive 完全相同版本(at+markdown)唔重複入檔", () => {
  const v1 = sec("同文", 100);
  const r = archiveSectionInto(reading({}), KEY, v1);
  const again = archiveSectionInto(r, KEY, { ...v1 });
  assert.equal(versionsOf(again, KEY).length, 1);
  // 同 at 但唔同內文 = 另一版,要保留
  const other = archiveSectionInto(r, KEY, sec("另一文", 100));
  assert.equal(versionsOf(other, KEY).length, 2);
});

test("history:delete 現行版自動升下一版", () => {
  const v1 = sec("一", 100), v2 = sec("二", 200), v3 = sec("三", 300);
  let r = reading({});
  r = archiveSectionInto(r, KEY, v1);
  r = archiveSectionInto(r, KEY, v2);
  r = archiveSectionInto(r, KEY, v3);
  const out = deleteVersionFrom(r, KEY, 300);
  assert.equal(out.sections[KEY], v2);
  assert.deepEqual(versionsOf(out, KEY), [v2, v1]);
});

test("history:delete 非現行版唔影響現行版", () => {
  const v1 = sec("一", 100), v2 = sec("二", 200);
  let r = archiveSectionInto(reading({}), KEY, v1);
  r = archiveSectionInto(r, KEY, v2);
  const out = deleteVersionFrom(r, KEY, 100);
  assert.equal(out.sections[KEY], v2);
  assert.deepEqual(versionsOf(out, KEY), [v2]);
});

test("history:delete 最後一版成節移除", () => {
  const v1 = sec("唯一", 100);
  const r = archiveSectionInto(reading({}), KEY, v1);
  const out = deleteVersionFrom(r, KEY, 100);
  assert.equal(KEY in out.sections, false);
  assert.equal(KEY in (out.sectionHistory ?? {}), false);
  assert.deepEqual(versionsOf(out, KEY), []);
});

test("history:delete 舊記錄合成版(無 sectionHistory)都刪得走", () => {
  const v1 = sec("舊版", 100);
  const out = deleteVersionFrom(reading({ [KEY]: v1 }), KEY, 100);
  assert.equal(KEY in out.sections, false);
});

test("history:delete 唔存在嘅版本原樣回傳", () => {
  const r = reading({ [KEY]: sec("在", 100) });
  assert.equal(deleteVersionFrom(r, KEY, 999), r);
});

test("history:版本上限 20,最新第一、舊版甩尾", () => {
  let r = reading({});
  for (let i = 1; i <= MAX_SECTION_VERSIONS + 5; i++) {
    r = archiveSectionInto(r, KEY, sec(`第${i}版`, i * 100));
  }
  const vs = versionsOf(r, KEY);
  assert.equal(vs.length, MAX_SECTION_VERSIONS);
  assert.equal(vs[0].at, (MAX_SECTION_VERSIONS + 5) * 100);
  assert.equal(vs[vs.length - 1].at, 6 * 100);
  assert.equal(r.sections[KEY].at, (MAX_SECTION_VERSIONS + 5) * 100);
});

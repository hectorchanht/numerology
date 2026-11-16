import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

// notes.ts 住喺 app/yijing/academy/(唔喺 tsconfig.test.json 嘅 lib rootDir 內),
// 所以呢度即場 transpile 一份入 test-dist 再 import,唔改動既有 test 基建。
const here = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(here, "../app/yijing/academy/notes.ts");
const src = fs.readFileSync(srcPath, "utf8");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2021 },
}).outputText;
const outDir = path.join(here, "../test-dist");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "lesson-notes.mjs");
fs.writeFileSync(outPath, js);
const { noteKey, emptyNote, serializeNote, parseNote, loadNote, saveNote, hasNote } =
  await import(pathToFileURL(outPath).href);

test("notes:noteKey —— 每課一條獨立鍵", () => {
  assert.equal(noteKey("hetu-luoshu"), "yijing-academy-note:hetu-luoshu");
  assert.notEqual(noteKey("a"), noteKey("b"));
});

test("notes:serialize/parse round-trip —— 文字、筆跡、時間原樣還原", () => {
  const note = {
    text: "河圖主生成,洛書主運行。",
    strokes: [
      [
        { x: 0.1, y: 0.2, p: 0.5 },
        { x: 0.123456, y: 0.987654, p: 0 },
        { x: 1, y: 0, p: 1 },
      ],
      [{ x: 0.5, y: 0.5, p: 0.75 }],
    ],
    updatedAt: 1763200000000,
  };
  assert.deepEqual(parseNote(serializeNote(note)), note);
});

test("notes:parseNote —— 垃圾輸入一律回落空筆記,唔拋錯", () => {
  const empty = emptyNote();
  assert.deepEqual(parseNote("not json {"), empty);
  assert.deepEqual(parseNote(""), empty);
  assert.deepEqual(parseNote(null), empty);
  assert.deepEqual(parseNote(undefined), empty);
  assert.deepEqual(parseNote(42), empty);
  assert.deepEqual(parseNote('{"text":123,"strokes":"x","updatedAt":"y"}'), empty);
  assert.deepEqual(parseNote('["array"]'), empty);
});

test("notes:parseNote —— 筆跡點位防禦:壞點丟棄,越界夾返 0–1", () => {
  const parsed = parseNote(
    JSON.stringify({
      text: "ok",
      strokes: [
        [
          { x: 1.4, y: -0.2, p: 2 },
          { x: "bad", y: 0.5, p: 0.5 },
          { x: 0.25, y: 0.75, p: 0.5 },
        ],
        "not-a-stroke",
        [],
      ],
      updatedAt: 7,
    }),
  );
  assert.equal(parsed.text, "ok");
  assert.equal(parsed.updatedAt, 7);
  assert.deepEqual(parsed.strokes, [
    [
      { x: 1, y: 0, p: 1 },
      { x: 0.25, y: 0.75, p: 0.5 },
    ],
  ]);
});

test("notes:load/save/has —— localStorage stub 往返 + 無儲存時安全回落", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  try {
    assert.equal(hasNote("hetu-luoshu"), false);
    assert.deepEqual(loadNote("hetu-luoshu"), emptyNote());
    const note = { text: "抄盤", strokes: [[{ x: 0, y: 0, p: 0.5 }]], updatedAt: 9 };
    saveNote("hetu-luoshu", note);
    assert.equal(hasNote("hetu-luoshu"), true);
    assert.deepEqual(loadNote("hetu-luoshu"), note);
    // 只有空白文字 + 無筆跡 = 未算有筆記
    saveNote("basics", { text: "   ", strokes: [], updatedAt: 1 });
    assert.equal(hasNote("basics"), false);
  } finally {
    delete globalThis.localStorage;
  }
  // 無 localStorage(SSR/私密模式)唔拋錯
  assert.deepEqual(loadNote("hetu-luoshu"), emptyNote());
  assert.equal(hasNote("hetu-luoshu"), false);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { meta: M, quotes: Q } = JSON.parse(readFileSync(new URL("../data/tianji-ziwei.json", import.meta.url), "utf8"));

test("倪師原話:條數、講次條數同上游 README 分講目錄一致", () => {
  assert.equal(Q.length, 1848);
  const n = {};
  for (const q of Q) n[M.lectures[q.p]] = (n[M.lectures[q.p]] ?? 0) + 1;
  assert.deepEqual(n, {
    "2上": 180, "3上": 143, "4上": 130, "5上": 145, "6上": 149, "7上": 144, "8上": 134, "9上": 138,
    "10上": 138, "11上": 118, "12上": 106, "13上": 91, "14上": 96, "15上": 96, "19上(補充1)": 29, "24下(補充2)": 11,
  });
  assert.equal(n["2上"] + n["3上"] + n["4上"] + n["5上"] + n["6上"] + n["7上"] + n["8上"] + n["9上"] + n["10上"] + n["11上"] + n["12上"] + n["13上"] + n["14上"] + n["15上"], 1808);
});

test("每條有出處:主題冊、分節、秒數合理;同主題同時間唔重複", () => {
  const books = new Set(["01-stars", "02-palaces", "03-patterns", "04-sihua", "05-illness", "07-methodology", "08-yili", "10-divination", "11-fengshui"]);
  const seen = new Set();
  for (const q of Q) {
    assert.ok(books.has(q.book), q.book);
    assert.ok(q.h2 && typeof q.h3 === "string" && q.quote.length > 0); // h3 可空(上游未細分)
    assert.ok(Number.isInteger(q.t) && q.t >= 0 && q.t < 3 * 3600, String(q.t));
    const k = `${q.book}:${q.h2}:${q.h3}:${q.p}:${q.t}:${q.quote}`; // 同句可交叉歸入多個主題
    assert.ok(!seen.has(k), k);
    seen.add(k);
  }
});

test("meta:非原典、未校對、帶 NC-SA 授權", () => {
  assert.equal(M.tier, "modern");
  assert.equal(M.reviewed, false);
  assert.match(M.license, /CC BY-NC-SA 4\.0/);
  assert.equal(M.bvid, "BV1KJsLekEfA");
});

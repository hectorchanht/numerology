import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const N = JSON.parse(readFileSync(new URL("../data/nicomachus.json", import.meta.url), "utf8"));

const isPrime = (n) => {
  if (n < 2n) return false;
  for (let d = 2n; d * d <= n; d++) if (n % d === 0n) return false;
  return true;
};
const sigma = (n) => {
  let s = 0;
  for (let d = 1; d < n; d++) if (n % d === 0) s += d;
  return s;
};

// Nicomachus 方法:1 + 2 + 4 + … 係質數,就乘最後一項
const perfects = (count) => {
  const out = [];
  for (let k = 1n; out.length < count; k++) {
    const sum = 2n ** k - 1n;
    if (isPrime(sum)) out.push(sum * 2n ** (k - 1n));
  }
  return out;
};

test("完全數:方法生出 6, 28, 496, 8128,而且真因數和 = 本數", () => {
  assert.deepEqual(perfects(4).map(Number), N.perfect.known);
  for (const p of N.perfect.known) assert.equal(sigma(p), p);
});

test("作者論點只啱頭四個:第五個 8 位數、第五第六個尾數都係 6", () => {
  const p = perfects(6).map(String);
  const digits = p.map((x) => x.length);
  assert.deepEqual(digits.slice(0, 4), [1, 2, 3, 4]);
  assert.equal(digits[4], 8); // 一萬至千萬之間冇完全數
  const last = p.map((x) => x.at(-1));
  assert.deepEqual(last, ["6", "8", "6", "8", "6", "6"]);
  for (const c of N.perfect.claims) assert.equal(c.holdsFor, 4);
});

test("五種「大於」嘅比:例子符合定義", () => {
  const gcd = (x, y) => (y ? gcd(y, x % y) : x);
  // 約簡後:整除 = 倍;餘 1 = 超一分;餘 > 1 = 超多分
  const kind = ([a, b]) => {
    const g = gcd(a, b);
    [a, b] = [a / g, b / g];
    if (a % b === 0) return "multiple";
    return (a < 2 * b ? "super" : "multiple super") + (a % b === 1 ? "particular" : "partient");
  };
  for (const r of N.ratios.greater) assert.equal(kind(r.example), r.name, r.name);
});

test("形數:k 邊形數 = 公差 k−2 嘅 gnomon 累加;三角數相鄰和 = 平方;三角 + 平方 = 五角", () => {
  const poly = (k, n) => ((k - 2) * n * n - (k - 4) * n) / 2;
  const F = Object.fromEntries(N.figurate.items.map((f) => [f.sides, f.seq]));
  for (const f of N.figurate.items) f.seq.forEach((x, i) => assert.equal(x, poly(f.sides, i + 1), `${f.name} #${i + 1}`));
  F[3].slice(1).forEach((t, i) => assert.equal(t + F[3][i], F[4][i + 1]));
  F[5].slice(1).forEach((p, i) => assert.equal(F[3][i] + F[4][i + 1], p));
});

test("立方 = 連續奇數分組之和", () => {
  let odd = 1;
  N.cubes.seq.forEach((c, i) => {
    let s = 0;
    for (let j = 0; j <= i; j++, odd += 2) s += odd;
    assert.equal(s, c);
    assert.equal(c, (i + 1) ** 3);
  });
});

test("十種比例:每個例子符合各自公式,而且全部喺頭十個數之內", () => {
  const P = {
    1: (a, b, c) => a - b === b - c,
    2: (a, b, c) => a * c === b * b,
    3: (a, b, c) => (a - b) * c === (b - c) * a,
    4: (a, b, c) => (a - b) * a === (b - c) * c,
    5: (a, b, c) => (a - b) * b === (b - c) * c,
    6: (a, b, c) => (a - b) * a === (b - c) * b,
    7: (a, b, c) => (a - c) * c === (b - c) * a,
    8: (a, b, c) => (a - c) * c === (a - b) * a,
    9: (a, b, c) => (a - c) * c === (b - c) * b,
    10: (a, b, c) => (a - c) * c === (a - b) * b,
  };
  assert.equal(N.proportions.items.length, 10);
  for (const p of N.proportions.items) {
    const [a, b, c] = p.example;
    assert.ok(a > b && b > c && a <= 10, `${p.n}`);
    assert.ok(P[p.n](a, b, c), `${p.n} ${p.example}`);
  }
});

test("最完美比例 6, 8, 9, 12:算術中項 9、調和中項 8、6:8 = 9:12", () => {
  const [a, h, m, b] = N.mostPerfect.example;
  assert.equal(m, (a + b) / 2);
  assert.equal(h, (2 * a * b) / (a + b));
  assert.equal(a * b, h * m);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { detectZiweiGeju, castZiwei } from "../dist/index.js";

const RING = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const st = (name, brightness) => ({ name, brightness });
/** 合成 12 宫:soul = 命宫地支;spec = { 地支: { major, minor, adj } } */
function mk(soul, spec = {}) {
  const si = RING.indexOf(soul);
  const palaces = RING.map((b) => ({
    name: b === soul ? "命宫" : "其他", earthlyBranch: b,
    majorStars: (spec[b]?.major ?? []).map((n) => (Array.isArray(n) ? st(...n) : st(n))),
    minorStars: (spec[b]?.minor ?? []).map((n) => (Array.isArray(n) ? st(...n) : st(n))),
    adjectiveStars: (spec[b]?.adj ?? []).map((n) => st(n)),
  }));
  for (const p of palaces) {
    const i = RING.indexOf(p.earthlyBranch);
    p.sanFang = { branches: { self: p.earthlyBranch, opposite: RING[(i + 6) % 12], trine: [RING[(i + 4) % 12], RING[(i + 8) % 12]] } };
  }
  return { palaces, soul: RING[si] };
}
const ids = (m) => detectZiweiGeju(m.palaces, m.soul).map((h) => h.id);

test("紫府同宫命中,steps 写证据;拆开唔中", () => {
  const hit = detectZiweiGeju(...Object.values(mk("寅", { 寅: { major: ["紫微", "天府"] } })));
  const h = hit.find((x) => x.id === "zifu-tonggong");
  assert.ok(h);
  assert.deepEqual(h.steps, ["紫微、天府同在命宫(寅)"]);
  assert.ok(!ids(mk("寅", { 寅: { major: ["紫微"] }, 申: { major: ["天府"] } })).includes("zifu-tonggong"));
});

test("紫府同宫只限命宫:同在疾厄唔中", () => {
  const m = mk("寅", { 申: { major: ["紫微", "天府"] } });
  m.palaces.find((p) => p.earthlyBranch === "申").name = "疾厄";
  assert.ok(!ids(m).includes("zifu-tonggong"));
  assert.ok(ids(mk("申", { 申: { major: ["紫微", "天府"] } })).includes("zifu-tonggong"));
});

test("noMajor:命无正曜命中,有主星唔中", () => {
  assert.ok(ids(mk("子")).includes("ming-wu-zhengyao"));
  assert.ok(!ids(mk("子", { 子: { major: ["紫微"] } })).includes("ming-wu-zhengyao"));
});

test("inSanFang:三星落三方命中,一颗落三方外唔中(杀破狼)", () => {
  // 命子:三方四正 = 子午辰申
  assert.ok(ids(mk("子", { 子: { major: ["七杀"] }, 午: { major: ["破军"] }, 辰: { major: ["贪狼"] } })).includes("shapolang"));
  assert.ok(!ids(mk("子", { 子: { major: ["七杀"] }, 午: { major: ["破军"] }, 卯: { major: ["贪狼"] } })).includes("shapolang"));
});

test("inPalace stars:[] + branches:命宫地支限制(机月同梁)", () => {
  const sp = { 子: {}, 寅: {}, 午: {}, 戌: {} };
  const spec = (soul) => {
    const [a, b, c] = [RING[(RING.indexOf(soul) + 0) % 12], RING[(RING.indexOf(soul) + 6) % 12], RING[(RING.indexOf(soul) + 4) % 12]];
    return { [a]: { major: ["天机"] }, [b]: { major: ["太阴"] }, [c]: { major: ["天同", "天梁"] } };
  };
  void sp;
  assert.ok(ids(mk("寅", spec("寅"))).includes("jiyue-tongliang"));
  assert.ok(!ids(mk("子", spec("子"))).includes("jiyue-tongliang"));
});

test("brightness 限定:庙旺命中,陷唔中(日月并明)", () => {
  const ok = mk("子", { 子: { major: [["太阳", "庙"]] }, 午: { major: [["太阴", "旺"]] } });
  assert.ok(ids(ok).includes("riyue-bingming"));
  const bad = mk("子", { 子: { major: [["太阳", "庙"]] }, 午: { major: [["太阴", "陷"]] } });
  assert.ok(!ids(bad).includes("riyue-bingming"));
  const none = mk("子", { 子: { major: ["太阳"] }, 午: { major: ["太阴"] } });
  assert.ok(!ids(none).includes("riyue-bingming"));
});

test("inPalace 含辅星/杂曜 + brightness(火贪)", () => {
  const ok = mk("丑", { 丑: { major: [["贪狼", "庙"]], minor: [["火星", "旺"]] } });
  assert.ok(ids(ok).includes("huotan"));
  const bad = mk("丑", { 丑: { major: [["贪狼", "平"]], minor: [["火星", "旺"]] } });
  assert.ok(!ids(bad).includes("huotan"));
});

test("实盘 1990-05-15 14:30 男", () => {
  const z = castZiwei({ year: 1990, month: 5, day: 15, hour: 14, minute: 30, gender: "男" });
  // 手核:命宫戌(紫微得、天相得、铃星庙),三方四正 戌辰寅午:
  // 戌 紫微/天相、辰 破军、寅 廉贞、午 武曲/天府 -> 天府+天相皆在三方 = 府相朝垣。
  // 紫府不同宫(紫微戌、天府午);七杀在子(三方外)故非杀破狼;日月在未、太阴不庙旺,非日月并明;
  // 命宫有主星故非命无正曜;铃星庙但命宫无贪狼,非铃贪。
  assert.deepEqual(z.geju.map((h) => h.id), ["fuxiang-chaoyuan"]);
});

test("flank:日月分居命宫两邻命中,同在一邻唔中", () => {
  assert.ok(ids(mk("子", { 亥: { major: ["太阳"] }, 丑: { major: ["太阴"] } })).includes("riyue-jiaming"));
  assert.ok(ids(mk("子", { 丑: { major: ["太阴"] }, 亥: { major: ["太阳"] } })).includes("riyue-jiaming"));
  assert.ok(!ids(mk("子", { 丑: { major: ["太阳", "太阴"] } })).includes("riyue-jiaming"));
});

test("mutagens:命宫化忌 + 羊陀夹 = 羊陀夹忌;冇化忌唔中", () => {
  const spec = (mut) => ({ 申: { major: [["巨门"]] }, 酉: { minor: ["擎羊"] }, 未: { minor: ["陀罗"] } , ...mut });
  const m = mk("申", spec({}));
  m.palaces.find((p) => p.earthlyBranch === "申").majorStars[0].mutagen = "忌";
  assert.ok(ids(m).includes("yangtuo-jiaji"));
  assert.ok(!ids(mk("申", spec({}))).includes("yangtuo-jiaji"));
});

test("any:辅弼拱主 三方拱或夹命其一即中,steps 多一条证据", () => {
  const gong = detectZiweiGeju(...Object.values(mk("子", { 子: { major: ["紫微"] }, 辰: { minor: ["左辅"] }, 申: { minor: ["右弼"] } })));
  assert.equal(gong.find((h) => h.id === "fubi-gongzhu").steps.length, 2);
  assert.ok(ids(mk("子", { 子: { major: ["紫微"] }, 亥: { minor: ["左辅"] }, 丑: { minor: ["右弼"] } })).includes("fubi-gongzhu"));
  assert.ok(!ids(mk("子", { 子: { major: ["紫微"] }, 卯: { minor: ["左辅"] }, 丑: { minor: ["右弼"] } })).includes("fubi-gongzhu"));
});

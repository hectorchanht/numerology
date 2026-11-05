import { test } from "node:test";
import assert from "node:assert/strict";
import { castZiweiFeixing, findLuJiJiaoChi } from "../dist/index.js";

const f = castZiweiFeixing({ year: 1990, month: 5, day: 15, hour: 14, minute: 30, gender: "男" });
const names = ["命宫","兄弟","夫妻","子女","财帛","疾厄","迁移","仆役","官禄","田宅","福德","父母"];

test("十二宮×四化=48 條,note 固定", () => {
  assert.equal(f.flies.length, 48);
  assert.equal(f.tier, "modern");
  assert.equal(f.note, "飛星派說法(二十世紀),非《紫微斗數全書》內容");
  for (const x of f.flies) assert.ok(names.includes(x.intoPalace) || x.intoPalace === "未入盘");
});

test("命宮(丙)四化落宮次序祿權科忌;無自化", () => {
  const soul = f.flies.filter((x) => x.from === "命宫");
  assert.deepEqual(soul.map((x) => x.type), ["禄", "权", "科", "忌"]);
  assert.deepEqual(soul.map((x) => x.intoPalace), ["疾厄", "兄弟", "仆役", "官禄"]);
  assert.equal(f.selfMutaged.filter((x) => x.palace === "命宫").length, 0);
});

test("findLuJiJiaoChi 合成資料", () => {
  const fl = [
    { from: "命宫", type: "禄", intoPalace: "官禄" },
    { from: "官禄", type: "忌", intoPalace: "命宫" },
    { from: "兄弟", type: "禄", intoPalace: "夫妻" },
    { from: "夫妻", type: "忌", intoPalace: "子女" },
  ];
  assert.deepEqual(findLuJiJiaoChi(fl), [{ luPalace: "命宫", jiPalace: "官禄" }]);
});

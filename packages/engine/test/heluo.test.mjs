import { test } from "node:test";
import assert from "node:assert/strict";
import { allHexagrams } from "@numerology/knowledge";
import { castHeluo, heluoReduce, heluoYears, heluoMonths, heluoDays } from "../dist/index.js";

// 書中算例(河洛理數卷一 pp. 22–23、31、82–83),揀四柱相同嘅現代日期重算。
const cast = (year, month, day, hour, gender = "男") => castHeluo({ year, month, day, hour, gender });

test("甲子 丁卯 庚申 庚辰 辰時男:天 31 地 34 → 姤,元堂上九,後天中孚元堂三爻", () => {
  const r = cast(1984, 3, 27, 8);
  assert.deepEqual(r.pillars, ["甲子", "丁卯", "庚申", "庚辰"]);
  assert.equal(r.heaven, 31);
  assert.equal(r.earth, 34);
  assert.equal(r.xiantian.name, "姤");
  assert.equal(r.yuantang, 6);
  assert.equal(r.houtian.name, "中孚");
  assert.equal(r.houtianYuantang, 3);
});

test("庚午 甲申 丙申 丁酉 酉時男:旅初爻,46 歲換後天離九四", () => {
  const r = cast(1930, 8, 14, 18);
  assert.deepEqual(r.pillars, ["庚午", "甲申", "丙申", "丁酉"]);
  assert.equal(r.xiantian.name, "旅");
  assert.equal(r.yuantang, 1);
  assert.equal(r.houtian.name, "離");
  assert.equal(r.houtianYuantang, 4);
  assert.equal(r.houtianAge, 46);
});

test("乙亥 乙酉 戊寅 庚申 申時男:訟初爻,49 歲換後天夬", () => {
  const r = cast(2055, 9, 29, 16);
  assert.deepEqual(r.pillars, ["乙亥", "乙酉", "戊寅", "庚申"]);
  assert.equal(r.xiantian.name, "訟");
  assert.equal(r.yuantang, 1);
  assert.equal(r.houtian.name, "夬");
  assert.equal(r.houtianAge, 49);
  assert.ok(r.yuanqi.tian === false && r.huagong.trigrams.length >= 1);
});

test("遇十不用", () => {
  assert.deepEqual([heluoReduce(35, 25), heluoReduce(50, 30), heluoReduce(30, 30), heluoReduce(25, 25), heluoReduce(44, 25)], [1, 2, 3, 5, 9]);
});

test("大運:十二步連續,陽爻九年陰爻六年,先天由元堂起", () => {
  const r = cast(1984, 3, 27, 8);
  assert.equal(r.dayun.length, 12);
  assert.equal(r.dayun[0].line, r.yuantang);
  r.dayun.forEach((d, i) => {
    assert.equal(d.toAge - d.fromAge + 1, d.yang ? 9 : 6);
    if (i) assert.equal(d.fromAge, r.dayun[i - 1].toAge + 1);
  });
  assert.equal(r.dayun[6].phase, "後天");
  assert.equal(r.dayun[6].line, r.houtianYuantang);
});

test("得五寄宮:1984–2043 下元,男離女兌", () => {
  // 搵 1990 年內天數或地數得五嘅日子
  let hit;
  for (let d = 1; d <= 365 && !hit; d++) {
    const dt = new Date(Date.UTC(1990, 0, d));
    for (const gender of ["男", "女"]) {
      const r = castHeluo({ year: 1990, month: dt.getUTCMonth() + 1, day: dt.getUTCDate(), hour: 12, gender });
      if (r.heavenNumber === 5) hit = r;
      if (hit) {
        assert.equal(r.yuan, "下元");
        assert.equal(r.heavenTrigram, gender === "男" ? "離" : "兌");
        break;
      }
    }
  }
  assert.ok(hit, "1990 年應有得五嘅日子");
});

test("元氣:甲子年 → 天元氣乾、地元氣坎", () => {
  const r = cast(1984, 3, 27, 8);
  assert.equal(r.yuanqi.stem, "乾");
  assert.equal(r.yuanqi.branch, "坎");
  assert.equal(r.yuanqi.tian, true); // 姤上卦乾
});

test("《天網搜奇錄》周姓命例 壬戌 己酉 癸卯 丙辰 男:遯初爻,後天大有(書 p. 34)", () => {
  const r = cast(1922, 10, 2, 8);
  assert.deepEqual(r.pillars, ["壬戌", "己酉", "癸卯", "丙辰"]);
  assert.equal(r.xiantian.name, "遯");
  assert.equal(r.yuantang, 1);
  assert.equal(r.houtian.name, "大有");
});

// 卷一 pp. 37–40 小象流年、月卦、日卦算例
const BITS = Object.fromEntries(allHexagrams().map((h) => [h.name, h.bits]));
const names = (xs) => xs.map((x) => allHexagrams().find((h) => h.bits.join("") === x.bits.join("")).name);

test("小象:同人九三陽年 → 同人 革 隨 屯 復 頤 剝 蒙 蠱", () => {
  assert.deepEqual(names(heluoYears(BITS.同人, 3, true)), ["同人", "革", "隨", "屯", "復", "頤", "剝", "蒙", "蠱"]);
});

test("小象:同人九四遇陰年即變 → 家人 漸 遯 旅 小過 豐 大壯 歸妹 臨", () => {
  const r = heluoYears(BITS.同人, 4, false);
  assert.deepEqual(names(r), ["家人", "漸", "遯", "旅", "小過", "豐", "大壯", "歸妹", "臨"]);
  assert.deepEqual(r.map((x) => x.line), [4, 1, 4, 5, 6, 1, 2, 3, 4]);
});

test("小象:同人六二陰爻六年 → 乾 履 中孚 損 臨 師", () => {
  assert.deepEqual(names(heluoYears(BITS.同人, 2, true)), ["乾", "履", "中孚", "損", "臨", "師"]);
});

test("月卦:流年觀上爻 → 正月益…十二月歸妹", () => {
  const r = heluoMonths(BITS.觀, 6);
  assert.deepEqual(names(r), ["益", "無妄", "中孚", "損", "小畜", "需", "乾", "姤", "大有", "離", "大壯", "歸妹"]);
  assert.deepEqual(r.map((x) => x.line), [1, 4, 2, 5, 3, 6, 4, 1, 5, 2, 6, 3]);
});

test("日卦:月卦既濟二爻 → 屯、革、明夷各管六日,共三十日", () => {
  const r = heluoDays(BITS.既濟, 2);
  assert.equal(r.length, 30);
  assert.deepEqual(names([r[0], r[6], r[12]]), ["屯", "革", "明夷"]);
  assert.deepEqual(r.slice(0, 6).map((x) => x.line), [1, 2, 3, 4, 5, 6]);
});

test("castHeluo 流年逐歲連續,與大運段一致", () => {
  const r = cast(1984, 3, 27, 8);
  r.liunian.forEach((y, i) => assert.equal(y.age, i + 1));
  assert.equal(r.liunian.length, r.dayun.at(-1).toAge);
  assert.equal(r.liunian[0].year, 1984);
});

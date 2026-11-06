import { test } from "node:test";
import assert from "node:assert/strict";
import { allHexagrams, GUANGXIANG } from "@numerology/knowledge";
import { castHeluo, heluoReduce, heluoYears, heluoMonths, heluoDays, heluoJinsuo, heluoJinsuoLuck, heluoGuangxiang, castChart } from "../dist/index.js";

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

test("卷一 p. 84 丙寅 庚子 丙子 己亥 男:天 18 地 42 → 剝上九,後天坤", () => {
  const r = cast(1926, 12, 13, 22);
  assert.deepEqual(r.pillars, ["丙寅", "庚子", "丙子", "己亥"]);
  assert.deepEqual([r.heaven, r.earth, r.xiantian.name, r.yuantang, r.houtian.name], [18, 42, "剝", 6, "坤"]);
});

test("卷一 p. 85 戊子 甲子 癸巳 癸亥 男:天 11 地 30(書印三十三,文稱三十原無餘剩)→ 屯九五", () => {
  const r = cast(2008, 12, 19, 22);
  assert.deepEqual(r.pillars, ["戊子", "甲子", "癸巳", "癸亥"]);
  assert.deepEqual([r.heaven, r.earth, r.xiantian.name, r.yuantang], [11, 30, "屯", 5]);
});

test("《推命術》pp. 6–7 癸巳 甲子 丁酉 甲辰 男:天 29 地 36,陰男天數在下 → 姤上九,後天中孚三爻", () => {
  const r = cast(1893, 12, 26, 8);
  assert.deepEqual(r.pillars, ["癸巳", "甲子", "丁酉", "甲辰"]);
  assert.deepEqual([r.heaven, r.earth, r.xiantian.name, r.yuantang, r.houtian.name, r.houtianYuantang], [29, 36, "姤", 6, "中孚", 3]);
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

// NAJDA-305-0271 卷四 p. 2(明刻本)乾卦流年表:陽爻元堂分「陽不變」「陰必變」兩套
test("卷四流年表:乾初九、九二陽年/陰年各九年", () => {
  const y = (line, yang) => names(heluoYears(BITS.乾, line, yang));
  assert.deepEqual(y(1, true), ["乾", "小畜", "巽", "漸", "觀", "否", "晉", "豫", "震"]);
  assert.deepEqual(y(1, false), ["姤", "巽", "小畜", "家人", "益", "無妄", "噬嗑", "震", "豫"]);
  assert.deepEqual(y(2, true), ["乾", "大有", "離", "噬嗑", "頤", "益", "屯", "比", "坎"]);
  assert.deepEqual(y(2, false), ["同人", "離", "大有", "睽", "損", "中孚", "節", "坎", "比"]);
});

test("月卦:流年觀上爻 → 正月益…十二月歸妹", () => {
  const r = heluoMonths(BITS.觀, 6);
  assert.deepEqual(names(r), ["益", "無妄", "中孚", "損", "小畜", "需", "乾", "姤", "大有", "離", "大壯", "歸妹"]);
  assert.deepEqual(r.map((x) => x.line), [1, 4, 2, 5, 3, 6, 4, 1, 5, 2, 6, 3]);
});

test("《推命術》p. 26 月卦:流年節三爻 → 兌…小過", () => {
  assert.deepEqual(names(heluoMonths(BITS.節, 3)), ["兌", "困", "歸妹", "震", "睽", "大有", "未濟", "蒙", "晉", "否", "旅", "小過"]);
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

test("《河洛理數推命術》p. 25 甲子年例:姤上九,1–24 歲流年卦逐歲吻合", () => {
  const r = cast(1984, 3, 27, 8);
  assert.deepEqual(r.liunian.slice(0, 24).map((y) => y.hex.name), [
    "姤", "訟", "困", "兌", "隨", "革", "既濟", "明夷", "賁", // 上九陽爻,甲子陽年本爻不變
    "乾", "同人", "無妄", "益", "頤", "復", // 初六陰爻六年
    "遯", "旅", "鼎", "未濟", "蒙", "渙", "坎", "節", "屯", // 九二陽爻,16 歲己卯陰年即變
  ]);
});

// GGZBCK405 卷六金鎖銀匙五例(木部例書誤印 3313,規則得 2313)、廣象徹微甲子年例。
test("金鎖銀匙:書中五例", () => {
  const ex = [
    [["乙卯", "戊子", "壬戌", "壬寅"], "水", 2542, 2942],
    [["丙寅", "戊戌", "壬戌", "辛丑"], "火", 2442, 3042],
    [["壬子", "癸丑", "己卯", "己巳"], "木", 2313],
    [["壬申", "己酉", "戊申", "庚申"], "金", 3322],
    [["庚午", "癸未", "癸亥", "乙卯"], "土", 2571, 2971],
  ];
  for (const [p, wx, fwd, rev] of ex) {
    const r = heluoJinsuo(p, wx);
    assert.equal(r.forward, fwd, p.join(""));
    if (rev) assert.equal(r.reverse, rev, p.join(""));
    assert.equal(Math.floor(r.forward / 100) % 100 - 20 + Math.floor(r.reverse / 100) % 100 - 20, 14);
  }
  assert.equal(heluoJinsuo(["壬申", "己酉", "戊申", "庚申"], "金").count, 13);
});

test("廣象徹微:甲子年例支積 24、干積 16;256 卦 25 種數", () => {
  const r = heluoGuangxiang(["甲子", "丁丑", "壬寅", "辛亥"]);
  assert.deepEqual(r.branch, { xiang: ["元", "會", "運", "世"], product: 24 });
  assert.deepEqual(r.stem, { xiang: ["元", "世", "元", "世"], product: 16 });
  assert.equal(Object.keys(r.dist).length, 25);
  assert.equal(Object.values(r.dist).reduce((a, b) => a + b, 0), 256);
  for (const [k, v] of Object.entries(GUANGXIANG.counts.values)) assert.equal(r.dist[k], v, k);
});

test("castHeluo 帶金鎖銀匙同廣象徹微,年柱納音取自八字", () => {
  const r = cast(1984, 3, 27, 8);
  assert.equal(r.jinsuo.nayin, "金");
  assert.deepEqual(r.jinsuo, heluoJinsuo(r.pillars, "金"));
  assert.equal(r.guangxiang.branch.product, heluoGuangxiang(r.pillars).branch.product);
});

test("金鎖銀匙行運:大運以運支代時支,流年以運支、太歲支代日時", () => {
  const heluo = { pillars: ["乙卯", "戊子", "壬戌", "壬寅"], jinsuo: heluoJinsuo(["乙卯", "戊子", "壬戌", "壬寅"], "水") };
  const daYun = [
    { ganZhi: "", startAge: 1, endAge: 2, startYear: 1975 },
    { ganZhi: "己丑", startAge: 3, endAge: 12, startYear: 1977 },
    { ganZhi: "庚寅", startAge: 13, endAge: 22, startYear: 1987 },
  ];
  const r = heluoJinsuoLuck(heluo, daYun, 1980);
  assert.equal(r.yun.length, 2);
  // 戌數至丑 4 位:2000 + 400 + 戌 11 + 丑 2 + 水 27 + 部 1
  assert.deepEqual([r.yun[0].count, r.yun[0].forward, r.yun[0].reverse, r.yun[0].endYear], [4, 2441, 3041, 1986]);
  // 1980 庚申:丑數至申 8 位:2000 + 800 + 丑 2 + 申 9 + 27 + 1
  assert.deepEqual([r.year.taisui, r.year.yun, r.year.count, r.year.forward, r.year.reverse], ["申", "己丑", 8, 2839, 2639]);
  assert.equal(heluoJinsuoLuck(heluo, daYun, 1975).year, null);
});

test("金鎖銀匙行運接八字大運", () => {
  const chart = castChart({ year: 1990, month: 1, day: 15, hour: 10, gender: "女" });
  const r = heluoJinsuoLuck(castHeluo(chart.input), chart.bazi.daYun, 2026);
  assert.equal(r.yun.length, chart.bazi.daYun.filter((d) => d.ganZhi).length);
  assert.ok(r.year && r.year.taisui === "午");
});

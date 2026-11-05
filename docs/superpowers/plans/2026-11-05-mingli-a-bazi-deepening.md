# 第四期 A · 八字加深 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 八字加干支關係(原局 + 歲運對原局)、胎元胎息命宮身宮、小運、流月、《子平真詮》月令取格、五種神煞,並接入 AI facts 同 UI。

**Architecture:** 純函數放 `packages/engine`(新 `relations.ts`、`geju.ts`,擴 `shensha.ts`、`bazi.ts`、`fortune.ts`);關係規則表放 `packages/knowledge`(JSON + 內聯 `.data.ts`)。`castBazi` / `analyzeFortune` 輸出加欄位(只加,唔改舊欄位)。AI 經 `buildContextPack` / `renderFortune`;UI 經 `BaziDetail.tsx`、`FortuneSections.tsx`。

**Tech Stack:** TypeScript、lunar-javascript 1.7.7、node:test(`.mjs`,import `../dist/*.js`,要先 build)、Next.js。

**Spec:** `docs/superpowers/specs/2026-11-05-mingli-deepening-design.md`(A 節)

## Global Constraints

- 只加新欄位;四柱、起運、大運、流年、調候現有輸出數值不得改變(現有測試全過)。
- 引擎輸出字串沿用現有慣例:lunar-javascript 出簡體(如「七杀」「劫财」),新引擎標籤同樣用簡體字形(「六合」「三会」「相冲」「相害」「相刑」「相破」「岁运并临」「天克地冲」);UI 經 `useScript().z()` 轉字形。
- 古籍只用公版原文(維基文庫《三命通會》《子平真詮》);每條規則帶 `cite`(書名 + 卷 + 篇名)。
- 新 knowledge JSON `meta.reviewed: false`;改 JSON 後重新生成同名 `.data.ts`(檔頭照 `huangji-jingshi.data.ts` 兩行註解)。
- 格局 tier `modern`,UI / AI 文字必須包含「本站按《子平真詮》月令取格簡化,不含成敗救應」。
- 胎元等 UI 附《三命通會》四庫提要註「胎元等論施之今日,亦多有不驗」。
- i18n 新 key 三語(zht / zhs / en)齊全;`apps/web/test/i18n.test.mjs` 會驗 key 集合一致。
- repo 內 md、註解、commit 用繁體(zht)。
- 驗證:`npm run build && npm test`、`npm run typecheck` 全過。

## Review Focus

- 同一地支重複(例如兩個午)→ 自刑要列出,六合 / 三合唔可以因重複而重複計同一對柱。測試:Task 2 `午午自刑`。
- 三合 / 三會只齊兩支(半合)→ 要標「半合」唔係「三合」;拱合(缺中神)唔列。測試:Task 2 `半合`。
- 起運前嘅年份(大運干支空白,`ganZhi.trim().length !== 2`)→ 小運要有值,流年仍正常;唔可以拋錯。測試:Task 5 `小運`。
- 流月十二個月以節氣分月(正月 = 寅月),referenceYear 唔喺任何大運流年清單時(例如出生年之前)→ `liuYue` 為空陣列,唔拋錯。測試:Task 5 `流月越界`。
- 格局:月支本氣係比劫但唔係祿 / 刃(例如庚日生巳月,巳藏庚)→ 比劫唔取格,改看其他藏干。測試:Task 4 `比劫不取格`。

---

### Task 1: 干支關係規則表(knowledge)

**Files:**
- Create: `packages/knowledge/data/ganzhi-relations.json`
- Create: `packages/knowledge/src/ganzhi-relations.data.ts`(AUTO-GENERATED 內聯)
- Create: `packages/knowledge/src/ganzhi-relations.ts`
- Modify: `packages/knowledge/src/index.ts`(加 `export * from "./ganzhi-relations.js";`)
- Test: `packages/knowledge/test/ganzhi-relations.test.mjs`

**Interfaces:**
- Produces:
  ```ts
  export interface GanzhiRelationsTable {
    ganHe: { pair: [Tiangan, Tiangan]; hua: Wuxing5 }[];          // 甲己土 乙庚金 丙辛水 丁壬木 戊癸火
    ganChong: [Tiangan, Tiangan][];                                 // 甲庚 乙辛 丙壬 丁癸
    zhiLiuHe: { pair: [Dizhi, Dizhi]; hua: Wuxing5 }[];             // 子丑土 寅亥木 卯戌火 辰酉金 巳申水 午未土(午未作火土之說於 note 註明)
    zhiSanHe: { members: [Dizhi, Dizhi, Dizhi]; hua: Wuxing5 }[];   // 申子辰水 亥卯未木 寅午戌火 巳酉丑金(中神 = members[1])
    zhiSanHui: { members: [Dizhi, Dizhi, Dizhi]; hua: Wuxing5 }[];  // 寅卯辰木 巳午未火 申酉戌金 亥子丑水
    zhiChong: [Dizhi, Dizhi][];                                     // 子午 丑未 寅申 卯酉 辰戌 巳亥
    zhiHai: [Dizhi, Dizhi][];                                       // 子未 丑午 寅巳 卯辰 申亥 酉戌
    zhiXing: { members: Dizhi[]; kind: "无恩" | "恃势" | "无礼" | "自刑" }[]; // 寅巳申 / 丑戌未 / 子卯 / 辰辰 午午 酉酉 亥亥
    zhiPo: [Dizhi, Dizhi][];                                        // 子酉 卯午 辰丑 未戌 寅亥 巳申
    cite: Record<"ganHe"|"ganChong"|"zhiLiuHe"|"zhiSanHe"|"zhiSanHui"|"zhiChong"|"zhiHai"|"zhiXing"|"zhiPo", string>;
  }
  export const GANZHI_RELATIONS: GanzhiRelationsTable;
  export const GANZHI_RELATIONS_META: KnowledgeMeta;
  ```
  `Wuxing5` 如 knowledge 未有,就喺 `types.ts` 加 `export type Wuxing5 = "木"|"火"|"土"|"金"|"水";`(先 grep 確認有冇現成)。
- `meta`:`tier: "classical"`、`source` 寫維基文庫《三命通會》卷二各篇(論支元六合、論三合、論六害、論三刑、論沖擊)URL、`reviewed: false`。三會、天干相沖、相破喺卷二搵唔到原文就 cite 實際出處或標 `note: "通行說法"`——唔好虛構篇名。

- [ ] **Step 1: 寫失敗測試** `ganzhi-relations.test.mjs`:六合 6 對、三合 4 組、三會 4 組、六沖 6 對、六害 6 對、相破 6 對;每個地支喺六沖中恰好出現一次;`zhiSanHe` 中神依次為 子 卯 午 酉;`cite` 九個 key 全部非空;`meta.reviewed === false`。
- [ ] **Step 2:** `npm run build -w @numerology/knowledge && npm test -w @numerology/knowledge` → 新測試 FAIL(模組不存在)。
- [ ] **Step 3:** 寫 JSON、`.data.ts`、`ganzhi-relations.ts`、index export。
- [ ] **Step 4:** 同上指令 → PASS。
- [ ] **Step 5: Commit** `feat(knowledge): 干支刑沖合害會破規則表(三命通會卷二)`

### Task 2: 干支關係引擎 `relations.ts`

**Files:**
- Create: `packages/engine/src/relations.ts`
- Modify: `packages/engine/src/index.ts`(export)
- Test: `packages/engine/test/relations.test.mjs`

**Interfaces:**
- Consumes: Task 1 `GANZHI_RELATIONS`。
- Produces:
  ```ts
  export type PillarKey = "year" | "month" | "day" | "hour";
  export type RelationKind = "天干五合" | "天干相冲" | "六合" | "三合" | "半合" | "三会" | "相冲" | "相害" | "相刑" | "自刑" | "相破";
  export interface GanzhiRelation {
    kind: RelationKind;
    /** 參與者:原局柱用 PillarKey;外來(大運 / 流年 / 流月)用 "dayun" | "liunian" | "liuyue" */
    between: (PillarKey | "dayun" | "liunian" | "liuyue")[];
    chars: string[];          // 參與嘅干或支,如 ["午","未"]
    hua?: string;             // 合化五行(合 / 會才有)
  }
  export function natalRelations(p: Record<PillarKey, { gan: string; zhi: string }>): GanzhiRelation[];
  export function externalRelations(
    ext: { ganZhi: string; role: "dayun" | "liunian" | "liuyue" },
    natal: Record<PillarKey, { gan: string; zhi: string }>,
  ): GanzhiRelation[];
  /** 歲運並臨:流年干支 === 大運干支 */
  export function suiYunBingLin(dayunGanZhi: string, liunianGanZhi: string): boolean;
  /** 天剋地沖:外來干剋原局某柱干(五行剋,單向:外來剋原局)且支相沖 → 返回被沖柱;無則 [] */
  export function tianKeDiChong(extGanZhi: string, natal: Record<PillarKey, { gan: string; zhi: string }>): PillarKey[];
  ```
  規則:三合 / 三會要三支齊(可跨原局 + 外來);兩支且其中一支係中神 → `半合`(三會唔計半會)。三刑「寅巳申」「丑戌未」兩支已成刑 → `相刑`;子卯 → `相刑`;同支兩個 → `自刑`(只限辰午酉亥)。一對柱同時合同沖等,各類分別列出。`externalRelations` 只列包含外來者嘅關係(唔重複列原局內部)。

- [ ] **Step 1: 寫失敗測試**(輸入用 castBazi 實盤,數值由 lunar-javascript 1.7.7 實測):
  ```js
  // 1990-05-15 14:30 男 → 庚午 辛巳 庚辰 癸未
  const a = natalRelations(castBazi({year:1990,month:5,day:15,hour:14,minute:30,gender:"男"}).fourPillars);
  assert.deepEqual(kinds(a), ["三会:巳午未:火", "六合:午未:土"]);   // kinds = 排序後 `${kind}:${chars.join("")}:${hua??""}`
  // 1990-05-30 11:30 男 → 庚午 辛巳 乙未 壬午
  const b = natalRelations(castBazi({year:1990,month:5,day:30,hour:11,minute:30,gender:"男"}).fourPillars);
  // 必含:天干五合 乙庚 金(year+day);六合 午未(year-day、hour-day 各一);自刑 午午(year+hour);三会 巳午未
  ```
  另加:`半合` 測試(原局 `{year:{gan:"甲",zhi:"申"},month:{gan:"丙",zhi:"子"},day:{gan:"戊",zhi:"寅"},hour:{gan:"庚",zhi:"午"}}` → 含 `半合 申子 水`、`半合 寅午 火`、`相冲 寅申`、`相冲 子午`,唔含 `三合`);`suiYunBingLin("甲子","甲子") === true`;`tianKeDiChong("庚申", {…day:{gan:"甲",zhi:"寅"}…})` 含 `"day"`;`externalRelations({ganZhi:"丙子",role:"liunian"}, <1990-05-15 盤>)` 含 `相冲 子午`(liunian-year)。
- [ ] **Step 2:** `npm run build -w @numerology/knowledge -w @numerology/engine && node --test packages/engine/test/relations.test.mjs` → FAIL。
- [ ] **Step 3:** 實作 `relations.ts`、export。
- [ ] **Step 4:** 同上 → PASS。
- [ ] **Step 5: Commit** `feat(engine): 原局同歲運干支刑沖合害會破、歲運並臨、天剋地沖`

### Task 3: 胎元胎息命宮身宮 + 神煞補漏 + 原局關係入 `castBazi`

**Files:**
- Modify: `packages/engine/src/lunar-javascript.d.ts`(`EightChar` 加 `getTaiYuan/getTaiYuanNaYin/getTaiXi/getTaiXiNaYin/getMingGong/getMingGongNaYin/getShenGong/getShenGongNaYin(): string`;`DaYun` 加 `getXiaoYun(): XiaoYun[]`;`LiuNian` 加 `getLiuYue(): LiuYue[]`;新 class `XiaoYun { getYear(): number; getAge(): number; getGanZhi(): string }`、`LiuYue { getIndex(): number; getMonthInChinese(): string; getGanZhi(): string }`)
- Modify: `packages/engine/src/types.ts`(`BaziChart` 加欄位)、`packages/engine/src/bazi.ts`、`packages/engine/src/shensha.ts`
- Test: `packages/engine/test/detail.test.mjs`(加 case)、新 `packages/engine/test/shensha.test.mjs`

**Interfaces:**
- Consumes: Task 2 `natalRelations`、`GanzhiRelation`。
- Produces(`BaziChart` 新欄位):
  ```ts
  extraPalaces: Record<"taiYuan" | "taiXi" | "mingGong" | "shenGong", { ganZhi: string; naYin: string }>;
  relations: GanzhiRelation[];
  geju: GejuResult;   // Task 4 定義;本 task 先唔加,Task 4 加
  ```
- 神煞:`ShenShaContext` 加 `monthZhi: Dizhi`;`shenShaForBranch(ctx, zhi)` 改名 `shenShaForPillar(ctx, gan: string, zhi: Dizhi)`(唯一調用者係 `bazi.ts`)。新增(cite《三命通會》卷三相應篇;實作前先喺維基文庫核對表,有出入以原文為準並喺註解寫明):
  - 天德贵人(月支 → 干或支,命中柱干或柱支):寅丁 卯申 辰壬 巳辛 午亥 未甲 申癸 酉寅 戌丙 亥乙 子巳 丑庚
  - 月德贵人(月支三合 → 干):寅午戌丙 申子辰壬 亥卯未甲 巳酉丑庚
  - 红鸾(年支 → 支):子卯 丑寅 寅丑 卯子 辰亥 巳戌 午酉 未申 申未 酉午 戌巳 亥辰
  - 天喜 = 紅鸞所在支之對沖支
  - 学堂(日干 → 支,日干長生位):甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯

- [ ] **Step 1: 寫失敗測試**:
  ```js
  // 1990-05-15 14:30 男
  const c = castBazi(S);
  assert.deepEqual(c.extraPalaces.taiYuan, { ganZhi: "壬申", naYin: "剑锋金" });
  assert.equal(c.extraPalaces.taiXi.ganZhi, "乙酉");
  assert.equal(c.extraPalaces.mingGong.ganZhi, "辛巳");
  assert.equal(c.extraPalaces.shenGong.ganZhi, "己丑");
  assert.equal(c.relations.length, 2);
  ```
  `shensha.test.mjs`:用 `shenShaForPillar` 直接驗:月支寅、柱干丁 → 含「天德贵人」;月支午、柱干丙 → 含「月德贵人」;年支子、柱支卯 → 含「红鸾」;年支子、柱支酉 → 含「天喜」;日干庚、柱支巳 → 含「学堂」;舊有一項回歸(日干甲、支丑 → 含「天乙贵人」)。
- [ ] **Step 2:** build engine → 新測試 FAIL。
- [ ] **Step 3:** 實作 d.ts、types、`castBazi` 填 `extraPalaces` / `relations`、`shensha.ts`。
- [ ] **Step 4:** `npm run build && npm test` → 全 PASS(舊神煞測試唔可以變)。
- [ ] **Step 5: Commit** `feat(engine): 胎元胎息命宮身宮、原局干支關係、天德月德紅鸞天喜學堂`

### Task 4: 格局 `geju.ts`

**Files:**
- Create: `packages/engine/src/geju.ts`
- Modify: `packages/engine/src/types.ts`(`BaziChart.geju`)、`bazi.ts`、`index.ts`
- Test: `packages/engine/test/geju.test.mjs`

**Interfaces:**
- Consumes: `shiShen(dayMaster, gan)`、`dizhiHideGan(zhi)`(`shishen.ts`)。
- Produces:
  ```ts
  export interface GejuResult {
    main: string;                 // 如 "七杀格"、"建禄格"、"月劫格"(陽干稱 "阳刃格")
    also: string[];               // 兼格(其他透出藏干所成格)
    basis: "本气透" | "中气透" | "余气透" | "本气未透" | "禄刃";
    steps: string[];
    tier: "modern";
    note: string;                 // 固定:「本站按《子平真詮》月令取格簡化,不含成敗救應」
    cite: string;                 // 《子平真詮》論用神、論建祿月劫(維基文庫 / ctext URL)
    possibleCong: boolean;        // 由 castBazi 經 castFuyi 傳入;true 時 steps 尾加一句外格提示
  }
  export function castGeju(dayMaster: Tiangan, monthZhi: Dizhi, stems: { pos: "year" | "month" | "hour"; gan: string }[]): Omit<GejuResult, "possibleCong">;
  ```
  算法(唯一一段要照寫嘅規則):
  1. 月支本氣十神 = 比肩 → `建禄格`(basis 禄刃);= 劫财 → 陽干 `阳刃格`、陰干 `月劫格`。
  2. 否則依 `dizhiHideGan(monthZhi)` 次序(本、中、餘),剔除十神屬比肩 / 劫财者;第一個出現喺 `stems` 嘅藏干 → `main = 十神 + "格"`,basis 對應層;其餘透出者 → `also`。
  3. 無透 → 取本氣十神為格,basis `本气未透`。
  `possibleCong` 由 `castBazi` 讀 `castFuyi` 結果(睇 `fuyi.ts` 簽名;如引入循環依賴就喺 `castChart` 層組合,唔好硬改)。

- [ ] **Step 1: 寫失敗測試**(實盤由 lunar-javascript 1.7.7 實測):
  | 輸入(男) | 日主 / 月支 | 期望 main / basis |
  |---|---|---|
  | 1990-05-15 14:00 | 庚 / 巳(丙庚戊,干庚辛癸) | 七杀格 / 本气未透(比劫不取格) |
  | 1990-05-30 11:00 | 乙 / 巳(干庚辛壬) | 正官格 / 中气透 |
  | 1985-02-10 08:00 | 庚 / 寅(甲丙戊,干乙戊庚) | 偏印格 / 余气透 |
  | 2000-08-20 20:00 | 庚 / 申 | 建禄格 / 禄刃 |
  | 1975-11-03 04:00 | 癸 / 戌(戊辛丁,干乙丙甲) | 正官格 / 本气未透 |
  另:`castGeju("甲","卯",[])` → `阳刃格`;`castGeju("甲","巳",[{pos:"year",gan:"戊"},{pos:"hour",gan:"丙"}])` → main `食神格`、also `["偏财格"]`;`note` 等於固定字串。
- [ ] **Step 2:** build engine → FAIL。
- [ ] **Step 3:** 實作。
- [ ] **Step 4:** `npm run build && npm test` → PASS。
- [ ] **Step 5: Commit** `feat(engine): 子平真詮月令取格(簡化)`

### Task 5: 小運、流月、歲運關係入 `analyzeFortune`

**Files:**
- Modify: `packages/engine/src/fortune.ts`
- Test: `packages/engine/test/fortune.test.mjs`(加 case)

**Interfaces:**
- Consumes: Task 2 `externalRelations`、`suiYunBingLin`、`tianKeDiChong`;Task 3 d.ts。
- Produces:
  ```ts
  // DaYunAnalysis 加
  relations: GanzhiRelation[];          // 大運對原局
  tianKeDiChong: PillarKey[];
  // LiuNianAnalysis 加
  relations: GanzhiRelation[];          // 流年對原局
  tianKeDiChong: PillarKey[];
  suiYunBingLin: boolean;               // 流年干支 === 所屬大運干支
  // FortuneAnalysis.bazi 加
  xiaoYun: { year: number; age: number; ganZhi: string }[];   // 起運前虛運段(ganZhi 空白嗰步)嘅 getXiaoYun;起運後唔出
  liuYue: LiuYueAnalysis[];             // 只出 referenceYear 嗰個流年嘅 12 個月;搵唔到 → []
  export interface LiuYueAnalysis { index: number; monthName: string; ganZhi: string; ganShiShen: ShiShen; relations: GanzhiRelation[]; isCurrent: boolean }
  ```
  `isCurrent`:referenceYear === 今年且 `monthName` 為今日所屬節氣月(用 lunar-javascript `Solar.fromYmd(today).getLunar().getMonthZhi()` 對 `ganZhi[1]`);否則全部 false。

- [ ] **Step 1: 寫失敗測試**:
  ```js
  const S = {year:1990,month:5,day:15,hour:14,minute:30,gender:"男"};
  const f = analyzeFortune(S, { referenceYear: 2017 });
  assert.equal(f.bazi.liuYue.length, 12);
  assert.deepEqual(f.bazi.liuYue.map(m => m.ganZhi).join(" "),
    "壬寅 癸卯 甲辰 乙巳 丙午 丁未 戊申 己酉 庚戌 辛亥 壬子 癸丑");
  const g = analyzeFortune(S, { referenceYear: 1991, yearsBack: 1 });
  assert.deepEqual(g.bazi.xiaoYun.slice(0,3), [
    {year:1990, age:1, ganZhi:"甲申"}, {year:1991, age:2, ganZhi:"乙酉"}, {year:1992, age:3, ganZhi:"丙戌"} ]);
  // 流月越界:referenceYear 早過出生
  assert.deepEqual(analyzeFortune(S, { referenceYear: 1980 }).bazi.liuYue, []);
  // 每個 daYun / liuNian 都有 relations 陣列(可空)同 suiYunBingLin 布林
  ```
- [ ] **Step 2:** build engine → FAIL。
- [ ] **Step 3:** 實作。
- [ ] **Step 4:** `npm run build && npm test` → PASS(`fortune-boundary`、`fortune-decadal` 不變)。
- [ ] **Step 5: Commit** `feat(engine): 小運、流月、歲運對原局關係`

### Task 6: AI facts

**Files:**
- Modify: `packages/ai/src/context.ts`(`buildContextPack`、`renderFortune`)、`packages/ai/src/prompts.ts`(如有固定指令要講格局 / 關係用法)
- Test: `packages/ai/test/context.test.mjs`、`packages/ai/test/fortune-scope.test.mjs`(加 case)

**Interfaces:**
- Consumes: Task 3–5 新欄位。
- 輸出(簡體,跟現有 facts 文風):
  - `## 八字四柱` 段尾加:`- 格局(本站按《子平真诠》月令取格简化,不含成败救应):七杀格(本气未透)`;有 `also` 加「兼:…」;`possibleCong` 加「可能从格,格局仅供参考」。
  - `- 原局干支关系:三会 巳午未(火);六合 午未(年-时)…`;無則省略該行。
  - `- 胎元 壬申(剑锋金) | 胎息 乙酉 | 命宫 辛巳 | 身宫 己丑(古法,《三命通会》提要谓多有不验)`
  - `renderFortune`:大運行、流年行尾加關係摘要(只列「冲 / 刑 / 合 / 会 / 岁运并临 / 天克地冲」,如 `〔冲年柱子午;岁运并临〕`);`full` 同 `current` scope 加 `### 八字流月(当前月±1)`——只出 `isCurrent` 嗰月同前後各一月;冇 `isCurrent` 就唔出。
- prompts:加一句「格局、干支关系、流月为确定性计算;不得自行另判格局」。

- [ ] **Step 1: 寫失敗測試**:context markdown 含 `七杀格`、`三会 巳午未`、`胎元 壬申`;`fortuneScope:"current"` 而冇當前月(referenceYear 2017)時唔含 `八字流月`;某流年有 `suiYunBingLin` 時(用合成 FortuneAnalysis 物件)該行含 `岁运并临`。
- [ ] **Step 2:** build ai → FAIL。
- [ ] **Step 3:** 實作。
- [ ] **Step 4:** `npm run build && npm test` → PASS。
- [ ] **Step 5: Commit** `feat(ai): 八字格局、干支關係、胎元命宮、流月入命盤事實`

### Task 7: UI + i18n + 術語 + docs

**Files:**
- Modify: `apps/web/components/BaziDetail.tsx`(表下加三塊:格局卡(主格、兼格、basis、steps 用 `<details>` 展開、固定 note)、原局干支關係列表、胎元命宮四格小表連古籍註)
- Modify: `apps/web/components/FortuneSections.tsx`(`FortuneDayun` / `FortuneYears` 每步 / 每年加關係標籤 chip;`岁运并临`、`天克地冲` 用強調樣式;新 `FortuneMonths` 組件顯示 referenceYear 十二流月,當前月高亮;起運前顯示小運)
- Modify: 掛載 `FortuneMonths` 嘅頁面(睇 `FortuneDayun` 喺邊度 render,跟住加)
- Modify: `apps/web/lib/i18n.ts`(三語新 key,前綴 `bazi.geju.*`、`bazi.rel.*`、`bazi.extra.*`、`fortune.months.*`)
- Modify: `packages/knowledge/src/mingli-glossary.ts`(加術語:格局、建祿格、陽刃格、六合、三合、三會、六沖、六害、三刑、相破、歲運並臨、天剋地沖、胎元、命宮(八字)、小運、流月;三語)
- Modify: `docs/domains.md`(八字行補新內容;刪第 43 行殘留嘅「河洛理數 todo」)
- Test: `apps/web/test/i18n.test.mjs` 已驗 key 集合一致,跑即可。

- [ ] **Step 1:** 實作 UI;樣式沿用現有 class(`card`、`note`、`shensha` chip),唔加新 CSS 檔。
- [ ] **Step 2:** `npm run build && npm test && npm run typecheck` → PASS。
- [ ] **Step 3:** 用 `run` skill 起 `next dev`,打開命盤頁輸入 1990-05-15 14:30 男,確認:格局卡顯示「七殺格」(zht 字形)、關係列「三會 巳午未」、胎元「壬申」、流月表十二格;切 zhs / en 無缺字串。截圖存 scratchpad。
- [ ] **Step 4: Commit** `feat(web): 八字格局、干支關係、胎元命宮、流月小運顯示`

---

完成後:合併入 `main`(本 repo 冇 `dev`),然後寫 B(紫微加深)計劃。

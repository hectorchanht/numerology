# 第四期 B · 紫微加深 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 紫微加運限盤(大限 / 小限 / 流年 / 流月 / 流日)、斗君、運限流耀、疊宮、四化疊化、任意宮三方四正、《全書》格局識別、十四主星條目、飛星派宮干飛化 / 自化 / 祿忌交馳(標流派),接入 AI 同 UI。

**Architecture:** 運限、飛星、格局都係純函數,放 `packages/engine`(新 `ziwei-horoscope.ts`、`ziwei-feixing.ts`、`ziwei-geju.ts`),底層用 iztro 2.5.8(`astro.bySolar(...).horoscope(date)`、`palace.fliesTo / mutagedPlaces / selfMutaged`)。格局規則同主星條目放 `packages/knowledge`(JSON + 內聯 `.data.ts`)。UI 喺瀏覽器 `useMemo` 呼叫引擎(同 `CycleCard` 用 `castHuangji` 一樣),AI 經 `buildContextPack` / `renderFortune`。

**Tech Stack:** TypeScript、iztro 2.5.8、node:test(`.mjs`,import `../dist`,要先 build)、Next.js。

**Spec:** `docs/superpowers/specs/2026-11-05-mingli-deepening-design.md`(B 節)

## Global Constraints

- 只加新欄位 / 新函數;`castZiwei`、`analyzeFortune` 現有輸出數值不得改變(現有測試全過)。
- iztro 用 `"zh-CN"`,引擎輸出星名宮名維持簡體(如「命宫」「化禄」「运禄」);UI 經 `useScript().z()` 轉字形。
- iztro 設定保持 `algorithm: "default"`;唔開放中州派切換。
- 古籍只用公版原文(維基文庫《紫微斗數全書》,含〈骨髓賦〉〈太微賦〉);格局每條 `cite` 寫篇名;書中搵唔到原文嘅格局唔收。唔抄任何網站文字。
- 飛星派(宮干飛化、自化、祿忌交馳)tier `modern`,UI 同 AI 必須標「飛星派說法(二十世紀),非《紫微斗數全書》內容」;UI 預設摺埋;AI prompt 指示不可以此作主要判斷。
- 新 knowledge JSON `meta.reviewed: false`;改 JSON 後重新生成同名 `.data.ts`。
- 流日「今日」用瀏覽器時區(`new Date()` 喺 client)。
- 流月:UI 顯示十二個月;AI facts 只入當前月 ±1。
- i18n 新 key 三語(zht / zhs / en)齊全。
- repo 內 md、註解、commit 用繁體(zht)。
- 驗證:`npm run build && npm test && npx tsc -p apps/web --noEmit`(root `npm run typecheck` 喺 main 本身壞咗,唔用)。

## Review Focus

- 出生年之前或大限未起(小限 `age` 為 0 / 負)嘅日期 → `castZiweiHoroscope` 唔可以拋錯;未起大限時 `decadal` 標 `active: false`。測試:Task 2 `出生前日期`。
- 閏月流月:iztro 以農曆月起流月;出生 / 查詢落閏月時,斗君同流月仍要對應《全書》起法。測試:Task 2 `閏月`(用 2023 閏二月內一日)。
- 同一星同時被幾層化忌(生年 + 大限 + 流年)→ 疊化要列出全部層,唔可以只列兩層。測試:Task 2 `三層疊忌`(合成資料)。
- 宮干化星唔喺盤上(例如化科星係某輔星,iztro 冇排)→ `intoPalace` 為 `"未入盘"`,唔拋錯。測試:Task 3。
- 命宮冇主星(命無正曜)時三方四正同格局仍要正常;借對宮主星唔喺本期做。測試:Task 4 `命無正曜`。

---

### Task 1: 紫微格局規則同十四主星條目(knowledge)

**Files:**
- Create: `packages/knowledge/data/ziwei-geju.json`、`packages/knowledge/src/ziwei-geju.data.ts`、`packages/knowledge/src/ziwei-geju.ts`
- Create: `packages/knowledge/data/ziwei-stars.json`、`packages/knowledge/src/ziwei-stars.data.ts`、`packages/knowledge/src/ziwei-stars.ts`
- Modify: `packages/knowledge/src/index.ts`
- Test: `packages/knowledge/test/ziwei-geju.test.mjs`、`packages/knowledge/test/ziwei-stars.test.mjs`

**Interfaces:**
- Produces:
  ```ts
  /** 格局條件 DSL(引擎 Task 4 解讀);星名用 iztro 簡體名 */
  export type ZiweiGejuCond =
    | { op: "samePalace"; stars: string[]; branches?: string[] }   // 呢啲星同宮;branches 限該宮地支
    | { op: "inSanFang"; stars: string[] }                        // 呢啲星全部落命宮三方四正
    | { op: "inPalace"; stars: string[]; palace: "命宫"; branches?: string[] } // 星落命宮(可限命宮地支)
    | { op: "noMajor"; palace: "命宫" };                          // 命宮無主星
  export interface ZiweiGejuRule {
    id: string;                 // 例 "zifu-tonggong"
    name: string;               // 簡體,例 "紫府同宫"
    all: ZiweiGejuCond[];       // 全部成立先成格
    verdict: "吉" | "凶" | "中";
    cite: string;               // 《紫微斗數全書》篇名 + 原文短句(≤ 20 字)
  }
  export const ZIWEI_GEJU: ZiweiGejuRule[];
  export const ZIWEI_GEJU_META: KnowledgeMeta;

  export interface ZiweiStarEntry {
    name: string;               // 簡體 iztro 名
    wuxing: string;             // 例 "阴土"
    dou: "北斗" | "南斗" | "中天";
    huaqi?: string;             // 化氣,例 紫微「尊」
    zhusi: string;              // 主司,短句(本站白話,zht)
    cite: string;
  }
  export const ZIWEI_STARS: ZiweiStarEntry[];   // 十四主星,恰好 14 條
  export const ZIWEI_STARS_META: KnowledgeMeta;
  ```
- 候選格局(只收《全書》有原文者;搵唔到就剔走並喺 report 寫明):紫府同宮、機月同梁、殺破狼(七殺破軍貪狼會命三方)、府相朝垣、日月並明、君臣慶會、火貪 / 鈴貪、馬頭帶箭、命無正曜。條件寫法以原文為準。
- 原文來源:維基文庫《紫微斗數全書》(研究時有份卷二原文存喺 `/private/tmp/claude-501/-Users-laichan-code-tung-numerology/30f955e4-4ef3-4ef5-ae16-5d549ee25322/scratchpad/j2.txt`,可以先讀;仍要對維基文庫)。原文係簡體版。
- 斗位、五行、化氣以《全書》〈諸星問答論〉等篇為準;冇原文嘅欄位標 `cite` 為「通行說法」。

- [ ] **Step 1: 寫失敗測試**:`ZIWEI_STARS.length === 14`,十四個 `name` 集合等於 `["紫微","天机","太阳","武曲","天同","廉贞","天府","太阴","贪狼","巨门","天相","天梁","七杀","破军"]`;每條 `cite` 非空;`ZIWEI_GEJU` 每條 `all.length ≥ 1`、`cite` 非空、`id` 唯一;含 `id: "zifu-tonggong"`(條件 `samePalace ["紫微","天府"]`);兩份 meta `reviewed === false`;JSON 同 `.data.ts` deepEqual。
- [ ] **Step 2:** `npm run build -w @numerology/knowledge && npm test -w @numerology/knowledge` → FAIL。
- [ ] **Step 3:** 寫 JSON、`.data.ts`、模組、index export。
- [ ] **Step 4:** 同上 → PASS。
- [ ] **Step 5: Commit** `feat(knowledge): 紫微全書格局規則同十四主星條目`

### Task 2: 運限盤 `ziwei-horoscope.ts`

**Files:**
- Create: `packages/engine/src/ziwei-horoscope.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/test/ziwei-horoscope.test.mjs`

**Interfaces:**
- Produces:
  ```ts
  export type ZiweiLayerKey = "decadal" | "age" | "yearly" | "monthly" | "daily";
  export interface ZiweiLayer {
    key: ZiweiLayerKey;
    label: "大限" | "小限" | "流年" | "流月" | "流日";
    active: boolean;                 // 大限未起 / 出生前 → false,其餘欄位照填但 UI 灰
    heavenlyStem: string;
    earthlyBranch: string;
    palaceIndex: number;             // 該層命宮落本命宮 index
    natalPalaceName: string;         // 該層命宮落本命邊宮
    palaceNames: string[];           // 長度 12,index 對本命宮 index:該層十二宮名(疊宮)
    sihua: { type: "禄" | "权" | "科" | "忌"; star: string; intoPalace: string }[];
    stars: { name: string; natalPalaceName: string }[];   // 運限流耀(如「流禄」「运羊」)
    nominalAge?: number;             // 只 age 層:虛歲
  }
  export interface ZiweiOverlap {      // 四化疊化
    star: string;
    natalPalaceName: string;
    layers: { layer: "生年" | "大限" | "流年" | "流月"; type: "禄" | "权" | "科" | "忌" }[];  // ≥ 2 層先列
    tag: string;                      // 例 "忌叠忌"、"禄忌同宫"(同星不同化者用 A+"叠"+B 或 "禄忌" 規則見下)
  }
  export interface ZiweiHoroscope {
    date: string;                     // "YYYY-M-D"
    layers: ZiweiLayer[];             // 次序 decadal, age, yearly, monthly, daily
    douJun: { branch: string; natalPalaceName: string };   // 斗君 = 流年正月所在宮
    overlaps: ZiweiOverlap[];
  }
  export function castZiweiHoroscope(input: BirthInput, date: string): ZiweiHoroscope;
  /** 生年四化疊化計算,抽出嚟方便單測 */
  export function computeOverlaps(layers: { layer: ZiweiOverlap["layers"][number]["layer"]; sihua: ZiweiLayer["sihua"] }[]): ZiweiOverlap[];
  ```
  - 用 `astro.bySolar(...)` 同 `castZiwei` 一樣嘅參數(`resolveBirthDateTime`、`hourToTimeIndex`、`"zh-CN"`),然後 `a.horoscope(date)`。
  - `palaceNames`:iztro 每層 `palaceNames[i]`。`stars`:iztro 每層 `stars[i]` 為第 i 宮流耀陣列。`intoPalace`:星所在本命宮名(重用 `fortune.ts` 嘅 `buildStarToPalace` 邏輯——抽出 export,唔好複製);搵唔到 → `"未入盘"`。
  - 斗君:取查詢年農曆正月初一嘅公曆日期(lunar-javascript `Lunar.fromYmd(year,1,1).getSolar()`)再 `a.horoscope(該日).monthly.index`。
  - `tag` 規則:同星同化 ≥ 2 層 → `"{化}叠{化}"`(例 `"忌叠忌"`);同星祿忌並見 → `"禄忌同星"`;其餘多層 → 依層次序串接例 `"禄叠科"`。

- [ ] **Step 1: 寫失敗測試**(1990-05-15 14:30 男,date `"2026-11-5"`;值由 iztro 2.5.8 實測):
  ```js
  const h = castZiweiHoroscope({year:1990,month:5,day:15,hour:14,minute:30,gender:"男"}, "2026-11-5");
  assert.deepEqual(h.layers.map(l => l.label), ["大限","小限","流年","流月","流日"]);
  const [dec, age, yr, mo, dy] = h.layers;
  assert.equal(dec.heavenlyStem + dec.earthlyBranch, "己丑");
  assert.deepEqual(dec.sihua.map(s => s.star), ["武曲","贪狼","天梁","文曲"]);
  assert.equal(age.heavenlyStem + age.earthlyBranch, "庚辰"); assert.equal(age.nominalAge, 37);
  assert.equal(yr.heavenlyStem + yr.earthlyBranch, "丙午");
  assert.deepEqual(yr.sihua.map(s => s.star), ["天同","天机","文昌","廉贞"]);
  assert.equal(mo.heavenlyStem + mo.earthlyBranch, "戊戌");
  assert.equal(dy.heavenlyStem + dy.earthlyBranch, "癸未");
  assert.ok(yr.stars.some(s => s.name === "流禄"));
  assert.equal(yr.palaceNames.length, 12);
  ```
  另:`出生前日期`(date `"1985-1-1"`)唔拋錯、`decadal.active === false`;`閏月`(date `"2023-4-10"`,屬閏二月)唔拋錯且 `douJun.branch` 等於 `castZiweiHoroscope(S,"2023-2-1").douJun.branch`(同一流年斗君不變);`三層疊忌`:`computeOverlaps` 合成三層同星化忌 → 一條 `layers.length === 3`、`tag === "忌叠忌"`。斗君值:實作時用 iztro 實測再寫死入測試,並喺測試註解寫明按《全書》「流年太歲宮起正月逆至本生月,又從本生月起子順數至本生時」手算核對。
- [ ] **Step 2:** build engine → FAIL。
- [ ] **Step 3:** 實作。
- [ ] **Step 4:** `npm run build && npm test` → PASS(`fortune*.test.mjs` 不變)。
- [ ] **Step 5: Commit** `feat(engine): 紫微運限盤(大限小限流年流月流日)、斗君、流耀、疊宮、四化疊化`

### Task 3: 飛星派 `ziwei-feixing.ts` + 任意宮三方四正

**Files:**
- Create: `packages/engine/src/ziwei-feixing.ts`
- Modify: `packages/engine/src/ziwei.ts`(`ZiweiPalace` 加 `sanFang: SanFangSiZheng`,每宮用現有 `computeSanFangSiZheng` 計)、`packages/engine/src/types.ts`、`index.ts`
- Test: `packages/engine/test/ziwei-feixing.test.mjs`、`packages/engine/test/sanfang.test.mjs`(加 case)

**Interfaces:**
- Produces:
  ```ts
  export interface ZiweiFeixing {
    tier: "modern";
    note: string;   // 固定:「飛星派說法(二十世紀),非《紫微斗數全書》內容」
    flies: { from: string; stem: string; type: "禄"|"权"|"科"|"忌"; star: string; intoPalace: string }[]; // 十二宮 × 四化 = 48 條
    selfMutaged: { palace: string; type: "禄"|"权"|"科"|"忌"; star: string }[];
    luJiJiaoChi: { luPalace: string; jiPalace: string }[];
  }
  export function castZiweiFeixing(input: BirthInput): ZiweiFeixing;
  ```
  - `flies`:每宮 `heavenlyStem` 四化星(iztro 四化表,同生年四化同一套)落本命邊宮;星唔喺盤 → `"未入盘"`。可用 iztro `palace.mutagedPlaces()` 拎落宮,次序 祿權科忌。
  - `selfMutaged`:`palace.selfMutaged(type)` 為 true 者。
  - 祿忌交馳(本站定義,流派說法):某宮宮干化祿入 X 宮,同時 X 宮宮干化忌入返原宮 → 一對 `{luPalace: 原宮, jiPalace: X}`。喺 `steps` / 註解寫明「本站採此定義,各派不一」。
- `ZiweiPalace.sanFang`:新欄位;`soulSanFang` 保留不變。

- [ ] **Step 1: 寫失敗測試**:1990-05-15 14:30 男 → `flies.length === 48`;命宮(丙戌)四化落宮 = `["疾厄","兄弟","仆役","官禄"]`(iztro 實測,次序祿權科忌);命宮 `selfMutaged` 無;`note` 等於固定字串;每條 `intoPalace` 係本命宮名或 `"未入盘"`;祿忌交馳用合成 palaces 測(抽出純函數 `findLuJiJiaoChi(flies)` 並 export)。`sanfang.test.mjs`:每宮 `sanFang.branches.opposite` 係對宮地支,命宮 `sanFang` 同 `soulSanFang` deepEqual。
- [ ] **Step 2:** build engine → FAIL。
- [ ] **Step 3:** 實作。
- [ ] **Step 4:** `npm run build && npm test` → PASS。
- [ ] **Step 5: Commit** `feat(engine): 紫微飛星派宮干飛化、自化、祿忌交馳(流派說法)同十二宮三方四正`

### Task 4: 格局識別 `ziwei-geju.ts`

**Files:**
- Create: `packages/engine/src/ziwei-geju.ts`
- Modify: `packages/engine/src/types.ts`(`ZiweiChart.geju: ZiweiGejuHit[]`)、`ziwei.ts`、`index.ts`
- Test: `packages/engine/test/ziwei-geju.test.mjs`

**Interfaces:**
- Consumes: Task 1 `ZIWEI_GEJU`、`ZiweiGejuCond`;Task 3 `sanFang`。
- Produces:
  ```ts
  export interface ZiweiGejuHit { id: string; name: string; verdict: "吉"|"凶"|"中"; cite: string; steps: string[] }
  export function detectZiweiGeju(palaces: ZiweiPalace[], soulBranch: string, rules?: ZiweiGejuRule[]): ZiweiGejuHit[];
  ```
  - `samePalace`:有一宮同時有齊 `stars`(主星 + 輔星 + 雜曜都計),如有 `branches` 該宮地支要喺內。
  - `inSanFang`:`stars` 每粒都落命宮 `sanFang` 四宮之一。
  - `inPalace`:`stars` 每粒都喺命宮,`branches` 限命宮地支。
  - `noMajor`:命宮 `majorStars.length === 0`。
  - `steps` 逐條寫命中證據(例「紫微、天府同在 寅 宫」)。

- [ ] **Step 1: 寫失敗測試**:用合成 `palaces`(12 宮,只填 name / earthlyBranch / majorStars / minorStars / adjectiveStars / sanFang)驗:紫府同宮命中;拆開唔命中;`branches` 限制生效;`noMajor` 命中(命無正曜);`inSanFang` 三星落三方命中、其中一粒落三方外唔命中;再用 1990-05-15 14:30 男實盤跑 `castZiwei(...).geju`,把結果 id 列表寫死入測試(實作時實測,並喺註解逐條手核)。
- [ ] **Step 2:** build engine → FAIL。
- [ ] **Step 3:** 實作;`castZiwei` 填 `geju`。
- [ ] **Step 4:** `npm run build && npm test` → PASS。
- [ ] **Step 5: Commit** `feat(engine): 紫微全書格局識別`

### Task 5: AI facts

**Files:**
- Modify: `packages/ai/src/context.ts`、`packages/ai/src/prompts.ts`、`packages/ai/src/report.ts`(如需計算運限)
- Test: `packages/ai/test/context.test.mjs`、`packages/ai/test/fortune-scope.test.mjs`

**Interfaces:**
- Consumes: Task 2 `castZiweiHoroscope`、Task 3 `castZiweiFeixing`、Task 4 `ZiweiChart.geju`、`ZiweiPalace` 長生 / 博士 / 將前 / 歲前、`ages`。
- 輸出(簡體,append 喺現有紫微段之後,唔改現有行):
  - `- 格局(《紫微斗数全书》):紫府同宫(吉)…`;無則省略。
  - `- 小限:{虚岁}岁行{本命宫名}`(用 referenceYear 年中 `horoscope`)。
  - `- 斗君:{地支}(本命{宫名})`
  - `- 运限叠宫(当前):大限命宫=本命X、流年命宫=本命Y、流月命宫=本命Z`
  - `- 四化叠化:天同 忌叠忌(生年+流年)…`;無則省略。
  - `- 流耀(流年):流禄入X、流羊入Y、流陀入Z`
  - `- 十二宫神煞:`每宮一行縮寫「命宫 长生/博士/将星/岁建」(只入一行總表)。
  - `### 飞星派(流派说法,非《全书》,仅作参考,不作主要判断)`:只列命宮、財帛、官祿、夫妻四宮宮干化忌落宮 + 自化 + 祿忌交馳;唔列 48 條全部。
  - 流月 ±1 / 流日:`full` scope 加 `### 紫微流月(当前月±1)`(三個月:流月命宮落本命宮 + 四化)。流日唔入 AI。
- prompts:加一句「紫微格局、运限叠宫、叠化为确定性计算;飞星派内容仅作参考」放喺 persona 段**最尾**(保護 cache 前綴)。

- [ ] **Step 1: 寫失敗測試**:context 含 `斗君:`、`小限:`、`飞星派(流派说法`;`fortuneScope:"current"` 唔含 `紫微流月`;冇格局命中時唔出「格局(《紫微斗数全书》)」行;現有 context snapshot / 測試不變。
- [ ] **Step 2:** build ai → FAIL。
- [ ] **Step 3:** 實作。
- [ ] **Step 4:** `npm run build && npm test` → PASS。
- [ ] **Step 5: Commit** `feat(ai): 紫微格局、運限疊宮、斗君、疊化、流耀、飛星派(標流派)入命盤事實`

### Task 6: UI + i18n + 術語 + docs

**Files:**
- Modify: `apps/web/components/ZiweiBoard.tsx`(加 `input: BirthInput` prop;頂部運限層切換 Seg「本命 / 大限 / 小限 / 流年 / 流月 / 流日」+ `<input type="date">`(預設今日,瀏覽器時區);揀咗層之後每宮角落顯示該層宮名(疊宮)、該層四化 chip、流耀;斗君標記;點宮詳情加該宮 `sanFang` 主星、長生 / 博士 / 將前 / 歲前已有則保留)
- Modify: `apps/web/app/page.tsx:457`(傳 `input={ready.input}`)
- Create: `apps/web/components/ZiweiExtras.tsx`(格局卡:名、吉凶、cite、steps `<details>`;疊化列表;飛星派 `<details>` 預設摺埋,summary 寫固定 note;十四主星點按顯示 `ZIWEI_STARS` 條目)
- Modify: 掛 `ZiweiExtras` 喺 `ZiweiBoard` 下面
- Modify: `apps/web/lib/i18n.ts`(三語 `ziwei.layer.*`、`ziwei.geju.*`、`ziwei.feixing.*`、`ziwei.overlap.*`、`ziwei.doujun`)
- Modify: `packages/knowledge/src/mingli-glossary.ts`(加:小限、流月、流日、斗君、流耀、疊宮、疊化、宮干飛化、自化、祿忌交馳、紫府同宮、殺破狼、機月同梁、府相朝垣、日月並明、君臣慶會、命無正曜;三語;飛星派術語釋義寫明屬流派說法)
- Modify: `docs/domains.md`(紫微斗數行補新內容)

- [ ] **Step 1:** 實作;樣式沿用現有 class,唔加新 CSS 檔;引擎計算用 `useMemo`,日期改變先重算。
- [ ] **Step 2:** `npm run build && npm test && npx tsc -p apps/web --noEmit` → PASS。
- [ ] **Step 3:** 用 headless Chrome 驗(controller 已有 CDP script:`/private/tmp/claude-501/-Users-laichan-code-tung-numerology/30f955e4-4ef3-4ef5-ae16-5d549ee25322/scratchpad/ui/cdp.mjs`,填 1990-05-15 14:30 男):紫微盤出運限切換、揀「流年」後命宮角落顯示疊宮名、格局卡有內容或「無」、飛星派預設摺埋;zht / zhs / en 三語無缺字串。截圖存 scratchpad。
- [ ] **Step 4: Commit** `feat(web): 紫微運限盤切換、格局、疊化、飛星派(摺埋)、主星條目`

---

完成後:合併入 `main`(本 repo 冇 `dev`),然後寫 C(鐵版神數知識條目)計劃。

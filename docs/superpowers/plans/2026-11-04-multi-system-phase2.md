# 多體系交叉驗證 · 第二期 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增太玄經 729 贊、瑪雅曆兩個 deterministic 週期體系(「時間週期」卡 + AI 事實),以及學院科學專區(科學筆記 + 基率模擬器)。

**Architecture:** 同第一期:資料在 `packages/knowledge`(JSON + 內聯 `.data.ts` + deepEqual 測試),計算在 `packages/engine` 純函數,web 端 client 直接呼叫引擎,AI 只收序列化事實。

**Tech Stack:** TypeScript monorepo、Next.js、lunar-javascript、node:test。

**Spec:** `docs/superpowers/specs/2026-11-04-multi-system-phase2-design.md`(並沿用第一期 spec 的原則 1–14)

## Global Constraints

- 第一期全部 Global Constraints 照舊(見 `docs/superpowers/plans/2026-11-04-multi-system-phase1.md`),尤其:AI 不自行計數;每個數可展開步驟;能用圖就不用文字;每圖有文字替代;zht 無粵語口語字(測試 regex `/[嘅咗喺唔嚟佢啲睇撳冇揀㗎]|而家/`)。
- repo 文字(註解、md、commit)一律繁體;簡體只限 zhs 語言內容。
- 太玄起點 = 出生前最近一個冬至的精確時刻;以真太陽時出生時刻計;半日切分採「子夜–正午」等分法並在步驟中明說。
- 瑪雅對應常數 GMT 584283,步驟中明說(584285 為另說);以民用日期計。
- 錨點:2012-12-21 = 長紀曆 13.0.0.0.0 = Tzolk'in 4 Ajaw = Haab 3 K'ank'in。
- Dreamspell 不計算,只標 `modern` 說明。
- 太玄 / 瑪雅不入五行對照矩陣。
- 出處 URL 必須實際抓取核對,不得編造。
- 不改並行工作流的既有 data JSON。
- 工作分支 `feat/multi-system-p2`(worktree `.claude/worktrees/multi-system-p2`),完成後快轉 `main`;push 用 hectorchanht(https keychain)。

## Review Focus

1. 冬至附近出生(冬至前一刻 vs 後一刻):前者落在上一年的嬴 / 踦或末首,後者為首 1 贊 1。→ Task 2 測試。
2. 真太陽時校正跨日 / 跨半日:贊序應依校正後時刻。→ Task 2 測試。
3. 公元前 / 1582 年前日期:瑪雅 JDN 用前推格里曆還是儒略曆?本站輸入只接受引擎既有年份範圍;JDN 一律按格里曆計並在步驟說明。→ Task 3 測試(1900-01-01 第二錨點)。
4. 舊歷史紀錄:新卡從 `chart.input` 重算,不依賴已存資料。→ Task 4。
5. 模擬器 k、m 極端值(k=2,m=2;k=6,m=12):解析解與模擬誤差 < 0.02。→ Task 6 測試。

---

### Task 1: 太玄 + 瑪雅知識資料

**Files:**
- Create: `packages/knowledge/data/taixuan.json`、`packages/knowledge/src/taixuan.data.ts`、`packages/knowledge/src/taixuan.ts`
- Create: `packages/knowledge/data/maya.json`、`packages/knowledge/src/maya.data.ts`、`packages/knowledge/src/maya.ts`
- Modify: `packages/knowledge/src/index.ts`
- Test: `packages/knowledge/test/taixuan-maya.test.mjs`

**Interfaces:**
- Produces:
  - `interface TaixuanHead { n: number; name: string; cite: Cite }`;`taixuanHead(n: number): TaixuanHead`(1–81,越界拋錯);`TAIXUAN_META: KnowledgeMeta`
  - `interface MayaName { n: number; name: string; aliases: string[] }`;`TZOLKIN_DAY_NAMES: MayaName[]`(20 個,n 0–19,n 0 = Imix);`HAAB_MONTHS: MayaName[]`(19 個,含 Wayeb);`MAYA_META: KnowledgeMeta`

- [ ] **Step 1: 寫失敗測試**:81 首皆有、首 1 name「中」、首 81 name「養」;20 日名首為 Imix、末為 Ajaw;Haab 第 14 月(n 13)為 K'ank'in、末為 Wayeb;兩個 `.data.ts` 與 JSON deepEqual;meta.tier 分別為 classical / scholarly。
- [ ] **Step 2:** `npm run build -w @numerology/knowledge && npm test -w @numerology/knowledge` → FAIL。
- [ ] **Step 3:** 實際抓取 ctext.org 或 zh.wikisource.org 的《太玄經》首目,填 81 首名(繁體原字)與每首 cite(locator = 篇名 + 已抓取 URL)。瑪雅名稱用現代通行拼寫,aliases 收舊拼(如 Ahau、Kankin),cite 指向已抓取核對的學術 / 公開來源。
- [ ] **Step 4:** → PASS。
- [ ] **Step 5:** Commit `feat(knowledge): 太玄經 81 首與瑪雅曆名稱`。

### Task 2: 太玄 729 贊(engine)

**Files:** Create `packages/engine/src/taixuan.ts`;Modify `packages/engine/src/index.ts`;Test `packages/engine/test/taixuan.test.mjs`

**Interfaces:**
- Consumes: Task 1 `taixuanHead`;`resolveBirthDateTime`;lunar-javascript 節氣表(取冬至精確時刻)。
- Produces: `interface TaixuanResult { winterSolstice: { year; month; day; hour; minute }; halfDayIndex: number; head: number | null; zan: number | null; extra: "踦" | "嬴" | null; headName: string | null; steps: string[]; tier: "classical"; cite: Cite }`;`castTaixuan(input: BirthInput): TaixuanResult`

- [ ] **Step 1: 寫失敗測試**(以 helper 取某年冬至時刻 T,再構造出生時間):
  - 出生於 T 之後 1 分鐘 → halfDayIndex 0、head 1、zan 1、headName「中」。
  - T + 12 小時 + 1 分 → head 1、zan 2。
  - T + 9 × 12 小時 + 1 分 → head 2、zan 1。
  - T + 729 × 12 小時 + 1 分 → head null、extra「踦」;+730 個半日 → 「嬴」。
  - 出生於 T 之前 1 分鐘 → 屬上一個冬至週期(halfDayIndex ≥ 729 或 head 81)。
  - steps 含「冬至」「半日」「子夜」。
- [ ] **Step 2:** build + test → FAIL。
- [ ] **Step 3:** 實作。半日 index 依「子夜–正午」切分:以冬至所在半日為 index 0 的起點(取冬至時刻所在的子夜或正午邊界);在步驟中寫明。
- [ ] **Step 4:** → PASS。
- [ ] **Step 5:** Commit `feat(engine): 太玄經 729 贊定位`。

### Task 3: 瑪雅曆(engine)

**Files:** Create `packages/engine/src/maya.ts`;Modify `packages/engine/src/index.ts`;Test `packages/engine/test/maya.test.mjs`

**Interfaces:**
- Consumes: Task 1 `TZOLKIN_DAY_NAMES`、`HAAB_MONTHS`。
- Produces: `interface MayaResult { jdn: number; longCount: [number, number, number, number, number]; tzolkin: { number: number; dayIndex: number; dayName: string }; haab: { day: number; monthIndex: number; monthName: string }; correlation: 584283; steps: string[]; cite: Cite }`;`castMaya(year: number, month: number, day: number): MayaResult`

- [ ] **Step 1: 寫失敗測試**:2012-12-21 → jdn 2456283、longCount [13,0,0,0,0]、tzolkin 4 Ajaw、haab 3 K'ank'in;第二錨點取已核對日期(實作者用公開換算器 / 學術表核對後寫入,並在測試註解寫出處);steps 含「584283」。
- [ ] **Step 2:** build + test → FAIL。
- [ ] **Step 3:** 實作(格里曆 → JDN 標準整數公式)。
- [ ] **Step 4:** → PASS。
- [ ] **Step 5:** Commit `feat(engine): 瑪雅長紀曆 / Tzolk'in / Haab`。

### Task 4: 「時間週期」卡(web)

**Files:** Create `apps/web/components/CycleCard.tsx`、`apps/web/lib/cycleView.ts`;Modify `apps/web/app/page.tsx`(在 `<CrossSystemCard>` 之後)、`apps/web/lib/i18n.ts`、`apps/web/app/globals.css`;Test `apps/web/test/cycleView.test.mjs`

**Interfaces:**
- Consumes: `castTaixuan(chart.input)`、`castMaya(chart.input.year, chart.input.month, chart.input.day)`。
- Produces: `taixuanGrid(r: TaixuanResult): { head: number; zan: number } | null`(9×9 首格位置:row = ⌊(head−1)/9⌋, col = (head−1) mod 9);`tzolkinCell(r: MayaResult): { row: number; col: number }`(13 × 20 格:row = number − 1, col = dayIndex)。

- [ ] **Step 1: 寫失敗測試**:首 1 → (0,0)、首 81 → (8,8)、extra 時回 null;4 Ajaw → (3,19)。
- [ ] **Step 2:** → FAIL。
- [ ] **Step 3:** 實作 cycleView 與卡片:太玄 9×9 首格(高亮首,旁列首名與贊序)、瑪雅 13×20 Tzolk'in 格(高亮)、長紀曆與 Haab 文字列;每項可展開 steps、tier 徽章、cite;日期基準標籤;Dreamspell 說明一行;SVG `role="img"` + `aria-label` + `<title>`;三語字串。
- [ ] **Step 4:** web 測試 PASS;`npm run build -w apps/web` 成功。
- [ ] **Step 5:** Commit `feat(web): 時間週期卡(太玄、瑪雅)`。

### Task 5: AI 事實擴充

**Files:** Modify `packages/ai/src/context.ts`(`crossSystemFacts` 加入太玄、瑪雅段落)、`packages/ai/src/prompts.ts`(crosssystem 指令補一句)、`packages/ai/src/report.ts`(若需傳入);Test `packages/ai/test/crosssystem-prompt.test.mjs` 加斷言

- [ ] **Step 0:** 讀 `~/.claude/prompting-best-practices.md`。
- [ ] **Step 1: 寫失敗測試**:事實區塊含「太玄」首名與「Tzolk'in」值、標明「不入五行比對」;prompt 含「週期定位」條款(不推五行、不推吉凶斷語)。
- [ ] **Step 2:** → FAIL。
- [ ] **Step 3:** 實作。
- [ ] **Step 4:** ai + web 測試 PASS。
- [ ] **Step 5:** Commit `feat(ai): 多體系事實加入太玄與瑪雅`。

### Task 6: 學院科學專區 + 基率模擬器

**Files:** Create `apps/web/app/science/page.tsx`、`apps/web/app/science/science.tsx`、`apps/web/lib/baseRate.ts`;Modify `apps/web/lib/navGroups.ts`(學院分組加 `/science`)、`apps/web/lib/i18n.ts`、`apps/web/app/sitemap.ts`;Test `apps/web/test/baseRate.test.mjs`

**Interfaces:**
- Produces: `atLeastOneProb(k: number, m: number): number`(= 1 − (1 − 1/m)^k);`binomialDist(k: number, m: number): number[]`(index j = 恰好 j 個相同的機率);`simulate(k: number, m: number, n: number, seed: number): number[]`(各 j 的比例;固定種子 PRNG,如 mulberry32)。

- [ ] **Step 1: 寫失敗測試**:`atLeastOneProb(4,5)` ≈ 0.5904(±1e-9);`binomialDist` 總和 = 1;`simulate(4,5,10000,1)` 兩次呼叫結果相同,且與 `binomialDist(4,5)` 各項差 < 0.02;極端值 k=2,m=2 與 k=6,m=12 同樣差 < 0.02。
- [ ] **Step 2:** → FAIL。
- [ ] **Step 3:** 實作 lib 與頁面:科學筆記列表(三語、cite、待校對徽章);模擬器(k、m 滑桿,模擬 vs 解析解並排長條圖,SVG 有文字替代);look-elsewhere 說明引 `look-elsewhere` 條目。
- [ ] **Step 4:** web 測試 PASS;build 成功。
- [ ] **Step 5:** Commit `feat(web): 學院科學專區與基率模擬器`。

### Task 7: 收尾

- [ ] **Step 1:** `docs/domains.md`:太玄經、瑪雅、學院科學專區改為「已入庫」(註明 Dreamspell 不計算);工程 todo 不變。
- [ ] **Step 2:** 根目錄 `npm run build && npm test` 全綠;`npm run cf:pages` 成功。
- [ ] **Step 3:** Commit `docs: 第二期 domain 狀態更新`。

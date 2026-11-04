# 多體系交叉驗證 · 第三期 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扶抑喜忌引擎 + 對照矩陣第二軸(卡片、AI),以及全 repo 註解 / 文件簡轉繁。

**Architecture:** 同前兩期:engine 純函數 → web client 呼叫 → AI 只收序列化事實。簡轉繁用一次性腳本(不入 repo 依賴)。

**Tech Stack:** TypeScript monorepo、Next.js、node:test、本機 opencc CLI。

**Spec:** `docs/superpowers/specs/2026-11-04-multi-system-phase3-design.md`

## Global Constraints

- 第一、二期 Global Constraints 照舊(AI 不自行計數;每個數可展開步驟;圖優先;每圖有文字替代;zht 無粵語口語字;repo 文字繁體)。
- 扶抑評分權重照 spec §一 原樣:得令 ±3;藏干本氣 1.0 / 中氣 0.5 / 餘氣 0.3;天干 ±1;閾值 ±1.5;從格偵測 ±6。tier `modern`,步驟與 UI 寫明「本站簡化評分」。
- 「同我或生我」= 比劫、印;「剋洩耗」= 官殺、食傷、財。
- 基率按每盤實際計:喜用五行數 / 5、忌五行數 / 5(身弱 2/5 對 3/5,身強 3/5 對 2/5;中和不計)。
- 簡轉繁只動註解與 md;字串字面值一律不動;`README.zh-Hans.md` 不轉。
- 分支 `feat/multi-system-p3`(worktree `.claude/worktrees/multi-system-p3`);完成後快轉 `main` 並 push(hectorchanht)。

## Review Focus

1. 日主五行與月令同五行但月支藏干中氣相剋:得令只看本氣。→ Task 1 測試。
2. 中和盤:fit 全為 neutral,UI 不顯示喜 / 忌徽章而顯示「中和」。→ Task 2、3 測試。
3. 可能從格:UI 與 AI 都出現警示。→ Task 2、3、4 測試。
4. 舊歷史紀錄:卡片照常重算。→ Task 3。
5. 簡轉繁誤改字串:非註解 token 位元組不變的校驗。→ Task 5。

---

### Task 1: 扶抑引擎

**Files:** Create `packages/engine/src/fuyi.ts`;Modify `packages/engine/src/index.ts`;Test `packages/engine/test/fuyi.test.mjs`

**Interfaces:**
- Consumes: `ChartResult.bazi.fourPillars`(各柱 `gan`、`zhi`、`hideGan`)、`dayMaster`;shishen.ts `WUXING`;wuge.ts `Wuxing5`。
- Produces: `interface FuyiResult { score: number; verdict: "strong" | "weak" | "neutral"; favorable: Wuxing5[]; unfavorable: Wuxing5[]; possibleCong: boolean; steps: string[]; tier: "modern"; cite: Cite }`;`castFuyi(chart: ChartResult): FuyiResult`

- [ ] **Step 1: 寫失敗測試**:三個手算樣例(實作者先以引擎排盤取四柱,手算分數寫入測試註解):明顯身強 → verdict strong、favorable 不含日主五行;明顯身弱 → weak、favorable 含日主五行與生我五行;中和 → neutral、favorable/unfavorable 皆空。另:分數 ≤ −6 樣例 → possibleCong true。steps 含「得令」「得地」「得勢」「本站簡化評分」。
- [ ] **Step 2:** build + test → FAIL。
- [ ] **Step 3:** 實作(權重照 Global Constraints)。
- [ ] **Step 4:** → PASS。
- [ ] **Step 5:** Commit `feat(engine): 扶抑喜忌評分`。

### Task 2: 矩陣第二軸(engine)

**Files:** Modify `packages/engine/src/crosssystem.ts`;Test `packages/engine/test/crosssystem.test.mjs`

**Interfaces:**
- Produces: `CrossSystemResult.fuyi: FuyiResult`;`CrossSignal.fit?: "favorable" | "unfavorable" | "neutral"`(bazi 無)。

- [ ] **Step 1: 寫失敗測試**:非 bazi signal 的 fit 依其五行是否在 favorable / unfavorable;中和盤全部 neutral;steps 加一行說明 fit 依據與按盤計算的基率。
- [ ] **Step 2–4:** FAIL → 實作 → PASS。
- [ ] **Step 5:** Commit `feat(engine): 對照矩陣加入扶抑喜忌第二軸`。

### Task 3: 卡片第二軸(web)

**Files:** Modify `apps/web/components/CrossSystemCard.tsx`、`apps/web/lib/crossView.ts`、`apps/web/lib/i18n.ts`、`apps/web/app/globals.css`;Test `apps/web/test/crossView.test.mjs`

- [ ] **Step 1: 寫失敗測試**:`crossRows` 每列帶 `fit`(bazi 列為 "anchor");中和時 fit 全為 neutral。
- [ ] **Step 2–4:** FAIL → 實作(矩陣新欄「對你有利?」;身強弱評分條 SVG 附文字替代;扶抑步驟展開;可能從格警示;基率句;tier `modern` 徽章)→ web 測試 PASS、build 成功。
- [ ] **Step 5:** Commit `feat(web): 對照卡加入扶抑喜忌第二軸`。

### Task 4: AI 第二軸

**Files:** Modify `packages/ai/src/context.ts`、`packages/ai/src/prompts.ts`;Test `packages/ai/test/crosssystem-prompt.test.mjs`

- [ ] **Step 0:** 讀 `~/.claude/prompting-best-practices.md`。
- [ ] **Step 1: 寫失敗測試**:事實區塊含身強弱、評分、喜忌五行、各 signal fit、「本站簡化評分」;prompt 含按盤計算的第二軸基率與從格警示條款。
- [ ] **Step 2–4:** FAIL → 實作 → ai + web PASS。
- [ ] **Step 5:** Commit `feat(ai): 多體系事實加入扶抑喜忌`。

### Task 5: 全 repo 簡轉繁

**Files:** 一次性腳本放 scratchpad(不入 repo);被轉換檔案見 spec §三。

- [ ] **Step 1:** 寫腳本:TypeScript scanner(`ts.createScanner`)取每檔註解範圍,以 `opencc -c s2t` 轉換註解文字後寫回;md 檔整檔轉換(排除 `README.zh-Hans.md`)。
- [ ] **Step 2:** 校驗:對每個被改的程式檔,轉換前後以 scanner 取非註解 token 序列,逐一比對相同;不同即中止並列出檔名。
- [ ] **Step 3:** 根目錄 `npm run build && npm test` 全綠,pass 數與轉換前相同。
- [ ] **Step 4:** Commit `chore: 註解與文件簡轉繁`(獨立 commit)。

### Task 6: 收尾

- [ ] **Step 1:** `docs/domains.md`:扶抑喜忌引擎改「已入庫」;工程 todo「全 repo 簡轉繁」改「已完成」。
- [ ] **Step 2:** 根目錄 build + test 全綠;`npm run cf:pages` 成功。
- [ ] **Step 3:** Commit `docs: 第三期 domain 狀態更新`。

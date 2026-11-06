# 第四期 E · 大六壬 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用出生時刻(或 UI 揀嘅時刻)起大六壬課:月將加時天地盤、四課、九宗門三傳、天乙貴人同十二天將,接入週期卡同 AI 多體系一節。

**Architecture:** 規則表入 `packages/knowledge/data/liuren.json`(cite《六壬大全》卷次)。引擎 `packages/engine/src/liuren.ts` 分兩層:純干支核心 `castLiurenKe`(可直接用書中例子測)同包日期嘅 `castLiuren(input, at?)`。UI 喺 `CycleCard` 加一節,有可選時刻輸入;AI 經 `crossSystemFacts` 只入出生時刻課。

**Tech Stack:** TypeScript、lunar-javascript 1.7.7、node:test(`.mjs`,import `../dist`,要先 build)、Next.js。

**Spec:** `docs/superpowers/specs/2026-11-05-mingli-deepening-design.md`(E 節)

## Global Constraints

- 主要出處:《六壬大全》四庫全書本,https://zh.wikisource.org/wiki/六壬大全_(四庫全書本)(卷01–12,不著撰人,郭載騋校,明刊)。已抓好嘅原文:`/private/tmp/claude-501/-Users-laichan-code-tung-numerology/30f955e4-4ef3-4ef5-ae16-5d549ee25322/scratchpad/raw/c01.txt`–`c12.txt`(= 卷01–12);研究摘要同引文位置:同目錄上一層 `research-ef.md` A 節。唔抄任何現代網站或點校本文字。
- 每條規則 `cite` 寫卷次 + ≤ 20 字原文短句。書冇明文、本站自定嘅取法標 `tier: "modern"` 並寫明「本站取法」。
- 新 knowledge JSON `meta.reviewed: false`、`meta.tier: "classical"`;改 JSON 後重新生成同名 `.data.ts`(檔頭 AUTO-GENERATED 註解,跟 `tieban.data.ts`)。
- 引擎輸出用繁體字(同 `heluo.ts`、`qimen.ts`);UI 經 `useScript().z()` 轉字形。
- 日干支、時支取法同 `qimen.ts`(`Solar.fromYmdHms(...).getLunar().getEightChar()` 預設 sect),唔另開子時派別。
- 唔出占斷文字:書中課體吉凶斷語唔入庫,UI 同 AI 都唔作吉凶判斷。
- i18n 新 key 三語(zht / zhs / en)齊全;zht 字串唔可以有口語粵字(i18n 測試會擋「喺」等字)。
- repo 內 md、註解、commit 用繁體(zht)。commit trailer:`Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`。
- 驗證:`npm run build && npm test && npx tsc -p apps/web --noEmit`(root `npm run typecheck` 喺 main 本身壞咗,唔用)。

## 已定規則(controller rulings,實作照做)

| 項 | 定法 | 依據 / 標記 |
|---|---|---|
| 月將 | 中氣換將:雨水亥、春分戌、穀雨酉、小滿申、夏至未、大暑午、處暑巳、秋分辰、霜降卯、小雪寅、冬至丑、大寒子 | 卷02 十二神釋;書「功曹…大雪後」「處暑…鶉首」「夏至…鶉」係印錯,記入 `errata` |
| 天地盤 | 月將加占時:天盤[占時支] = 月將,其餘順推 | 卷05「月將加時」 |
| 寄宮 | 甲寅 乙辰 丙戊巳 丁己未 庚申 辛戌 壬亥 癸丑 | 卷01 十干寄宫 |
| 四課 | 一課 = 日干寄宮之天盤上神(下 = 日干);二課 = 一課上神之上神(下 = 一課上神);三課 = 日支上神(下 = 日支);四課 = 三課上神之上神 | 卷03「日主外辰主内」+ 卷05 例子反推;`tier: modern` 標「書無明文,據例反推」 |
| 三傳次序 | 伏吟 → 返吟 → 八專 → 賊剋(下賊上先,上剋下次;一個 = 重審/元首)→ 多個時比用(知一)→ 比用不決涉害(見機/察微/綴瑕)→ 無剋:遙剋(蒿矢先,彈射次)→ 昴星 → 別責 | 卷01 入手法、卷05 |
| 中末傳 | 一般:中 = 初傳上神,末 = 中傳上神;昴星、別責、八專、伏吟、返吟井欄各按卷05 特例 | 卷05 |
| 涉害深淺 | 由上神加臨之地盤位起,順行至其本家地盤位(本家不計),逐位計地盤支(連寄宮干)對該神之剋數,多者為用;俱深取四孟上神(見機),無孟取仲(察微),再同則剛日取日上先見、柔日取辰上先見(綴瑕) | 卷05「亥加丑…五重歸本家」;以書例(丁卯日丑時亥將 → 初傳亥)為準,計數細節由實作者對照 c05.txt 定,寫入 JSON |
| 貴人 | 甲戊庚 旦丑夜未;乙己 旦子夜申;丙丁 旦亥夜酉;辛 旦午夜寅;癸 旦巳夜卯;壬 旦卯夜巳 | 卷09、卷10 例子反推;壬旦夜書未明分,標 `unconfirmed: true` |
| 晝夜 | 占時支 卯辰巳午未申 = 旦(晝貴),酉戌亥子丑寅 = 夜 | 書無明文,`tier: modern`「本站取法」 |
| 順逆 | 貴人所臨地盤支喺 亥子丑寅卯辰 → 順布;巳午未申酉戌 → 逆布 | 卷02「順治謂在天門之前地戸之後」 |
| 十二天將 | 貴人 螣蛇 朱雀 六合 勾陳 青龍 天空 白虎 太常 玄武 太陰 天后 | 卷02 天將總論 |
| AI facts | 只入出生時刻課;UI 可選時刻唔入 AI | spec E「走週期卡 / 多體系路徑」 |

## Review Focus

- 占時正值中氣交接前後(例如中氣當日、交氣時刻前一分鐘)→ 月將要按交氣時刻換,唔係按日。測試:Task 2 `中氣交接`。
- 伏吟(月將 = 占時)同返吟(月將沖占時)課,四課上下全部相同或相沖,賊剋規則唔可以搶先。測試:Task 2 書例伏吟、返吟。
- 四課有兩課完全相同(重課)時,賊剋計數要按「課」唔係按「神」去重,否則比用誤判。測試:Task 2 書例比用 / 涉害。
- UI 時刻輸入清空、非法或超出 1900–2100 → 唔可以 crash,保留出生時刻課。測試:Task 4 手動 + `try/catch`。
- 子時(23:00–00:59)日干支換日 → 跟 `qimen.ts` 同一取法,唔可以同八字盤日柱唔一致。測試:Task 2 `子時`(對 `castChart` 日柱)。

---

### Task 1: 六壬規則表(knowledge)

**Files:**
- Create: `packages/knowledge/data/liuren.json`、`packages/knowledge/src/liuren.data.ts`、`packages/knowledge/src/liuren.ts`
- Modify: `packages/knowledge/src/index.ts`
- Test: `packages/knowledge/test/liuren.test.mjs`

**Interfaces:**
- Produces(`@numerology/knowledge`):
  ```ts
  export const LIUREN_META: KnowledgeMeta;
  /** 中氣(繁體名)→ 月將支 */
  export const LIUREN_YUEJIANG: Record<string, string>;
  /** 月將支 → 神名(登明、河魁…) */
  export const LIUREN_SHEN_NAME: Record<string, string>;
  /** 日干 → 寄宮支 */
  export const LIUREN_JIGONG: Record<string, string>;
  /** 日干 → { day: 支, night: 支 } */
  export const LIUREN_GUIREN: Record<string, { day: string; night: string }>;
  /** 十二天將,貴人起 */
  export const LIUREN_JIANG: readonly string[];
  /** 九宗門:id、名、子格、cite;依取課次序排 */
  export const LIUREN_METHODS: readonly { id: string; name: string; sub: string[]; cite: string }[];
  export const LIUREN_CITE: { work: string; locator: string };
  ```
  JSON 另有 `errata`、`examples`(書例:日干支、占時、月將、期望初中末傳、課名、卷次)、`dayNight`、`direction`、`shehai`(深淺計法文字)。

- [ ] **Step 1: 寫測試** `liuren.test.mjs`:月將 12 個支各出現一次;寄宮 10 干齊、值只得 8 個支;貴人 10 干齊、每干晝夜唔同;天將 12 個唔重複且首個係「貴人」;`examples` 至少 8 條,每條有 `juan`;`meta.reviewed === false`。
- [ ] **Step 2: 跑測試確認 fail**:`cd packages/knowledge && npm run build && node --test test/liuren.test.mjs` → 模組未有。
- [ ] **Step 3: 寫 JSON**(按上面已定規則表;每條 cite 對 c01–c12 原文逐字核實)、生成 `.data.ts`、寫 `liuren.ts`、index 匯出。書例要由原文抄日干支 / 占時 / 月將,三傳由規則推導(書嘅課圖亂碼,唔好照抄課圖)。至少收:戊申日卯時辰將(昴星)、丁卯日丑時亥將(涉害)、丙辰日卯時辰將(別責)、甲寅日辰時丑將(八專)、丁丑日未時未將(伏吟)、庚戌日寅時申將(返吟)、辛丑日巳時亥將(井欄)、乙卯日寅時子將(比用)、壬辰日巳時辰將(蒿矢)、壬申日申時亥將(彈射)、壬辰日酉時酉將(杜傳)。書文明寫咗嘅三傳(如戊申昴星 戌→酉→午、甲寅八專 丑亥亥、丁丑伏吟 丑戌未)照記為 `bookSanChuan`。
- [ ] **Step 4: 測試 pass**。
- [ ] **Step 5: Commit** `feat(knowledge): 大六壬規則表(月將、寄宮、貴人、天將、九宗門,cite《六壬大全》)`

### Task 2: 起課引擎

**Files:**
- Create: `packages/engine/src/liuren.ts`
- Modify: `packages/engine/src/index.ts`(匯出)、如需要 `packages/engine/src/lunar-javascript.d.ts`
- Test: `packages/engine/test/liuren.test.mjs`

**Interfaces:**
- Consumes: Task 1 全部常量。
- Produces:
  ```ts
  export interface LiurenKe { up: string; down: string }            // down 一課為日干
  export interface LiurenResult {
    at: { year: number; month: number; day: number; hour: number; minute: number };
    dayGanZhi: string; hourZhi: string;
    zhongQi: string;                                                   // 當令中氣
    yueJiang: { zhi: string; name: string };
    /** 地盤子→亥 順序,各位之天盤支 */
    tianPan: string[];
    ke: [LiurenKe, LiurenKe, LiurenKe, LiurenKe];
    sanChuan: { chu: string; zhong: string; mo: string; method: string; sub: string };
    guiren: { zhi: string; daytime: boolean; forward: boolean };
    /** 天盤支 → 天將 */
    jiang: Record<string, string>;
    steps: string[];
    tier: "classical";
    cite: { work: string; locator: string };
  }
  /** 純干支核心,書例直接測 */
  export function castLiurenKe(p: { dayGan: string; dayZhi: string; hourZhi: string; yueJiang: string }): Omit<LiurenResult, "at" | "zhongQi">;
  /** at 缺省 = 出生時刻 */
  export function castLiuren(input: BirthInput, at?: { year: number; month: number; day: number; hour: number; minute?: number }): LiurenResult;
  ```

- [ ] **Step 1: 寫測試**:
  - 由 `LIUREN_EXAMPLES`(或直接讀 JSON `examples`)逐條跑 `castLiurenKe`,斷言 `method` / `sub` 同 `[chu, zhong, mo]`;有 `bookSanChuan` 嘅條目必須等於書文。
  - `castLiurenKe({dayGan:"甲",dayZhi:"子",hourZhi:"子",yueJiang:"子"})`:`tianPan` 每位等於自己(伏吟)。
  - 中氣交接:揀一個 2024 年秋分交氣時刻,前一分鐘 `yueJiang.zhi === "巳"`、後一分鐘 `"辰"`(交氣時刻用 lunar-javascript 求,唔好寫死)。
  - 子時:`castLiuren({year:1990,month:5,day:15,hour:23,minute:30,gender:"男"}).dayGanZhi === castChart(同 input).bazi.fourPillars.day.ganZhi`。
  - 貴人:甲日卯時 → `guiren.zhi === "丑"`、`daytime === true`;甲日酉時 → `"未"`、`false`。
  - `steps.length > 0`,`cite.work` 含「六壬大全」。
- [ ] **Step 2: build 後跑測試確認 fail**。
- [ ] **Step 3: 實作 `liuren.ts`**:中氣取 lunar-javascript 節氣表(參考 `heluo.ts` `terms()`,篩中氣),按交氣時刻比較;其餘照「已定規則」表。`steps` 逐步寫(月將、天地盤、四課、取課門、三傳、貴人順逆),繁體。
- [ ] **Step 4: 測試 pass**(連現有全套)。
- [ ] **Step 5: Commit** `feat(engine): 大六壬起課(月將加時、四課、九宗門三傳、貴人天將)`

### Task 3: AI 多體系事實

**Files:**
- Modify: `packages/ai/src/context.ts`(`crossSystemFacts` 的 `cycles` 加 `liuren?: LiurenResult`,喺河洛之後 append)、`packages/ai/src/report.ts`(`liuren: castLiuren(chart.input)`)、`packages/ai/src/prompts.ts`(`CROSS_DIRECTIVE` 週期清單加「大六壬」同一句限制)
- Test: `packages/ai/test/crosssystem-prompt.test.mjs`

- [ ] **Step 1: 寫測試**:`crossSystemFacts(..., { ..., liuren })` 含 `月將 ${yueJiang.zhi}`、四課、`三傳 ${chu}→${zhong}→${mo}`、`method`、「六壬大全」;prompt 測試 must 清單加 `"大六壬"`、`"不作占斷"`。
- [ ] **Step 2: 跑確認 fail**。
- [ ] **Step 3: 實作**:facts 一行過列 月將(神名)、天地盤(子→亥)、四課、三傳 + 課門、貴人(晝夜、順逆)、天將落三傳;層級 + cite;`step(lr.steps)`。prompt 條款:「大六壬只講出生時刻所起之月將、四課、三傳、課門與天將位置,不作占斷,因為書中課體斷語未入庫」。只 append,唔改既有字串次序(保 prompt cache 前綴)。
- [ ] **Step 4: pass**。
- [ ] **Step 5: Commit** `feat(ai): 多體系事實附大六壬出生課`

### Task 4: 週期卡 UI、i18n、docs

**Files:**
- Modify: `apps/web/components/CycleCard.tsx`(新 `Liuren` 組件,放 `Heluo` 之後)、`apps/web/lib/i18n.ts`(三語)、`apps/web/lib/glossary*`(如現有術語表結構要求;加 月將、四課、三傳、九宗門、天將)、`docs/domains.md`(加大六壬一行)
- Create: `docs/liuren.md`(用自己文字概述起課步驟同已定規則、errata、「本站取法」各項)

- [ ] **Step 1: 實作 `Liuren`**:預設顯示出生時刻課;`<input type="datetime-local" min="1900-01-01T00:00" max="2100-12-31T23:59">` 加「而家」掣(用瀏覽器本地時間);輸入改變時 `castLiuren(chart.input, at)`,包 `try/catch`,失敗或清空就退返出生課。顯示:月將、四課(四格 上/下)、三傳 + 課門 + 天將、貴人晝夜順逆;`Meta` tier/cite;`Steps`;註「只列起課結果,不作占斷」。風格跟 `Heluo`。
- [ ] **Step 2: i18n 三語 + docs**。
- [ ] **Step 3: 驗證**:`npm run build && npm test && npx tsc -p apps/web --noEmit`;再用 headless Chrome(`/private/tmp/claude-501/-Users-laichan-code-tung-numerology/30f955e4-4ef3-4ef5-ae16-5d549ee25322/scratchpad/ui/cdp.mjs`,見 controller 指示)截圖確認週期卡有大六壬一節、三語唔漏 key。
- [ ] **Step 4: Commit** `feat(web): 週期卡加大六壬(可選起課時刻)`

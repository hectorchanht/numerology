# 第四期 F · 七政四餘 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 出生時刻七政(日月五星)同四餘(羅睺、計都、月孛、紫氣)嘅黃經同二十八宿宿度:古宿度為主,並列現代距星宿度,接入週期卡同 AI 多體系一節。

**Architecture:** 宿度表、距星座標、四餘定義同公式入 `packages/knowledge/data/qizheng.json`。引擎 `packages/engine/src/qizheng.ts` `castQizheng(input)`:七政取 `castEphemeris` 黃經,四餘用平均根數公式,宿度用距星歲差到當日。UI `CycleCard` 加一節;AI 經 `crossSystemFacts`。

**Tech Stack:** TypeScript、astronomy-engine(已裝)、node:test、Next.js。

**Spec:** `docs/superpowers/specs/2026-11-05-mingli-deepening-design.md`(F 節)

## Global Constraints

- 原典只用公版(維基文庫):《星學大成》四庫本、《張果星宗》、《六壬大全》卷十一、《推步捷例》(南相吉 1861)、《清史稿》卷45、《古今圖書集成·曆法典》第058卷(崇禎曆書)。研究摘要同 URL:`/private/tmp/claude-501/-Users-laichan-code-tung-numerology/30f955e4-4ef3-4ef5-ae16-5d549ee25322/scratchpad/research-ef.md` B 節;原文快取 `.../scratchpad/raw/`。唔抄現代網站文字。
- 距星現代座標係事實數據:用公開星表(Hipparcos / SIMBAD J2000 赤經赤緯),`source` 寫星表名同 HIP 號。
- 新 knowledge JSON `meta.reviewed: false`;改 JSON 後重新生成 `.data.ts`。
- 四餘全部標「推算公式」;紫氣另標「流派公式」(崇禎曆書、清史稿已明言紫氣無實象)。
- 唔出吉凶斷語(星學大成 斷語未入庫)。
- 鐘面時間處理同 `castEphemeris`(東八區、未計夏令時),唔另起一套。
- i18n 三語齊;repo 文字繁體;commit trailer 同前。
- 驗證:`npm run build && npm test && npx tsc -p apps/web --noEmit`。

## 已定規則(controller rulings)

| 項 | 定法 | 依據 / 標記 |
|---|---|---|
| 七政 | 太陽、太陰、水星(辰)、金星(太白)、火星(熒惑)、木星(歲星)、土星(填/鎮星);黃經取 `castEphemeris` 回歸黃經 | 現有引擎 |
| 羅睺 | 平均升交點(白道正交),Meeus 平均交點式 Ω = 125.04452° − 1934.136261°·T(T 為 J2000 起儒略世紀);計都 = 羅睺 + 180° | 張果星宗「交初為羅睺,交中為計都」、清史稿卷45「羅睺即白道之正交」;《推步捷例》相反(計都 = 正交),列入 `variants`,UI/AI 標明有分歧 |
| 月孛 | 平均遠地點(月行最高):Meeus 平均近地點 ϖ = 83.3532465° + 4069.0137287°·T,再 +180° | 崇禎曆書「月孛者,月行之最遲也」、清史稿「月行極高之點」 |
| 紫氣 | 《推步捷例》:以乾隆甲子為元,年根七宮 17°50′14.53″,日行 126.7207777″,順行;實作者由原文核實「元」之確切時刻(年根是否為天正冬至)同「七宮」起算點,換算成回歸黃經,寫入 JSON;核實唔到就照原文最直接讀法並記 `note` | `tier: modern`「流派公式」;並記《星學大成》卷十九 28 年(10228 日)作周期對校,測試斷言兩者周期相差 < 1% |
| 宿度(現代) | 二十八宿距星 J2000 黃經,按 IAU 歲差(一般歲差 50.29″/年,或 astronomy-engine 歲差函數如有)推到出生日;某點所在宿 = 黃經 ≥ 該宿距星而 < 下一宿距星 | 現代值 |
| 宿度(古) | 以《六壬大全》卷十一宿度表(27 值 + 每宿初度,合周天 365 度,觜附參)為古宿度,錨定角宿距星現代黃經;某點之古宿度 = 由角宿起累計古度(古度 = 現代度 × 365 / 360)判宿同宿內度。主顯示古宿度,並列現代 | 原表唯一完整且可自洽(總和 365);《星學大成》卷一〈約二十八宿度數歌〉能讀出嘅值記入 `variants` 作校 |

## Review Focus

- 黃經跨 0°/360°(例如羅睺 359.9°)同跨角宿起點 → 宿判定唔可以落空或重複。測試:Task 2 `跨零度`。
- 1900 / 2100 邊界日期 → 唔拋錯,四餘同宿度數值仍在 [0,360)。測試:Task 2。
- 觜宿附參(古表)→ 古宿度輸出時參宿範圍包觜,唔可以出現「觜宿」寬度 0 嘅怪值;現代表觜照常有距星。測試:Task 2。
- 羅計分歧:引擎輸出同時帶 `variant` 說明;UI、AI 文字必須提「推步捷例對調」。測試:Task 3 facts 含「推步捷例」。
- 未填經緯度 → 七政四餘全部照計(唔需要地點)。測試:Task 2。

---

### Task 1: 七政四餘知識表

**Files:** Create `packages/knowledge/data/qizheng.json`、`src/qizheng.data.ts`、`src/qizheng.ts`、`test/qizheng.test.mjs`;Modify `src/index.ts`。

**Interfaces — Produces:**
```ts
export const QIZHENG_META: KnowledgeMeta;
/** 二十八宿:序、名、距星(名 + HIP)、J2000 黃經(度)、古度(觜為 0 並標 attachedTo:"參") */
export const QIZHENG_MANSIONS: readonly { n: number; name: string; star: string; hip: number; lonJ2000: number; ancientDeg: number; attachedTo?: string }[];
export const QIZHENG_SEVEN: readonly { body: "Sun"|"Moon"|"Mercury"|"Venus"|"Mars"|"Jupiter"|"Saturn"; name: string; alias: string }[];
/** 四餘:id(luohou/jidu/yuebei/ziqi)、名、定義、公式文字、cite、tier、variants */
export const QIZHENG_YU: readonly { id: string; name: string; definition: string; formula: string; tier: "classical"|"modern"; cite: string; variants?: string[] }[];
/** 紫氣根數(已換算) */
export const QIZHENG_ZIQI: { epochJd: number; lonAtEpoch: number; degPerDay: number; source: string; note: string };
```
- [ ] Step 1 測試:宿 28 個、`n` 1–28;古度總和 = 365(含觜附參);`lonJ2000` 由角起逐宿遞增(mod 360 只繞一次);紫氣 `360/degPerDay` 同 10228 日相差 < 1%;每個 `cite` 非空;`meta.reviewed === false`。
- [ ] Step 2 跑確認 fail。
- [ ] Step 3 寫 JSON(cite 原文逐字對 raw 檔)、生成 data.ts、ts、index 匯出。距星 J2000 黃經由 RA/Dec 換算(黃赤交角 23.4392911°),換算腳本放 scratchpad 唔入 repo,JSON 記星表來源。
- [ ] Step 4 pass。Step 5 Commit `feat(knowledge): 七政四餘宿度表、距星、四餘定義`

### Task 2: `castQizheng` 引擎

**Files:** Create `packages/engine/src/qizheng.ts`、`test/qizheng.test.mjs`;Modify `src/index.ts`。

**Interfaces — Produces:**
```ts
export interface QizhengBody {
  id: string; name: string; kind: "政" | "餘";
  longitude: number;                         // 回歸黃經
  mansion: { name: string; degree: number }; // 現代距星宿度
  ancient: { name: string; degree: number }; // 古宿度(古度單位)
  retrograde?: boolean;                      // 七政由 ephemeris 帶;羅計恆逆
}
export interface QizhengResult { utc: string; bodies: QizhengBody[]; variants: string[]; steps: string[]; tier: "classical"; cite: { work: string; locator: string } }
export function castQizheng(input: BirthInput): QizhengResult;
```
- [ ] Step 1 測試:J2000.0(2000-01-01 20:00 東八區 = 12:00 UTC)羅睺 ≈ 125.04°(±0.01)、計都 = 羅 + 180;月孛 ≈ 263.35°(±0.01);七政黃經 = `castEphemeris` 同值;11 個 body;所有黃經 ∈ [0,360);1900-01-01 同 2100-12-31 唔拋錯;一點黃經等於某宿距星 → 落該宿 0 度;跨零度點宿判定正確;古宿冇「觜」。
- [ ] Step 2 fail。Step 3 實作(`steps` 繁體逐步)。Step 4 pass。Step 5 Commit `feat(engine): 七政四餘排盤(七政、羅計孛炁、古今宿度)`

### Task 3: AI facts

同 E 計劃 Task 3 做法:`crossSystemFacts` `cycles.qizheng`、`report.ts` 傳 `castQizheng(chart.input)`、`CROSS_DIRECTIVE` 加「七政四餘只講各曜所在宿度(古宿度、現代宿度並列)與四餘推算來源,不作吉凶斷語;羅計有對調分歧、紫氣為流派公式須講明」。測試 facts 含「推步捷例」「流派公式」、prompt must 清單加「七政四餘」。Commit `feat(ai): 多體系事實附七政四餘`

### Task 4: 週期卡 UI、i18n、docs

`CycleCard` 加 `Qizheng`(表格:曜名、黃經、古宿度、現代宿度;四餘行標推算/流派;羅計分歧註);i18n 三語;`mingli-glossary.ts` 加 七政、四餘、宿度、距星;`docs/domains.md` 一行;`docs/qizheng.md` 概述同已定規則。驗證同上 + headless Chrome 截圖。Commit `feat(web): 週期卡加七政四餘`

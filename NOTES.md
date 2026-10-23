# Numerology 硬化重建 — 说明

## 多语言(zht 默认 / zhs / en,2026-10-22)

- 新增 `apps/web/lib/i18n.ts`:Locale 类型 `"zht"|"zhs"|"en"`,177 key 的 STRINGS 三地字典,
  `useLocale()`(外部 store + useSyncExternalStore,全应用共享,localStorage `numerology-locale` 持久化,
  默认 `"zht"`),`fmt()` 占位符填充,`LocaleSwitch`(繁/简/EN,复用 `.mode-switch` 样式,置于 masthead)。
  zht 为香港书面繁体(非机械转换);zhs 沿用原简体文案;en 自然英文。
- 全部 9 个组件 + page.tsx + layout.tsx(`<html lang="zh-Hant">`,metadata 繁体)改用 `t()`。
  干支/星曜/宫位/地名等专名三地保持原样;性别 option 的 value 仍为 男/女(引擎要求),仅 label 本地化。
- AI 输出语言:请求体新增可选 `locale` 字段(4 个 AI 路由解析,默认 zht),
  经 `ReportOptions`/`ChatOptions`/hourinfer opts 传入;`localeDirective()` 追加为 system 末块
  (不碰命盘事实块,Anthropic prompt cache 前缀不受影响)。
  前端 StreamedReport/ChatPanel/TimeInferPanel 的 POST body 均带当前 locale。
- 测试:web 新增 `test/i18n.test.mjs`(6 项:默认 zht、三地 key 集合一致、非空、关键繁体文案、fmt、node 下 setLocale 不抛错);
  ai 新增 `test/locale.test.mjs`(3 项:指令三地各异、system 末块为语言指令、命盘事实块不受语言影响)。
  全量 66/66 通过;`next build` 与 `npm run cf:pages` 均成功。
- 未改:排盘数学、API 形状(仅新增可选 locale 字段)、样式、无新 provider、无付费墙。

自建副本(源自 MIT 授权的上游仓库,保留原 README 中的 MIT 声明)。
目标:修掉已知的 8 个 bug + 增强免费 AI provider,本地构建/验证,不部署。

## 构建与验证(2026-10-22)

- `npm install`(根目录):179 包,正常。
- `npm run build -w @numerology/knowledge -w @numerology/engine -w @numerology/ai`:通过。
- `npm test`(全部 workspace):**57/57 通过**(ai 7 / engine 36 / knowledge 5 / web 9)。
- `next dev` 本地启动后 curl 实测见下。

## 修复的 bug

1. **日期校验缺失**(`packages/engine/src/time.ts`)
   新增 `daysInMonth()`(闰年规则)并在 `validateBirthInput` 中按真实历法校验;
   2 月 30 日/4 月 31 日/平年 2 月 29 日现在被拒,报错如
   `非法出生信息: 日 30(2023年2月只有 28 天)`。
   回归测试:`packages/engine/test/time-validation.test.mjs`。
   API 实测:`POST /api/chart` 传 2023-02-30 → 400 + 上述信息。

2. **错误码一刀切 400**(`apps/web/lib/http.ts` 新建,6 个路由全部接入)
   分类规则:输入/校验错误与「未知 AI provider」→ 400;
   key 缺失/鉴权失败/限流/网络/超时/上游 5xx → **502** + 清晰中文信息。
   注意:验收标准要求未知 provider 返回 400(它是客户端传错名字,属输入错误),
   故与「AI provider 错误 → 502」清单中的字面表述略有出入,此处按验收标准实现。
   回归测试:`apps/web/test/lib.test.mjs`(分类矩阵)。

3. **流式路由首 token 前失败被静默截断**(`apps/web/lib/stream.ts`)
   新增 `streamToPrimedResponse()`:等待首个文本块(默认 20s 超时)后才返回 Response;
   首 token 前失败直接抛给调用方 → 按(2)返回 JSON 错误,不再发半截流。
   首块会被回放,正文不丢失不重复。4 个流式路由(report/fortune/chat/infer-time)已切换。
   回归测试:`apps/web/test/stream.test.mjs`(伪造流:首块前失败→抛错;成功→正文完整;超时→抛错)。
   API 实测:`POST /api/report` 传未知 provider → 400 JSON(不 hang);见下。

4. **.env 解析器太弱**(`apps/web/lib/env.ts`)
   新解析器支持 `export KEY=...`、大小写 key、单/双引号(含 `\"` 转义)、
   未引用值的行尾注释(` # ...`)、空行/`#` 注释。导出 `parseDotEnvLine` 供测试。
   回归测试:`apps/web/test/lib.test.mjs`。

5. **birth 解析边界**(`apps/web/lib/birth.ts`)
   `year/month/day/hour/minute` 拒绝非整数(如 1990.5)→`字段 year 必须为整数(收到 1990.5)`;
   `longitude` 允许小数但校验 `-180~180`,越界如 200 → `经度 200 超出范围(-180~180)`。
   回归测试:`apps/web/test/lib.test.mjs`。

6. **农历换算后可能越界**(`apps/web/lib/birth.ts` 的 `resolveCalendar`)
   换算后校验 1900–2100;如农历 2100-12-29 → 公历 2101-01-28 会报
   `农历2100年12月29日换算为公历2101年1月28日,超出引擎支持范围(1900-2100)`,
   而不是下游一句看不懂的「非法出生信息: 年 2101」。
   非法闰月(如 2024 年闰二月,该年无此闰月)仍由引擎报 `非法农历日期…`,→ 400。
   回归测试:`apps/web/test/lib.test.mjs`;API 实测 `/api/chart` 非法闰月 → 400。

7. **hourToTimeIndex 核对**(verify-only,**未改代码**)
   与 iztro 自身实现(`iztro/lib/utils/index.js` 的 `timeToIndex`)逐小时比对 24/24 一致;
   00:30 → 早子(index 0)、23:30 → 晚子(index 12),两盘时柱皆为子,
   且晚子时 bazi/iztro 同步按次日计(iztro 文档化约定)。无 off-by-one,不改确定性数学。
   回归测试:`packages/engine/test/hourindex.test.mjs`。

8. **analyzeFortune 年边界**(verify + 回归测试,**未发现 throw/off-by-one**)
   出生 1900/2100 × yearsBack 5/yearsAhead 8、ref 2110(超出生后)/ref 1890(出生前)
   均不抛错;紫微流年窗口起止与 `Math.max(windowStart, 出生年)..referenceYear+8` 一致;
   出生前窗口返回空数组(合理)。回归测试:`packages/engine/test/fortune-boundary.test.mjs`。

## 新增免费 AI provider

- **`openrouter`(已接入并验证)**:
  `https://openrouter.ai/api/v1`(实测 `/models` 返回 200,共 468 个模型),
  需 key(`OPENROUTER_API_KEY`,注册免费),`free: true`。
  默认模型经**实时 `/models` API 核验存在且 prompt 价为 0**:
  report=`google/gemma-4-31b-it:free`(262K 上下文),chat=`google/gemma-4-26b-a4b-it:free`;
  UI 另备选 `nvidia/nemotron-3.5-lightning:free`(1M 上下文,同样已核验)。
  曾考虑但**未采用**的候选:`openai/gpt-oss-20b:free`、`qwen/qwen3.8-27b:free`
  在当前 catalog 中不存在——不要凭记忆写这些 ID。
  接入点:`packages/ai/src/provider.ts`、SettingsPanel 的 PROVIDERS/MODELS、
  README(中/英)provider 表、`.env.example`。
- **`uncloseai.com`(跳过)**:多次 curl 均超时(HTTP 000),服务不可达——不接入。
- **`ollamafreeapi`(跳过)**:它没有公共网关,只是自托管代理(`server.py` 跑在
  `127.0.0.1:8000`),后端是随时增减的社区 Ollama 节点(IP:port 直连)。
  实测 3 个节点中 2 个已死,唯一存活的能列出模型但实际生成超时。
  把这种易失节点硬编码进 provider 注册表等于埋雷——不接入。

## Cloudflare Pages (next-on-pages / workerd) 可移植性审计

部署目标为 Cloudflare Pages(Workers runtime + nodejs_compat),本次**未做部署**。
要求:不新增 import 时的 node-only API。审计结果:

**import 时(node-only,已存在、未新增):**
- `packages/engine/src/index.ts`:顶部 `import { createRequire } from "node:module"`,
  仅用于 `depVersion()` 读依赖 package.json 版本号(try/catch 包裹,失败降级 "unknown")。
  workerd 下 `node:module` 的 createRequire 可用性取决于构建产物形态(next-on-pages
  打包后 `import.meta.url` 语义变化);若部署时排盘 meta 读不到版本,只会显示
  "unknown",不影响排盘本身。**部署前建议验证**:若 workerd 报错,改为构建时注入版本号。
- `packages/ai/src/provider.ts`:模块顶层 `PROVIDERS` 对象字面量内读取
  `process.env.POLLINATIONS_BASE_URL` / `OLLAMA_BASE_URL` / `OPENROUTER_BASE_URL`
  (本轮新增 openrouter 条目沿用既有模式,未新增类别)。
  nodejs_compat 下 `process.env` 可用;但若构建时静态求值,这些值会被烘焙进产物——
  部署后改环境变量需重新部署。BYOK/请求级覆盖(`opts` 参数)不受影响。

**请求时(惰性,已存在、未新增):**
- `apps/web/lib/env.ts`:`readFileSync` + `process.cwd()` 只在 `ensureEnv()` 内执行,
  import 时无副作用。**注意**:Pages/Workers 无文件系统,`.env` 文件加载在该环境
  必然走 `catch` 空分支——key 必须走 Cloudflare 环境变量 / 请求级 BYOK。
  本轮重写的解析器未引入新的 node API。
- `packages/ai/src/provider.ts` 内其余 `process.env` 读取(`activeProviderName`、
  `resolveDef`、`apiKeyFor`、`modelFor`)均为函数内惰性读取,无 import 时副作用。
- `apps/web/lib/stream.ts` 新增的预热逻辑只用 `setTimeout`/`ReadableStream`/
  `TextEncoder`,workerd 原生支持。

**结论**:本轮没有新增任何 import 时的 node-only API;
已知的两个 import 时触点(createRequire、顶层 process.env)都是上游既有设计,
部署前按上面标注验证即可。

## API 实测记录(本地 next dev,2026-10-22)

| 请求 | 结果 |
|---|---|
| `POST /api/chart` 正常出生(1990-05-30 11:30 男) | 200,bazi+ziwei 双盘 + fortune |
| `POST /api/chart` 2023-02-30 | 400 `非法出生信息: 日 30(2023年2月只有 28 天)` |
| `POST /api/chart` 农历 2024 闰二月十五 | 400 `非法农历日期(2024年闰2月15日):该年可能无此闰月或无此日` |
| `POST /api/hour-candidates` 1990-06-15 男 | 200,12 个候选 |
| `POST /api/report` 未知 provider(+合法 section) | 400 `未知 AI provider="nope"。可选:…`(立即返回,不 hang) |
| `POST /api/report` 非法 section 名 | 400 `未知报告章节:总论`(分类器补上 `未知.*章节` → 400,见下) |
| `POST /api/report` section + 默认 pollinations | **502** `{"error":"AI 服务网络异常(连接失败或超时),请稍后重试"}`——干净 JSON,无截断流、无 500 |

## 未完全验证

- `POST /api/report`(pollinations 实时成功路径):本沙箱直连
  `text.pollinations.ai` 的 chat completions POST 会 hang(30s 超时;GET /models 正常),
  故只实测到了故障路径 → 干净 JSON 502,符合验收标准。
  **成功出流路径未在本地实测**(单元测试用伪造流覆盖了正文完整性)。
- 实测中发现并修复:非法 section 名(`未知报告章节:…`)原先被分到 502,
  已补进 `VALIDATION_RE`(→ 400)。未知 provider 一度因测试用了非法 section 名而
  误报 502,换合法 section 后确认为 400。
- Cloudflare Pages 实际部署:按要求未做;可移植性见上节审计,部署前需验证
  createRequire 与顶层 `process.env` 在 workerd 产物中的行为。
- Cloudflare Pages 实际部署:按要求未做;可移植性见上节审计,部署前需验证
  createRequire 与顶层 `process.env` 在 workerd 产物中的行为。

## Cloudflare Pages 部署(2026-10-22,edge 移植)

为上 Pages(Workers/workerd)做的移植,排盘数学与 UI 未动:

- 6 个 API 路由:`runtime = "nodejs"` → `"edge"`,删除 `maxDuration = 60`(Pages 不支持)。
- `packages/engine/src/index.ts`:删掉顶层 `import { createRequire } from "node:module"`;
  新增 `scripts/gen-versions.mjs`(构建时读已安装依赖版本号,写入
  `src/versions.generated.ts`),`depVersion()` 改为查表,缺失 → "unknown"。
  engine 的 build 脚本改为 `node scripts/gen-versions.mjs && tsc -p tsconfig.json`。
- `apps/web/lib/env.ts`:删掉顶层 `node:fs`/`node:path` import;`ensureEnv()` 改为
  async,内部用 `import(/* webpackIgnore: true */ "node:fs")` 懒加载,
  Workers 下静默 no-op(key 走 CF 环境变量 / BYOK)。4 个 AI 路由改为 `await ensureEnv()`。
- 全仓库 grep:无其它 import 时的 node: API(`provider.ts` 顶层的
  `process.env.*_BASE_URL` 在构建时求值,保留)。
- 新增 `@cloudflare/next-on-pages@1.13.12`(apps/web devDependency;新版要求
  next>=14.3,故 pin 1.13.12 + `--legacy-peer-deps` 绕过 wrangler 的 peerOptional 冲突)。
- 根 `package.json` 新增 `cf:pages` 脚本:构建三个包 → `cd apps/web && npx @cloudflare/next-on-pages`。
- 本地 `wrangler pages dev` 实测 workerd:首页 200、`/api/chart` 正常 200(含
  engine 版本号 2.5.8/1.7.7)、2023-02-30 → 400、未知 provider → 400 JSON。

Pages 项目 `numerology`(https://numerology-7v4.pages.dev),GitHub
hectorchanht/numerology,production_branch main,
build_command=`npm install && npm run cf:pages`,
destination=`apps/web/.vercel/output/static`,env:AI_PROVIDER=pollinations,NODE_VERSION=20。

## 部署实测(2026-10-22,Cloudflare Pages)

- Pages 项目 `numerology`,生产 URL **https://numerology-7v4.pages.dev**,
  GitHub hectorchanht/numerology,production_branch=main,
  build=`npm install && npm run cf:pages`,输出=`apps/web/.vercel/output/static`,
  env: `AI_PROVIDER=pollinations`、`NODE_VERSION=20`。
- 首次生产部署一次成功(queued→initialize→clone→build→deploy 全绿)。
- 线上实测:
  - 首页 200,标题「命理 · 八字紫微合参」。
  - `POST /api/chart` 正常出生 → 200,bazi(日主辛)+ziwei(12 宫)+fortune,engine 版本号正常注入。
  - `POST /api/chart` 2023-02-30 → **400** `非法出生信息: 日 30(2023年2月只有 28 天)`。
  - `POST /api/report` 未知 provider → **400** JSON,立即返回。
  - `POST /api/report` section=personality(默认 pollinations)→ **200** 流式中文报告,无 500/截断。

## Provider 大改(2026-10-22,Workers AI 預設 + $2/月硬上限 + 動態模型)

背景:Pollinations 免費 tier 從 Cloudflare edge 連線飄忽(首 token > 20s → 502、
共享 IP 被限流 429),edge 外直連則正常。改為預設走 Cloudflare Workers AI binding。

### Workers AI 接入
- **预热超时 60s(2026-10-23 補)**:Workers AI 冷启动首 token 可能 >20s(线上实测 21s+
  触发预热超时 → 502)。`streamToPrimedResponse` 的预热超时改为按 provider 区分
  (`apps/web/lib/primeTimeout.ts`):workers-ai 60s,其它保持 20s。4 个 AI 路由已接入。

- **繁中指令前置(2026-10-23 補)**:實測 Llama 3.1 8B 對 system 末尾的 `localeDirective`
  遵循不穩(仍出簡體)——中文訓練語料以簡體為主。但把同一指令放在 user 消息開頭
  即穩定輸出繁體(REST 實測驗證)。故 workers-ai 路徑在 `provider.ts` 的
  `promoteLocaleDirective()` 中把語言指令塊同時前置到第一條 user 消息(system 塊保留,
  雙保險)。此為 workers-ai 專屬,不動其他 provider 的 system 末塊設計(Anthropic
  prompt-cache 前綴考量)。線上驗證後確認 zht 輸出繁體才算關閉此項。

- `packages/ai/src/provider.ts`:新增 `kind: "workers-ai"`,經 `env.AI` binding 調用,
  無需 API key。`ProviderOptions.aiBinding`(僅服務端注入,絕不來自請求體/序列化給客戶端)。
- API 路由經 `@cloudflare/next-on-pages` 的 `getRequestContext()` 取 `env.AI` /
  `env.AI_BUDGET_KV`(`apps/web/lib/aiBinding.ts` + `aiOpts.resolveServerAi()`),
  4 個 AI 路由已切換。binding 缺失(本地開發)→ 502 但保留明確指引(不被兜底文案吞掉)。
- 流式:SSE(`data: {"response":"..."}` … `data: [DONE]`)解析為統一 TextStream;
  非流式直接取 `response` 字段。
- 預設模型 **`@cf/mistralai/mistral-small-3.1-24b-instruct`**(2026-10-23 起):
  唯一在「長簡體 prompt + 繁體指令」下穩定輸出繁體的模型。Llama 3.1 8B 實測會被
  prompt 中的簡體錨定、無視 `localeDirective`(user 消息前置指令也救不回來);
  Mistral Small 3.1 嚴格遵循指令,輸出乾淨繁體。`usage.neurons` 直接可用。
  代價:neurons/token 約為 Llama 8B 的 3 倍,$2 預算 ≈ 75 次完整解讀/月(個人用足夠,
  預算守衛是硬上限)。備選:`@cf/meta/llama-3.1-8b-instruct-fp8`(便宜但繁體不穩)、
  `@cf/meta/llama-3.2-3b-instruct`(最快最便宜,80K ctx)。
- **明確排除**:`@cf/zai-org/glm-4.7-flash`、`@cf/qwen/qwen3-30b-a3b-fp8` 等 reasoning 模型——
  實測會把思考過程塞進 `reasoning`/`reasoning_content` 字段而 `content` 為 null,
  不適合直接做解讀。`@cf/deepseek-ai/deepseek-v4-flash-0731` 等標 `require_workers_paid` 的不用。

### $2/月硬預算守衛(`packages/ai/src/budget.ts`)
- Workers AI 無原生 spending cap,應用層強制:每次調用前 `checkBudget()`、
  調用後 `recordUsage()` 經 KV(`AI_BUDGET_KV`,namespace `numerology-ai-budget`)
  讀寫當月(UTC)`ai-budget:YYYY-MM` 累計 neurons;達上限拋 `BudgetExceededError`
  → `http.ts` 分類為 **JSON 429**(訊息去掉內部標記)。
- 計價(官方定價,2026-10-22 核驗):$0.011 / 1,000 neurons →
  **$2 = 181,818 neurons/月**(向下取整)。
- **保守口徑**:所有 neurons 都計入(包含每日免費 10,000 neurons)。
  因此實際賬單恆為 $0:上限 181,818/月 < 免費額度總量(≈300,000/月),到上限即停,
  永遠不會產生付費用量。KV 最終一致性下併發可能輕微超調,可接受。
- 估算:一節報告約 60 neurons(3k input tokens),完整 13 節約 800 neurons →
  $2 ≈ 227 次完整解讀/月,個人用綽綽有餘。

### 動態模型列表(`GET /api/models`)
- `?provider=<name>`:OpenAI 兼容 provider 實時代理 `{baseURL}/models`
  (key 經 `X-AI-Key` 頭傳,不進 URL/日誌/響應;401 → `needsKey:true` + 靜態回落);
  `workers-ai` 返回構建時核驗表(`source: verified-static`,binding 無 list 接口);
  `anthropic`/`custom` 返回靜態表(無標準端點)。
- `GET /api/models`(無參數):provider 元信息(分組/是否需 key/申請地址)。
- SettingsPanel:按 provider 拉取,localStorage 快取 24h(`numerology-models-<provider>`),
  失敗回落靜態表;openrouter 標註免費模型。

### Provider 分組(SettingsPanel,三語)
- 免 key 即用:workers-ai(預設)、pollinations
- 免費(需 key):glm、gemini、groq、openrouter
- 付費:anthropic、custom
- `apps/web/lib/providerMeta.ts`(客戶端安全,不含 SDK)與
  `provider.ts` 的 `listProviders()` 保持同名同序,兩處同步改。

### Cloudflare 配置(已做)
- Pages `numerology`:AI binding(`AI`)+ KV binding(`AI_BUDGET_KV` → `numerology-ai-budget`)
  已加到 production/preview;`AI_PROVIDER=workers-ai`(原 pollinations)。

### 驗證
- 88/88 測試通過(ai 22/engine 36/knowledge 5/web 26;新增 17 項:預算數學與跨月、
  provider 分組、models 路由邏輯、429 分類)。
- `next build` + `npm run cf:pages` 通過;本地 workerd(`wrangler pages dev`)實測:
  `/api/models` 分組正確、`/api/models?provider=workers-ai` 核驗表正確、
  無 binding 時 report 返回明確指引(502)、`/api/chart` 200。
- 待線上驗證(部署後):預設 provider 的真實中文報告流、KV 計數器增長。

### 设置面板 provider 选择器改版(2026-10-23,用户要求)
- **Tabs 取代下拉**:8 个 provider 为横向 tabs,只显示短名(Workers AI/Pollinations/
  GLM/Gemini/Groq/OpenRouter/Claude/自訂),描述不再塞进选项文字。
- **Filter chips**(tabs 上方):全部 / 免 key / 免費 / 付費(三语 `settings.filter.*`)。
  免費 = 免 key ∪ 免费额度(workers-ai、pollinations、glm、gemini、groq、openrouter);
  付費 = anthropic、custom。切 filter 时若当前 provider 被滤掉,自动选中首个可见
  (保持恒有一 tab 选中)。
- **属性面板**(tabs 下方,选中 provider 的结构化展示):API Key(需要/不需要 badge)、
  費用(免費/免費額度/付費 badge)、一行短注(`settings.note.*`):
  workers-ai「經本站 Cloudflare 帳號,每月硬上限 $2,超額自動停用」;
  pollinations「匿名使用會限速、輸出偏短,填 key 更穩」(key 字段对其为选填,后端本就优先用用户 key);
  openrouter「免費 :free 模型仍需 API key」;glm/gemini/groq「免費額度,填 key 即用」;
  anthropic「按量付費」;custom「任意 OpenAI 兼容端點」。
- 动态模型下拉 + 24h 缓存 + 静态回落保持不变;旧的长描述 `settings.prov.*` /
  `settings.group.*` / `settings.budget` keys 已删除(信息移入属性面板)。

## 报告章节标题 locale 化(2026-10-22,小修复)

问题:分段报告的小标题(`## 性格特质`)是硬编码简体,模型逐字照抄 → locale=zht 时
正文繁体、标题简体错位。

- `packages/ai/src/prompts.ts`:新增 `SEGMENT_TITLES`(13 个节 × zht/zhs/en 三地对照)
  + `segmentTitle(key, locale)`(缺失回落简体 → key)。
  `buildReportSectionPrompt` / `buildFortuneSectionPrompt` 新增 `locale` 参数(默认 zht),
  小标题与节名引用均用本地化标题。
  整篇模式同样修:`buildReportUserPrompt` 的章节列表、`buildFortuneReportPrompt` 的
  六个 `##` 标题(含结尾"总体建议"引用)全部走 `segmentTitle`。
- `packages/ai/src/report.ts`:六处调用点全部传入 `opts.locale ?? "zht"`。
- 英文标题为自然英文(如 "Personality Traits"、"1. Current Overview");zht 为香港书面繁体。
- 测试:新增 `packages/ai/test/segment-titles.test.mjs`(5 项:三地标题齐全非空、
  两节 builders 三地标题正确、整篇 builders 三地标题正确);`context.test.mjs`
  更新(zhs 显式传入保持原断言,默认 zht 断言繁体)。105/105 通过。
- `next build` + `npm run cf:pages` 均成功;commit `a9b5c9e` 已推 main,
  Pages 部署 `0dba3f80` 成功。線上驗證:
  `POST /api/report`(locale=zht,section=personality)→ 200,`## 性格特質`;
  (locale=en)→ 200,`## Personality Traits`(英文正文)。

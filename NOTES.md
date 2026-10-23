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

## 分 provider 记 key + 自定义人设 + AI 缓存 + 本机历史(2026-10-23)

用户一次提了四个需求,同一批实现:

### A. 分 provider 记 key(`apps/web/lib/aiSettings.ts`)
- `AiSettings.apiKey: string` → `keys: Record<string, string>`(provider 名 → key)。
- 迁移(`migrateAiSettings`,纯函数可测试):旧版单 `apiKey` 非空且 `keys` 为空 →
  归到当时选中的 provider 名下;保存时丢弃旧字段。
- `currentKey(s)`:只取当前 provider 名下的 key,没填 → `""`,绝不拿别的 provider
  的 key 顶替(之前的需求:"if no key inputted, it should be empty input")。
- `aiRequestParts()`:组装请求体 `{ ai:{provider,apiKey?,model?,baseURL?}, systemPrompt? }`;
  key 取当前 provider 的;为空则省略。StreamedReport/ChatPanel/TimeInferPanel 改用它。
- SettingsPanel 的 key 输入框绑定 `value.keys[value.provider] ?? ""`;切 tab 自动切换显示。
- `/api/models` 的 `X-AI-Key` 头同样取当前 provider 的 key。

### B. 自定义 AI 人设(`customSystemPrompt`)
- SettingsPanel 新增 textarea(「自訂 AI 人設 / 系統提示」)+「重設為預設」按钮;
  存 `AiSettings.systemPrompt`,空 = 默认。三语 keys:`settings.personaLabel/Ph/Reset`。
- `packages/ai/src/provider.ts`:`ProviderOptions.customSystemPrompt?`;
  `applyCustomPrompt()`(已导出供测试)追加为 system **末块**(locale 语言指令之后),
  `chatComplete`/`chatStream` 三分支(anthropic/openai/workers-ai)全部接入。
- `apps/web/lib/aiOpts.ts`:`parseAi` 取请求体**顶层** `systemPrompt` 字段
  (与 `locale` 同级——它是每次请求的用户覆盖项,保持 `ai` 的 BYOK 形状稳定);
  `resolveServerAi` 的存在性检查补上该字段。
- 前端三个 AI 组件每次请求都带上(为空则省略)。

### C. AI 响应服务端缓存(省 $2 预算)
- 复用已绑定的 `AI_BUDGET_KV`,键前缀 `aicache:`(与 `ai-budget:` 区分),**无新增基建**。
- 键 = sha256(JSON{provider,model,locale,lens,section,inputHash,promptHash})
  (`apps/web/lib/aiCache.ts` 的 `aiCacheKey`);`inputHash` = 出生输入规范化哈希
  (排盘是输入的确定性函数);`promptHash` 覆盖自定义人设(改人设 → 键不同,不串味)。
- 接入点:`/api/report` 与 `/api/fortune`(分段 + 整篇两模式)。
  命中 → 直接返回 KV 文本(`X-Cache: HIT`);未命中 → `teeTextStream` 包装累积全文,
  `streamToPrimedResponse` 后打 `X-Cache: MISS`,再经 `waitUntil` 在流**成功完成**
  且正文非空后写入(TTL 90 天)。出错/截断/空一律不写。
- `chat` / `infer-time` 不缓存(对话型,历史相关,命中率极低)。
- `getWaitUntil()` 新增于 `apps/web/lib/aiBinding.ts`(非 CF 环境返回 null → 不写缓存,
  本地开发不受影响)。

### D. 本机历史记录(用户选了「本機儲存」)
- `apps/web/lib/history.ts`:IndexedDB(`numerology`/`readings`) promise 封装,
  **无新增 npm 依赖**;记录 `{id,input,locale,chart,sections}`(section key =
  `report:<k>`/`fortune:<k>`),`upsertReading`(保留旧章节)/`saveSection`/
  `listReadings`/`deleteReading`/`clearReadings`;纯函数(`mergeSectionInto`,
  `summarizeInput`,`readingId`)可测试。
- `page.tsx`:排盘成功后 upsert(保留已有章节);`StreamedReport` 新增
  `onSectionDone(segKey, markdown, lens)`(成功且有正文才回调)与
  `restoredSections`(sectionKey → markdown,按当前语言重拼 `##` 标题)。
- `HistoryPanel`(新组件,放 SettingsPanel 下方):「歷史記錄(n)」开关,
  列表项 `YYYY-MM-DD HH:mm` + 出生摘要(`1990-06-15 14:00 男`) + 章节数;
  点击即恢复命盘 + 已生成章节(**零 API 调用**);单条删除 / 全部清除(confirm);
  附一行私隐说明「記錄只保存在此裝置,不會上傳」。三语 keys:`history.*`。

### 附带
- `apps/web/next.config.mjs`:加 `experimental.extensionAlias {".js":[".ts",".tsx",".js",".jsx"]}`,
  使源码可用 `./x.js` 风格引用 `./x.ts`(与 packages/* 一致;node ESM 与测试亦需显式扩展名)。
  之前 `next build` 曾因此报 `Can't resolve './hash.js'`。
- `apps/web/tsconfig.test.json`:include 补上 `hash.ts`/`aiSettings.ts`/`aiCache.ts`/
  `history.ts`/`aiOpts.ts`(注意:`aiOpts` 的测试未在 node 跑——它经 `aiBinding`
  传递依赖 `@cloudflare/next-on-pages`,plain node import 会炸;其 systemPrompt
  解析走线上实测覆盖)。

### 验证
- `npm test --workspaces`:120/120 通过(ai 34/engine 36/knowledge 5/web 45;
  新增 18 项:迁移×3、currentKey、缓存键×3、tee、prepareCachedStream HIT/MISS、
  历史纯逻辑×4、applyCustomPrompt×2)。
- `next build` ✓ + `npm run cf:pages` ✓。
- commit `70e6cef` 已推 main,待 Pages 部署成功后做线上验证(见下)。

### 线上验证(2026-10-23,部署成功后,全部通过)
- ✅ `POST /api/report`(section=personality,同一输入)连调两次 →
  第一次 `X-Cache: MISS`(26s,2879B),第二次 `X-Cache: HIT`(1.6s,2879B),
  正文逐字节一致。
- ✅ `POST /api/report`(section=career,
  `systemPrompt:"開頭第一句必須是『測試成功』"`)→ `X-Cache: MISS`
  (人设不同 → 键不同,正确),输出以「測試成功」开头(自定义人设生效)。
- ✅ `POST /api/chart` → 200,八字日主辛、紫微 12 宫,不受影响。

### 缓存事故复盘(2026-10-23,已修复)
首次上线后线上实测发现:缓存命中的正文每个字符翻倍
(2858B → 5714B,`## 性格特質` → `## 性格格特特質質`)。
根因:`teeTextStream` 旧实现为 wrapper 上的**每个** text 监听器都在 inner 上
另挂一个累积监听器;而 `streamToPrimedResponse` 恰好挂两个(预热 + 正式),
故第二块起被累积两次。
修复:inner 上只挂一个监听器并扇出到所有 wrapper 监听器,每块恰好累积一次;
缓存键前缀 bump 为 `aicache:2:` 使旧坏缓存整体失效。
回归测试:`teeTextStream:wrapper 上挂两个监听器(预热+正式)也不重复累积`。
教训:tee/装饰器包装流时,累积逻辑必须与监听器数量解耦。

## 大运流年深析质量修复(2026-10-22,用户贴出真实输出)

用户贴出的《大運流年深析》有三个缺陷,已定位并修复:

1. **年月数字缺失**(如 `戊辰運（- 歲/-）`、`年（辛丑年）`):
   根因不在引擎——上下文包里数字本来就是全的(`戊辰(2-11岁/1995-2004)`、
   `2021(28岁)辛丑`),而是 prompt 从未硬性要求模型写出数字,模型就输出了 `-` 占位。
   修复:`prompts.ts` 新增 `FORTUNE_NUMBERS_RULE`(数字铁律·逐字照抄,大小运/流年标题格式
   + ❌ 禁例),接入 `buildFortuneReportPrompt` 与 `buildFortuneSectionPrompt`。

2. **每步大运重复同一个大限**:
   根因是上下文只带了*当前*大限(`f.ziwei.decadal`),模型就把它套到每一步。
   修复:引擎 `analyzeFortune` 现在为每步大运计算**同期大限**
   (`DaYunAnalysis.ziweiDecadal`),取该运中点年份的 `horoscope().decadal`
   (用中点而非起点:首步起点年龄常落在首个大限区间之前,iztro 的 horoscope
   会回绕到末个大限,给出错误结果;中点恒落在某区间内)。
   `context.ts` 把每步的 `└ 大限XX(行YY):禄→.. 权→..` 渲染进动态运势段,
   并把原来的"当前大限"行标注为仅用于总览、不要混用。
   回归测试:`packages/engine/test/fortune-decadal.test.mjs`(5 项:结构完整、
   与命宫大限区间的独立交叉验证、多步不全相同、男女方向、首步不回绕)。

3. **套话重复**(每步/每年同一句式、rhythm 节把前面重讲一遍):
   修复:`fortuneAntiRepetition(key)` 按节定制纪律——dayun 每步 3–4 句只锚定独有信息
   (十神组合/同期大限/刑冲),严禁跨步重复句式;review/future 每年 2–3 句、禁四段式
   填表模板;rhythm 只列转折点清单、禁重播;所有形容词必须带机制(哪个干支/哪颗星→
   哪个宫→什么效果),写不出就删。
   另做了一次通用 prompt 优化: FORTUNE_SEGMENTS 各节 instruction 压缩到 1–3 行,
   去掉模型会镜像的啰嗦表述;直接、敢断的语气保留并加强(机制语言要求)。
   回归测试:`packages/ai/test/fortune-prompt.test.mjs`(7 项 → 8 项)。
   补充对齐外部研究(2026-10-22 晚):`mingli-master` 的 `references/interpretation_guide.md`
   (解讀風格指南:"敢斷、有类比、禁『值得注意的是』式廢話",❌/✅ 例)——
   其与本 brief 一致的部分收为 `FORTUNE_STYLE_RULES`:每步/每年先**一句话定性**、
   术语首次出现用日常类比翻译(每节一两个足矣)、禁用废话开场
   (「值得注意的是」「总体而言」「整体上是XX的」「需要多加注意」);
   与 brief 冲突的(过度迎合语气/置信度条)不采纳。另采纳
   `Johnson-Jia/ziwei-bazi-reading` 的斷語可信度思想为**断语纪律**:绝不编造古籍断语原文,
   想借传统说法必须写"传统有此一说"(传闻口径,非实证),不许伪引"古书云:……"。

4. **报告章节加 emoji(用户要求"replace boring text with emoji/icon")**:
   纯前端确定性方案,不靠模型:`apps/web/lib/sectionIcons.ts`(13 节 key→emoji,
   如 overview🧭/dayun🕰️/review🔍/future🔮/rhythm🌊/action🎯/personality🪞/
   career💼/wealth💰/relationship❤️/health🌿/luck🌠/advice💡,与语言无关),
   `StreamedReport` 在渲染时按 section key 把 `## ` 标题行替换为
   `## <icon> <label>`(AI 自带标题与占位标题统一处理;历史记录存的仍是无图标原文)。
   回归测试:`apps/web/test/section-icons.test.mjs`(6 项:key 齐全、图标互异、
   未知 key 回落 ✦、标题替换/补全、正文不动)。

验证:140/140 测试通过(engine 41/ai 42/knowledge 5/web 52);`next build` +
`npm run cf:pages` 均成功。

### 小标题数字兜底(2026-10-22 深夜,live 实证驱动)
`mistral-small` 即使给了逐行照抄的【小标题清单】仍输出 `### 癸未運（–歲／–年）`
(X-Cache:MISS 的全新生成;且禁例的占位符形状会被模型照抄)——纯 prompt 手段不可靠。
改为服务端确定性后处理:`fixFortuneHeadings()`(`prompts.ts`,纯函数)+
`HeadingFixStream`(`report.ts`,行缓冲 TextStream 包装,作用于
`streamFortuneSection`/`streamFortuneReport`;`generateFortuneReport` 对全文应用),
凡匹配 `### 干支運（` / `### YYYY年（` 形状的行一律替换为引擎计算的标准成品行。
prompt 侧保留清单(移至 prompt 末尾)并删除了会起反作用的占位符形状禁例。
live 验证:7 个 `###` 标题全部带真实数字,全文零占位符。
另:`HeadingFixStream` 在缓存 tee 之前生效,故 KV 存的也是修复后文本。
回归测试:`fortune-prompt.test.mjs` 新增 `fixFortuneHeadings` 3 项
(占位修复/已对行不动/zhs-en)。
最终验证:176/176(ai 50/engine 52/knowledge 15/web 59),`next build` +
`cf:pages` 成功,部署 `b6c57ac2`(commit `f7f9dc2`)live。
残留(model 上限非 bug):正文仍略显公式化(mistral-small 偶尔丢大限干支、
偏爱"引动了用神,命局得到补益"句式);数字/标题已兜底,正文质量即模型上限,
换更强默认模型可再提升——仅标记,不行动。另:模型曾照抄示例 verdict/类比,
已加"类比自己造,不要照抄"规则。

## 易經學院 Phase 1(2026-10-23,用戶已批 build 順序)

用戶決策:「兩樣都要,分階段做」— Phase 1 = 占卦工具 + 64卦庫;Phase 2 = 課程體系。

### 數據層(`packages/knowledge`)
- `src/yijing.data.ts`(生成文件,2712 行):64 卦 × {文王卦序、卦名/拼音/英文、
  卦符䷀、上下卦、五行(按上卦)、陰陽、卦辭、6 爻辭、大象辭、六爻陰陽 bits、
  三地現代解讀(核心/事業/感情/財運/健康/建議)}。
  來源(文件頭已標註):卦辭/爻辭/大象辭 ← crane1102/iching-llm (MIT,公版通行本);
  拼音/英文 ← FENGTING2025/iching-64-hexagrams-json (MIT);
  上下卦/現代解讀 ← HeTaobaba123/iching-64-hexagrams-dataset (CC0-1.0)。
- `scripts/gen-yijing-data.py`:重現生成的轉換器。正字化用 OpenCC
  STCharacters 首選映射(/tmp/STCharacters.txt,Apache-2.0),並人工核對歧義字:
  干父→幹父 / 噬干→噬乾(乾肉) / 于干(水涯)保留 / 咸(卦名)保留 / 斗(北斗)保留 /
  里(百里)保留;繁體解讀另修 關係→關係。`reviewed: false`(經文公版可信,
  現代解讀為 CC0 種子文本,學院白話解讀日後以本站自寫為準)。
- `src/yijing.ts`:型別 + `allHexagrams/getHexagram/searchHexagrams`(拼音去聲調搜尋)、
  `yaoName`(初九/六二/九五/上六規則)、`TRIGRAM_INFO`(八卦符號/拼音/英文/卦性/五行)、
  `YIJING_GLOSSARY`(19 術語三地短釋義,供點按釋義)。
- 回歸測試:`test/yijing.test.mjs`(10 項:64 卦齊全/每卦 6 爻辭/卦符區段/
  bits 與卦象一致/爻位命名/三地解讀非空/搜尋/八卦資訊/術語表/META 授權標註)。

### 引擎層(`packages/engine/src/yijing.ts`,純函數零依賴)
- `tossCoins(rng?)`:三錢 ×6,6 老陰 / 7 少陽 / 8 少陰 / 9 老陽。
- `castYijing(lines)`:本卦 + 動爻 + 變卦(動爻翻轉) + 互卦(2-3-4/3-4-5 爻) +
  錯卦(全反) + 綜卦(顛倒);`divine()` 一次完成。
- TRIGRAM/GUAMAP 移植自 iching-llm `iching_coin.py`(MIT),字形統一繁體。
- 回歸測試:`test/yijing.test.mjs`(11 項:乾/坤/屯定位、動爻變卦姤#44、
  屯之互剝#23/錯鼎#50/綜蒙#4、非法輸入、1000 次擲錢分佈、確定性 rng)。

### Web 層(`apps/web`)
- `/yijing` 占卦:選填問題(純前端不上傳)、逐爻擲或全部自動、CSS 錢幣翻轉動畫、
  爻形(老陽⚊○/少陽⚊/少陰⚋/老陰⚋×)、本卦/變卦/互卦 + 動爻爻辭高亮、
  **零 AI 調用**(保護 $2 Workers AI 預算;AI 解卦列為 Phase 2)。
- `/yijing/gua` 卦庫:搜尋 + 64 卦網格,詳情含卦辭/六爻爻辭(爻位名)/大象/
  六 tab 現代解讀(三地)。
- `/poster` 水墨命盤海報:讀 IndexedDB 最新命盤,無記錄則空狀態引導;
  CSS 紙紋 + 直書 accent + 朱砂印,480px 截圖優化。當前大運用虛歲近似匹配
  `bazi.daYun` 區間(ChartResult 無 fortune 欄位)。
- `components/YijingNav.tsx`(頂部瘦導航,sticky)+`components/Gloss.tsx`
  (術語點按釋義)+`lib/yijingStrings.ts`(新 UI 文案三地字典,未動 i18n.ts)。
- SEO:`app/sitemap.ts`(edge runtime;/,/yijing,/yijing/gua,/poster)、
  `public/robots.txt`、`public/llms.txt`。
- 回歸測試:`test/yijing.test.mjs`(7 項:字典三地一致性/yjT/yjFmt/sitemap 形狀)。

### 驗證
- 168/168 測試通過(knowledge 15 / engine 52 / ai 42 / web 59)。
- `next build` ✓;`npm run cf:pages` ✓(輸出含 yijing.html、yijing/gua.html、
  poster.html、robots.txt、llms.txt;中途清掉殘留 .vercel/output 的 EEXIST、
  sitemap 加 edge runtime)。
- 線上驗證(2026-10-23,部署 `aaab1840` 成功):/yijing → 200(標題「易經占卦 · 三錢起卦」,
  bundle 含 老陽/動爻 等占卦 UI 字串);/yijing/gua → 200(標題「六十四卦 · 卦辭爻辭全覽」,
  卦庫數據 chunk 含 潛龍勿用 等爻辭);/poster → 200(標題「命盤海報 · 水墨命盤」);
  /sitemap.xml 列出 4 路由;/robots.txt + /llms.txt 正常。
  註:擲錢 6 次的完整點擊流程未在真瀏覽器走過(引擎 castYijing 已單測覆蓋;
  同 history 點擊恢復一樣,值得手機上親手點一次)。
- 與 fortune 質量修復 worker 的分工:本 job 只新增文件,唯一改動是
  layout.tsx 加 YijingNav(一行 import + 一行 JSX,已確認當時為 16 行版本);
  prompts.ts/context.ts/StreamedReport/page.tsx/i18n.ts 均未碰。

### 後續(Phase 2 / 待辦)
- AI 解卦(接 Workers AI,注意預算)、六爻納甲裝卦(kentang2017/ichingshifa MIT 作算法規格)、
  課程體系(陰陽五行八卦 → 64卦精講 → 問卦解卦實戰;白話解讀自寫)、
  海報當前大運改精確起運歲數、GSC 提交新路由。

## 易經學院 Phase 2(2026-10-23,用戶批 "you can add phase 2")

### 1. 課程體系(/yijing/academy,新路由)
- `app/yijing/academy/lessons.ts`:四課原創白話(zht)——①陰陽五行八卦基礎
  (陰陽四特性/五行生剋/八卦卦象卦性)、②如何讀懂一卦(上下卦/卦辭/爻辭爻位/
  大象,乾坤實例,鏈入 /yijing/gua)、③點問卦(一事一占/問題具體/不義不占/
  不瀆卦,三錢法步驟)、④點解卦(本變互錯綜權重/朱熹動爻斷法/乾之姤實例
  walkthrough)。古典經文引文為公有領域,未引用現代注本;zhs/en 暫回落 zht。
- 每課 4–5 題單選自我檢測(`Quiz.tsx`,client-side),localStorage
  `yijing-academy-progress` 記分;首頁進度條 + 完成 ✓。
- 頁面:`academy/page.tsx`(課程首頁)、`academy/[lesson]/page.tsx`(服務端外殼 +
  generateStaticParams) + `LessonView.tsx`(客戶端正文)。
- 術語高亮:正文暫為純文本,待 `@/lib/highlightTerms` 合併到 main 後接入
  (已留 TODO)。

### 2. 六爻納甲(/yijing/liuyao,新路由 + 引擎)
- `packages/engine/src/liuyao.ts`(純函數零依賴):`paigua(lines,日干,日支,月支)`
  → 納甲干支(納甲歌內外卦表)、京房八宮定宮/世應/卦型(八純/一世..五世/
  遊魂/歸魂,程序化推導)、六親(宮為我)、六獸(六獸歌)、旬空、月破/日破;
  `ganzhiForDate` 複用 bazi 節氣曆(中午起盤避子時邊界)。
  表格按古典規則手寫,未引用 ichingshifa 的不透明 data.pkl。
- `yijing.ts` 新增導出 `trigramOfBits` 供 liuyao 用。
- 回歸測試 `test/liuyao.test.mjs`(10 項):64 卦唯一歸宮、乾/坤手算例
  (納甲六親六獸世應旬空月破日破全對)、姤一世/晉遊魂/大有歸魂世應、
  qinOf 乾宮古典標準、六獸歌、旬空、立春前後月建切換(2024-02-03 丑/02-05 寅)。
  註:開發中曾把六親生剋方向寫反,被乾宮標準表抓出並修正(qinOf:爻生我→父母,
  我生爻→子孫,爻剋我→官鬼,我剋爻→妻財)。
- 頁面:`/yijing/liuyao`——日期選擇(預設今日,取日辰月建)、搖錢或手動六爻、
  排盤表(世應/六獸/干支六親/爻形動靜/旬空月破日破標記,傳統由上而下)。

### 3. AI 解卦(POST /api/yijing/interpret,新路由)
- 強制 `provider: "workers-ai"` + `aiBinding`,與報告路由共用同一 $2/月 KV
  預算守衛:超支 → `BudgetExceededError` → 乾淨 JSON 429(實測路徑不斷流)。
- KV 緩存(`aicache:2:` 前綴):鍵 = {hexagram,lines,locale} + prompt 版本
  (`yijing-interpret/v1`);命中零消耗。maxTokens 900(≤400字解讀)。
- prompt:本卦卦辭 + 動爻爻辭 + 變卦卦辭(引擎重算,不信任客戶端 hexagram);
  **不接收用戶問題原文**(問題只存前端,不上傳)。
- 前端:`app/yijing/AiInterpret.tsx`(按鈕 + 流式顯示 + 429 友好報錯),
  接入占卦頁結果區,取代舊的 `yijing.aiSoon` 文案。

### 驗證
- engine 62/62、ai 57/57、knowledge 22/22 通過(含 liuyao 10 項新測試);
  web 測試因同倉另一 worker 重構中途徑樹損壞未能跑全量(其 `lib/fortuneRepair.ts`
  等引用了尚未提交的模組),已確認損壞文件皆非本 job 產物。
- commit `bf5fe1ee`(17 文件)推 main,Pages 部署 `2e4ecc51` → **success**。
- 線上驗證:`/yijing/academy`、`/yijing/academy/basics`、
  `/yijing/academy/interpreting`、`/yijing/liuyao` 皆 200 且內容正確;
  `/sitemap.xml` 列出 6 路由(含新增兩條);
  `POST /api/yijing/interpret`(乾初九動) → 200,繁體短解讀,X-Cache: MISS,
  預算守衛路徑正常(未觸發 429,屬預期)。
- 導航:`YijingNav` SUB_LINKS 加六爻納甲(grid 圖標)/易經學院(bulb 圖標)。

### 備註/後續
- 另一 worker 曾把本 job 的 `academy/`、`liuyao/` 目錄移至
  `/tmp/shelved-numerology-academy/`(06:00 前後),已原樣取回並繼續;
  parent 宜確認其意圖,避免再發生。
- 學院正文術語高亮待 `@/lib/highlightTerms` 落 main 後接入(一行 TODO)。
- GSC 提交新路由(/yijing/academy、/yijing/liuyao)仍待辦。

## Fortune 標題確定性修復 v2 + 術語釋義系統 (2026-10-23, commit 2127b6b7)

### A. `- 歲` 標題形狀無關修復 + 紫微大限:無
- 模型改寫新形狀 `- 歲（-）：己巳運`,舊 `^###` 正則抓不到。
  `fixFortuneHeadings` 重寫為有狀態 `makeFortuneLineFixer`:
  干支+運錨定(行首 md 前綴後 / 短行行尾 / 佔位符行內),佔位符痕跡判定,
  正文順帶提及干支運的行不誤傷。
- 流年: `年（辛丑年）` / `年 丙午（歲）` 等無年份形狀 → `YYYY年（干支，N歲）`。
- 紫微大限:同一遍修復 `紫微大限：無/没有/未提供` 或干支錯配 →
  `紫微大限：<干支>（行<宮>）`(按步同期大限;總覽節用當前大限)。
- `context.ts`: 同期大限移到大運條目同一行【同期大限…】(模型忽略 └ 子行)。
- 前端: 新增 `/api/fortune/data`(無 AI 調用,返回 analyzeFortune JSON);
  `lib/fortuneRepair.ts` 客戶端鏡像修復;`StreamedReport` 新增 `repairText` prop,
  渲染時修復(含 KV/歷史舊文本)。
- 測試: ai 7 項 v2 形狀 + web 4 項客戶端修復。

### B. 術語釋義 tap-to-define (everywhere)
- `packages/knowledge/src/mingli-glossary.ts`: 66 術語
  (十神×10、十二宮、十四主星、四化、大運/流年/大限/命宮/身宮/
  三方四正/空宮/借星…),zht/zhs/en 一行釋義,自撰定義。
- `apps/web/lib/highlightTerms.tsx`: 共享工具
  (allGlossary 合併 YIJING_GLOSSARY、findTermMatches 單遍預編譯正則、
  Term 點擊釋義彈窗 [outside-click + Escape 關閉,跳過 code/pre/a/
  button/input/textarea/select]、withTermHighlights、markdownTermComponents)。
- 接入面: 命盤報告 + 大運流年深析 (StreamedReport) + 命盤對話 (ChatPanel)
  + /yijing 占卦結果 + /yijing/gua 卦庫。
- 測試: 術語高亮、markdown 結構完整、無嵌套高亮。

### C. 導航審計
- 6 路由(/、/poster、/yijing、/yijing/gua、/yijing/academy、/yijing/liuyao)
  全部可達(TabBar + YijingNav + SideNav),無孤兒頁面。

### 驗證
- ai 57/57、knowledge 22/22、engine 62/62、web 83/83 全過;
  `next build` + `npm run cf:pages` 均成功。
- commit `2127b6b7`(18 文件)推 main,Pages 部署 `326b3669` → **success**。
- 線上驗證: 6 路由皆 200;`POST /api/fortune/data` → 200,回傳確定性 fortune JSON;
  術語(正官等)已在 live bundle 內。

## Academy 術語高亮接入 (2026-10-23)
- `apps/web/lib/highlightTerms.tsx` (共享工具,已在 main: `withTermHighlights` /
  `markdownTermComponents` / `Term`,彈窗點別處/Escape 關閉)接入易經學院:
  `academy/page.tsx` 課程簡介、`[lesson]/LessonView.tsx` 課文段落(移除 TODO)、
  `Quiz.tsx` 題目 + 解析。選項在 `<button>` 內,按設計跳過。
- 驗證: ai 57/engine 62/knowledge 22/web 83 全過;`next build` + `npm run cf:pages` 成功。

## Popup 定位統一 + 標題去重 + Scrollspy + Academy 路線圖 (2026-10-23, commit d9634e61)

用戶三個跟進一次做完:

1. **@floating-ui/react 全應用彈窗標準**(POPUP POSITIONING RULE, standing):
   新增 `apps/web/lib/floatPopup.tsx` — `useFloatPopup(anchorRef)` +
   `FloatingCard`,全應用唯一的浮動定位:`useFloating({ strategy:"fixed",
   middleware:[offset(8), flip({padding:8}), shift({padding:8})],
   whileElementsMounted:autoUpdate })`。flip + shift 保證彈窗永不超出
   viewport(360px 窄屏亦然);fixed 策略逃出 overflow 容器。
   Dismissal 沿用 standing rule:anchor 外 pointerdown / Escape 即關。
   - `Term`(highlightTerms.tsx)改用:觸發器只留虛線底線,**不再改文字顏色**
     (用戶要求 underline-only);彈窗改 `FloatingCard`。
   - `components/Gloss.tsx` 遷移:三處用法
     (yijing/tool.tsx、gua/library.tsx、liuyao/tool.tsx)的 `<Gloss>` 全換成
     共享 `<Term>`(合併術語表已含易經術語且優先),`Gloss.tsx` 已刪除。
   - 掃蕩:其餘無浮動 popup(SettingsPanel/HistoryPanel 係展開區塊,
     LocationPicker 用原生 select)——無手寫定位殘留。
   - 依賴:`@floating-ui/react@0.27.20`(npm workspace 慣例);
     bundle 影響小:@floating-ui/dom core gzip ~7.8KB,整包 tree-shaken 約十幾 KB。

2. **去重連續小標題**(`lib/fortuneRepair.ts`):
   `dedupeHeadings` 在修復後跑:相鄰(僅隔空行)且 identity 相同的標題行只留第一個。
   identity 規範化(去 md 標記/空白/全半形差異):大運→`D:干支:起始年`,
   流年→`Y:年份:干支`;只有標題樣式行(## / ** / 短行規範形)才參與,
   正文中的同年提及永不動。純標題行整行丟棄;加粗 lead-in 帶正文則去標題留正文。
   測試 6 項:`test/fortune-repair.test.mjs`(重複合併/lead-in 留正文/全半形差異/
   正文提及不動/不同年份不動/不相鄰不動)。

3. **Scrollspy**(`components/StreamedReport.tsx`):
   單一 IntersectionObserver(`rootMargin:"-15% 0px -75% 0px"`)監聽各節 article,
   進入視口頂部帶即切 strip 高亮;點擊跳轉後 900ms 內不搶(平滑滾動不閃);
   串流中 article 元素不變,照常生效。點擊仍 smooth-scroll(原有 jump 保留)。

4. **Academy 路線圖**(`app/yijing/academy/page.tsx`):
   四課改學習路線圖:左側垂直時間線 + 節點(完成✓朱砂實心/當前雙圈高光/
   待學淡色),已完成段線段朱砂填充;卡片間 1.6rem 呼吸空間;頂部進度條保留。

驗證:全 workspace 測試通過(232/232,0 fail);`next build` + `npm run cf:pages`
成功;push d9634e61(+ Gloss.tsx 刪除 fb9cfc0f);Pages 部署待確認(見下)。

## Academy 內容 fact-check + 出處 (2026-10-23)
- 對 4 課全部事實斷言逐條核驗:古典引文對維基文庫公有領域原文(親自抓取核實,ctext.org
  API 需認證、網站反爬蟲故改用維基文庫,報告中如實說明);卦爻辭字形對本站
  `yijing.data.ts` 公版通行本;朱熹動爻斷法對《易學啟蒙》占法原文規則。
- 結果:約 40 項斷言——✅ 38(包括:「一陰一陽之謂道」繫辭上第五章、太極兩儀四象八卦
  繫辭上第十一章、八卦符號/卦名、大衍之數繫辭上第九章、參伍錯綜繫辭上第十章、
  八卦成列繫辭下、乾坤爻辭/大象、姤卦辭「女壯勿用取女」、上乾下坤為否、
  三錢法 6/7/8/9、朱熹六條動爻斷法全對、乾初九動變姤、17 題測驗答案全對);
  ⚠️ 2(「一事一占」標註朱熹《易學啟蒙》一路、「七成/兩成/一成」權重標註為本站
  初學建議非古法);❌ 1(坤六二「不習无不利」→「不習無不利」,與本站公版通行本
  `yijing.data.ts` 字形統一;兩版皆為合法異體,此處取一致性)。
- 每課新增 `sources`(已核實 URL,絕無編造):
  basics→繫辭上×2+繫辭下;reading-gua→乾+坤;asking→繫辭上×2(大衍之數/問焉以言);
  interpreting→乾+姤+繫辭上(錯綜)。
- `LessonView.tsx` 新增「延伸出處」卡片(課文後、測驗後),新開頁籤。
- 驗證:232/232 測試通過;`next build` + `npm run cf:pages` 成功。

## 核心理念 manifesto(2026-10-23,Hector 口述願景落站)

- 首頁(`apps/web/app/page.tsx` home 屏)新增 `.creed` 區塊:4 beats(零門檻/有證據/越學越深/0→1),
  深色 Apple-minimal 卡片 + accent 金色 01–04 編號;文案走 `apps/web/lib/i18n.ts` 三地
  (`creed.title`/`creed.b1`–`b4`,zht/zhs/en)。
- Hector 原話 companion line(`creed.evidence`,三地):"內容多由 AI 措辭串連,但全部有證據、
  有出處撐住。No hallucination,no bullshit,直話直說。"——首頁以 accent 左框線
  `.creed-signoff` 置於 manifesto 之下;三份 README 願景節亦以引文形式收錄。
- README.md / README.zh-Hans.md / README.en.md 頂部各加 ~4 行願景(對應語言)。
- **ROADMAP(計劃中,未動工)**:keyword → expandable AI long-form Q&A —
  點擊術語除了釋義 popup,加「深入問 AI」選項,展開針對該術語的長文 AI 解讀
  (走現有 chat/report 管線,計入 $2 budget;需設計避免與現有 Term popup 衝突)。

## 驗證(2026-10-23)
- 測試全過;`next build` + `npm run cf:pages` 成功;部署成功後首頁可見 manifesto。

## 易經 Phase 3:梅花易數 + 占例庫(2026-10-23)

### 梅花易數(/yijing/meihua,新路由)
- 引擎 `packages/engine/src/meihua.ts`(純函數零依賴):`timeNumbers()`
  (農曆經 lunar-javascript;時支經 bazi 節氣曆)、`castMeihua(y,m,d,h)` →
  {四數、上/下卦、動爻、文王卦序本卦/變卦/互卦、體用、verdict}。
  方法:年支數(子1…亥12)/農曆月/農曆日/時支數;上=(y+m+d)%8、
  下=(y+m+d+h)%8(餘0取8)、動=(y+m+d+h)%6(餘0取6);先天數乾1…坤8;
  動爻所在卦為用。斷:用生體大吉/比和中吉/體剋用小吉/體生用小凶/
  用剋體大凶——確定性,零 AI。
- **手算核驗**(寫入測試註釋):2025-01-01 12:00 → 農曆2024-12-02,
  年5(辰)月12日2時7(午),上離下兌=睽#38,動2爻,用兌(金)/體離(火),
  體剋用→小吉,變噬嗑#21,互既濟#63;2024-12-25 21:00 → 姤#44動5,
  用剋體→大凶,變鼎#50,互乾#1。另覆蓋餘0→8/6、閏月取本月、子時邊界、
  非法輸入拋錯、五種生剋全覆蓋。測試 8/8。
- 頁面:datetime-local(預設此刻)+一鍵起卦;四數、上/下卦卡(卦符/卦名/五行/
  體用 badge)、體用斷卡、HexFigure 本/變/互卦、卦辭(術語高亮)、AI 解卦
  複用 `/api/yijing/interpret`(lines 映射:動爻→9/6,其餘 7/8)。
- 出處:《梅花易數·象數易理篇》「年月日之數為上卦,年月日加時之數為下卦…」
  +《體用生克篇》「無動爻者為體,有動爻者為用」——QuoteRef 點按彈窗
  (全文+維基文庫鏈接,已逐字核實)。
- 方法歧義處理:古本體用斷法涉衰旺/黨多深文;引擎採用通行現代五級體用
  五行生剋總斷,確定性、可文檔化,已在文件頭註明。

### 占例庫(/yijing/cases,新路由)——與並行 worker 合流
- 本任務做到一半發現另一 worker 正在同時寫占例庫(其 `cases/page.tsx`
  覆蓋了我先寫的版本、`cases.ts` 被刪)。按 standing rule 不覆蓋其工作:
  **採用其實現**,只做最小修復(其頁面重複渲染 `<YijingNav/>`,
  layout 已有全局 YijingNav,會出現雙導航——刪其頁內一處)。
- 其實現(`packages/knowledge/src/zhanli.ts`,340 行):六例皆《左傳》真實占例,
  陳敬仲占(莊22,觀之否)、秦伯韓之戰占(僖15,蠱)、晉獻公筮嫁伯姬(僖15,
  歸妹之睽)、穆姜占(襄9,艮之隨)、崔武子占(襄25,困之大過,本任務未核實,
  取其文件頭核實記錄)、南蒯占(昭12,坤之比)。其占辭原文與本任務親自抓取的
  維基文庫文本逐字一致(陳敬仲/韓之戰/伯姬/穆姜/南蒯五例已交叉核對)。
- 其收錄標準比本任務更嚴:必須有「遇某之某」筮卦記錄;驪姬之卜筮(卜筮並用、
  未載卦名)被其以書面理由捨棄——合理,從其標準。動爻政策亦更嚴:
  原文未明言一律「史料未載」,僅南蒯例外(所引「黃裳元吉」即坤六五爻辭,
  且坤變比僅六五一位不同)。本任務原先以爻位差推導動爻的做法作廢,
  從其「不推測」政策。
- 其頁面:列表→詳情(原文/本站白話解說/歷史應驗+verdict badge),
  白話解說內嵌 QuoteRef 引文(與 academy 同源),術語高亮已接。
  文案 key 為其自有體系(cases.original/baihua/history/method/ben/bian),
  與本任務先加的 keys 並存於 yijingStrings.ts(無衝突)。

### 導航/SEO
- `YijingNav` SUB_LINKS 加梅花易數(hourglass)+占例庫(history,既有圖標);
  `yijingSite.ts` SITE_ROUTES 加 `/yijing/meihua` + `/yijing/cases`(0.8)。

### 推送合併(應用 STALE-SCRATCH + NEVER-CLOBBER standing lessons)
- 推送前對遠端 main 做全樹 diff(200 遠端文件 vs 本地):16 個差異文件。
  其中 9 個屬本任務線(引擎 meihua+index/d.ts、meihua 頁、quoteRef 組件+
  highlightTerms/tsconfig 引用、academy 引文接入 lessons/LessonView、
  導航/文案/sitemap),+2 個並行 worker 的占例庫文件(zhanli.ts、
  cases/page.tsx 含本任務雙導航修復),其餘 7 個(首頁 manifesto 的 i18n
  creed/globals creed/page.tsx Charts、README 三份)屬其他 worker——
  **未推送、未覆蓋**。
- quoteRef.tsx 為新組件:academy 的 lessons.ts/LessonView.tsx 引文接入依賴它,
  同一 commit 推送保證功能完整;`scripts/make-brand-icons.sh` 在遠端有、本地無,
  未納入推送(不刪除他人文件)。
- 推送前重查遠端 head,若有 sibling 新 push 則重 diff 本推送集文件,
  有衝突改走新分支合併(未發生,一次推成)。

### 驗證
- 282/282 測試通過(ai 60/engine 70/knowledge 28/pronounce 7/web 117;
  web 含新增 quote-ref 測試)。
- `next build` + `npm run cf:pages` 成功(中途一次失敗係並行 worker 寫文件中途
  被構建掃到,重跑即過);commit 推 main;Pages 部署 → success。
- 線上驗證:`/yijing/meihua` 200(以 2025-01-01 12:00 起卦核對四數/卦名/體用斷);
  `/yijing/cases` 200(六例列表+詳情+原文+應驗);`/sitemap.xml` 含新路由。

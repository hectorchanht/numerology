# Numerology 硬化重建 — 说明

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

# 命理 · Numerology

**[繁體中文](README.md) | [简体中文](README.zh-Hans.md) | [English](README.en.md)**

> 🔗 **在线体验（免安装，默认免费模型）：** https://numerology-7v4.pages.dev/
> 排盘即时出；AI 解读默认走免费的 Cloudflare Workers AI（每月 $2 预算上限，用完即停），也可在「设置」里选其他 provider、填自己的 API key 换更强模型。

AI 辅助的中国命理工具：**八字四柱 + 紫微斗数**。帮助人们了解自己的性格倾向与人生格局，定位为**传统文化 + 自我反思工具**，而非宿命论预测。

改写自 [Crazycreate/Numerology](https://github.com/Crazycreate/Numerology)（MIT），在其基础上修复多个服务层 bug、重构错误处理，并持续加入新功能。

## 核心理念

学易经、学命理的人，缺的往往不是兴趣，而是知识和判断力。这个站的目标：

- **零门槛** — 输入生辰即有结果，不需要任何前置知识；
- **有证据** — 古籍引文句句可稽考，不 hallucinate、不 bullshit；
- **越学越深** — 每个关键词都可点击释义，学院带你由浅入深；
- **0 → 1** — 带你从 beginner 一步一步走到 master。

> 内容多由 AI 措辞串连，但全部有证据、有出处撑住。No hallucination，no bullshit，直话直说。

## 核心设计原则

> **排盘要「算」，解读才「用 AI」。**

- **排盘（起盘）是确定性计算**：公历/农历→干支、节气定月、真太阳时校正、安星、四化、十神、大运起运。有唯一正确答案，绝不交给 LLM。
- **AI 只做解读层**：把结构化命盘 + 命中的规则，合成个性化、可溯源的叙事与对话。

## 功能

- 🧮 **双盘排盘**：八字四柱（十神/藏干/星运/自坐/空亡/神煞/纳音）+ 紫微斗数（十二宫全要素、四化、四套十二神、大限小限、三方四正）
- 🌙 **历法**：公历 / 农历（含闰月）输入；出生地省→市二级联动做**真太阳时校正**
- 🔮 **动静结合解读**：大运流年十神 + 引动喜用神、紫微大限/流年四化飞宫，运为主导
- 📜 **三份 AI 产出**：命盘格局解读、大运流年深析（回看 + 前瞻）、就命盘对话追问；均流式输出
- 🕰️ **时辰推断**：不知出生时辰时，AI 据已知人生事实比对当日 12 时辰命盘反推
- 🪙 **易经占卦**：三枚铜钱起卦，自动排出本卦 / 变卦 / 互卦
- 🖼️ **命盘海报**：一键生成可分享的命盘图
- 🗂️ **历史记录**：读过的命盘存在本机（IndexedDB），一点即还原，不用重新跑 AI，记录不离开本机
- ⚡ **AI 缓存**：相同命盘 + 相同章节直接命中服务器缓存（90 天），省预算、秒出结果
- 📄 **导出 PDF**
- 🌐 **三语界面**：繁體中文（默认）/ 简体中文 / English，一键切换

## 在线版本

- **网址**：https://numerology-7v4.pages.dev/（Cloudflare Pages，GitHub 自动部署）
- **AI 默认**：Cloudflare Workers AI（`@cf/mistralai/mistral-small-3.1-24b-instruct`），免 key
- **预算上限**：每月 $2 硬上限（KV 计量，超额返回 429），$0 成本运营
- **无付费墙**：全部功能免费

## 快速开始

### 前置要求

- Node.js **≥ 18.17**（Pages 上用 Node 20）

### 安装与运行

```bash
# 1. 克隆
git clone https://github.com/hectorchanht/numerology.git
cd numerology

# 2. 安装依赖（npm workspaces 单仓）
npm install

# 3. 构建核心包（排盘 + 知识库 + AI 层）
npm run build -w @numerology/knowledge -w @numerology/engine -w @numerology/ai

# 4. 启动 Web
npm run dev -w @numerology/web
# 打开 http://localhost:3000
```

本地开发默认 provider 为 Pollinations（免 key）；在线版本默认 Workers AI。

### 部署到 Cloudflare Pages

```bash
npm install && npm run cf:pages
```

API 路由已转为 edge runtime；Workers AI 需要绑定 `AI` binding，预算计量需要 KV namespace（`numerology-ai-budget`）。

### 配置 AI provider

排盘不花钱、不需要 key；只有 **AI 解读 / 对话**走 provider。在 `.env` 用 `AI_PROVIDER` 选一家，或在网页「设置」里用分页切换：

| provider | 费用 | 需要 key | 说明 |
|----------|------|---------|------|
| `workers-ai`（默认） | **免费** | **否** | Cloudflare Workers AI，每月 $2 预算上限；默认模型写繁体最稳 |
| `pollinations` | **免费** | 否 | 免 key 开箱即用；匿名层会限速、输出偏短 |
| `glm` | 免费额度 | 是 | 智谱 GLM，中文强：[open.bigmodel.cn](https://open.bigmodel.cn/) |
| `gemini` | 免费额度 | 是 | [aistudio.google.com](https://aistudio.google.com/apikey) |
| `groq` | 免费 | 是 | 极快：[console.groq.com](https://console.groq.com/keys) |
| `openrouter` | 免费（`:free` 模型） | 是 | 模型多：[openrouter.ai](https://openrouter.ai/keys) |
| `anthropic` | 付费 | 是 | 中文质量最高：[console.anthropic.com](https://console.anthropic.com/) |
| `custom` | 看端点 | 看情况 | 任意 OpenAI 兼容服务：`AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL_REPORT`/`AI_MODEL_CHAT` |

- 每个 provider 的 key 独立记住，不会串；没填就是空输入。
- 模型列表动态拉取（`/api/models`，24 小时缓存 + 静态回落）。
- 「设置」里可以自定义 meta prompt（系统提示词），一键还原默认。

### 测试

```bash
npm test            # 全部 workspace 测试
```

## 项目结构

```
packages/
  knowledge/   @numerology/knowledge  结构化规则：调候用神 / 格局 / 十神 / 四化
  engine/      @numerology/engine     纯 TS：出生信息 → 排双盘 → 标准命盘 JSON（无 UI / 无网络）
  ai/          @numerology/ai         命盘 JSON + 规则 → 上下文包 → AI provider（报告 / 对话 / 时辰推断）
apps/
  web/         @numerology/web        Next.js 前端（Cloudflare Pages 部署）
```

`engine` 与 `knowledge` 与平台无关。

## 技术栈

- **语言/构建**：TypeScript（strict）、npm workspaces
- **排盘库**（成熟开源，不自研）：[`iztro`](https://github.com/SylarLong/iztro)（紫微）、[`lunar-javascript`](https://github.com/6tail/lunar-javascript)（八字/历法）
- **AI**：多 provider 可切换；除 Claude 外统一走 OpenAI 兼容协议
- **前端**：Next.js 14 + React 18，edge runtime
- **部署**：Cloudflare Pages + Workers AI + KV（预算计量与缓存）

## 知识库来源

古籍原文属公有领域（穷通宝鉴 / 滴天髓 / 三命通会 / 紫微斗数全书）。
**蒸馏成结构化规则**，而非原文堆叠做 RAG。详见 [`docs/knowledge-base.md`](docs/knowledge-base.md)。

## 免责声明

本工具仅供**传统文化学习与自我反思**之用。所有解读均为基于命理的**倾向性参考，非宿命预测**，不构成医疗、法律、投资等任何专业建议，决策请以自身判断为准。

## License

MIT

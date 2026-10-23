# Numerology · 命理

**[繁體中文](README.md) | [简体中文](README.zh-Hans.md) | [English](README.en.md)**

> 🔗 **Live demo (no install, free model by default):** https://numerology-7v4.pages.dev/
> Charts cast instantly; AI interpretation defaults to free Cloudflare Workers AI (hard $2/month budget cap — it stops when the budget is spent). You can also pick another provider in Settings and paste your own API key for a stronger model.

An AI-assisted Chinese metaphysics tool combining **BaZi (Four Pillars of Destiny)** and **Zi Wei Dou Shu (Purple Star Astrology)**. It helps people understand their personality tendencies and life patterns — positioned as a **cultural & self-reflection tool, not fortune-telling determinism**.

A hardened fork of [Crazycreate/Numerology](https://github.com/Crazycreate/Numerology) (MIT): service-layer bugs fixed, error handling rebuilt, and new features added continuously.

## Manifesto

People drawn to the I Ching and Chinese metaphysics usually lack knowledge and judgment, not interest. This site's goal:

- **Zero barrier** — enter your birth data and get a reading. No prior knowledge needed.
- **Evidence-backed** — every classical quote is traceable. No hallucination, no bullshit.
- **Deeper as you learn** — tap any term for its meaning; the academy takes you further.
- **0 → 1** — from beginner to master, step by step.

> Although most of the content is phrased and concatenated by AI, we are evidence / reference backed up. Not hallucination, no bullshit. Straight to the point.

## Core Design Principle

> **Chart casting is computed; only interpretation uses AI.**

- **Chart casting is deterministic computation**: solar/lunar → ganzhi, solar-term month boundaries, true solar time correction, star placement, the Four Transformations (sihua), the Ten Gods (shishen), luck-cycle onset. There is exactly one correct answer — never handed to an LLM.
- **AI only does the interpretation layer**: it synthesizes the structured chart + matched rules into a personalized, traceable narrative and dialogue.

## Features

- 🧮 **Dual chart casting**: BaZi Four Pillars (Ten Gods / hidden stems / twelve life-stages / void / shensha / nayin) + Zi Wei Dou Shu (full 12-palace detail, sihua, four sets of twelve-spirits, decadal/annual ranges, the "three-directions-four-corners" pattern)
- 🌙 **Calendar**: solar / lunar (incl. leap month) input; birthplace province→city picker for **true solar time correction**
- 🔮 **Static + dynamic interpretation**: luck-cycle & annual Ten Gods + favorable-god activation, Zi Wei decadal/annual sihua flying into natal palaces — luck cycles weighted as dominant
- 📜 **Three AI outputs**: chart-pattern reading, deep luck-cycle/annual analysis (retrospective + forward-looking), and chart-based follow-up chat — all streamed
- 🕰️ **Birth-hour inference**: when the hour is unknown, the AI narrows it down by comparing the day's 12 possible charts against your known life facts
- 🪙 **Yijing divination**: three-coin toss casting, auto-deriving primary / changing / mutual hexagrams
- 🖼️ **Chart poster**: one-tap shareable chart image
- 🗂️ **History**: past readings stored on-device (IndexedDB) — tap to restore instantly with zero AI calls; records never leave the device
- ⚡ **AI cache**: identical chart + section hits the server cache (90 days), saving budget and returning in seconds
- 📄 **PDF export**
- 🌐 **Trilingual UI**: Traditional Chinese (default) / Simplified Chinese / English, one-tap switch

## Live Version

- **URL**: https://numerology-7v4.pages.dev/ (Cloudflare Pages, auto-deploys from GitHub)
- **Default AI**: Cloudflare Workers AI (`@cf/mistralai/mistral-small-3.1-24b-instruct`), no key needed
- **Budget cap**: hard $2/month limit (metered via KV, returns 429 when exceeded) — $0 operating cost
- **No paywall**: everything is free

## Quick Start

### Prerequisites

- Node.js **≥ 18.17** (Node 20 on Pages)

### Install & Run

```bash
# 1. Clone
git clone https://github.com/hectorchanht/numerology.git
cd numerology

# 2. Install (npm workspaces monorepo)
npm install

# 3. Build core packages (chart engine + knowledge base + AI layer)
npm run build -w @numerology/knowledge -w @numerology/engine -w @numerology/ai

# 4. Start the web app
npm run dev -w @numerology/web
# Open http://localhost:3000
```

Local dev defaults to the Pollinations provider (no key); the live version defaults to Workers AI.

### Deploy to Cloudflare Pages

```bash
npm install && npm run cf:pages
```

API routes run on the edge runtime; Workers AI needs the `AI` binding, and budget metering needs a KV namespace (`numerology-ai-budget`).

### Configuring AI Providers

Chart casting costs nothing and needs no key; only **AI interpretation / chat** uses a provider. Pick one via the `AI_PROVIDER` env var, or switch in the web app's Settings tabs:

| provider | cost | needs key | notes |
|----------|------|-----------|-------|
| `workers-ai` (default) | **free** | **no** | Cloudflare Workers AI, $2/month budget cap; default model writes Traditional Chinese most reliably |
| `pollinations` | **free** | no | keyless out of the box; anonymous tier is rate-limited with shorter output |
| `glm` | free tier | yes | Zhipu GLM, strong Chinese: [open.bigmodel.cn](https://open.bigmodel.cn/) |
| `gemini` | free tier | yes | [aistudio.google.com](https://aistudio.google.com/apikey) |
| `groq` | free | yes | extremely fast: [console.groq.com](https://console.groq.com/keys) |
| `openrouter` | free (`:free` models) | yes | many models: [openrouter.ai](https://openrouter.ai/keys) |
| `anthropic` | paid | yes | best Chinese quality: [console.anthropic.com](https://console.anthropic.com/) |
| `custom` | depends | depends | any OpenAI-compatible endpoint: `AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL_REPORT`/`AI_MODEL_CHAT` |

- Each provider's key is remembered independently — no cross-provider leakage; empty if you never entered one.
- The model list is fetched dynamically (`/api/models`, 24h cache + static fallback).
- Settings lets you customize the meta (system) prompt, with one-tap reset to default.

### Tests

```bash
npm test            # all workspace tests
```

## Project Structure

```
packages/
  knowledge/   @numerology/knowledge  structured rules: favorable gods / chart patterns / Ten Gods / sihua
  engine/      @numerology/engine     pure TS: birth info → dual charts → standard chart JSON (no UI / no network)
  ai/          @numerology/ai         chart JSON + rules → context pack → AI provider (reports / chat / hour inference)
apps/
  web/         @numerology/web        Next.js frontend (deployed on Cloudflare Pages)
```

`engine` and `knowledge` are platform-independent.

## Tech Stack

- **Language/build**: TypeScript (strict), npm workspaces
- **Chart libraries** (mature open source, not reinvented): [`iztro`](https://github.com/SylarLong/iztro) (Zi Wei), [`lunar-javascript`](https://github.com/6tail/lunar-javascript) (BaZi/calendar)
- **AI**: switchable multi-provider; all but Claude go through the OpenAI-compatible protocol
- **Frontend**: Next.js 14 + React 18, edge runtime
- **Deploy**: Cloudflare Pages + Workers AI + KV (budget metering and cache)

## Knowledge Base Sources

Classical texts are in the public domain (Qiong Tong Bao Jian / Di Tian Sui / San Ming Tong Hui / Zi Wei Dou Shu Quan Shu).
**Distilled into structured rules**, not piled up as RAG text. See [`docs/knowledge-base.md`](docs/knowledge-base.md).

## Disclaimer

This tool is for **traditional-culture study and self-reflection only**. All interpretations are **tendency-level references based on metaphysics, not deterministic predictions**, and do not constitute medical, legal, investment, or any other professional advice. Use your own judgment for decisions.

## License

MIT

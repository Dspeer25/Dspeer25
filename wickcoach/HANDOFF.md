# WickCoach — Full Context Handoff

**Written:** 2026-08-13 · **Branch:** `rules-rebuild-js-scoring` · **HEAD:** `f1d0619`

Read this first if you're picking up WickCoach cold. It covers what the product is, how the
code is organized, the rules that are non-negotiable, and the traps that have bitten previous
sessions. Everything here was verified against the codebase on the date above — where something
is unverified or inferred, it says so.

---

## 1. What WickCoach is

An **AI trading journal that coaches trader psychology**. It is not a charting tool, not a
signal service, and it never gives entry/exit advice. The premise: a trader logs trades *and
writes journal entries about their mindset*, and the AI cross-references what they wrote
against what actually happened — coaching behavior, not numbers.

The AI voice is modeled on **Mark Douglas** (*Trading in the Zone*): calm, wise, precise,
veteran-trader energy. Focus on beliefs, risk acceptance, and the independence of each trade.
It references the trader's own words back to them.

**All data lives in the browser's localStorage.** There is no backend database. Supabase is
installed (`@supabase/supabase-js` in `package.json`) but is planned, not wired. The marketing
copy leans on this: "Your trades stay yours. All data stored locally in your browser."

### The two products

This repo builds **two separate products** from one codebase, switched by a build-time env var:

| | Full WickCoach | Position Calc Pro ("lite") |
|---|---|---|
| Env var | `NEXT_PUBLIC_PRODUCT` unset or `full` | `NEXT_PUBLIC_PRODUCT=lite` |
| Homepage | Marketing splash + carousel | None — boots straight into the app |
| Tabs | Log a Trade, Past Trades, Weekly Goals, Analysis, Tools | Position Size Calc (top-level), Log a Trade, Past Trades + **locked** Weekly Goals/Analysis/Tools |
| AI | Full coach | **Zero** Anthropic calls |
| Gate | None | Gumroad license gate (`LicenseLockScreen`) |
| Demo seed | Seeds demo trades on first run | Never seeds |

The flag lives in `app/components/shared.ts`:

```ts
export function isLite(): boolean {
  return process.env.NEXT_PUBLIC_PRODUCT === 'lite';
}
```

`NEXT_PUBLIC_*` is inlined at build time, so `isLite()` resolves to a constant in each build —
dead code is eliminated. Locked tabs are **visible but never mount their component**
(`isTabLocked()`), and that non-mounting is what keeps lite at zero Anthropic calls: a mounted
`AnalysisHub` would fire its classification effect.

**Placeholders still to fill before lite can actually sell:** `GUMROAD_PRODUCT_ID`,
`PURCHASE_URL`, and `UPGRADE_URL` in `shared.ts` are all marked `REPLACE_WITH_*` or point at
`wickcoach.com` / a generic gumroad slug.

---

## 2. Where things stand right now

Branch `rules-rebuild-js-scoring`, pushed and clean. The last two work sessions did this:

**Session A — working-tree cleanup** (recovered from a stash the prior session had parked):

| Commit | What |
|---|---|
| `d00f09b` | Untracked `tsconfig.tsbuildinfo`, added to `.gitignore` |
| `1fe26cf` | **Retired the Behavioral Radar.** Removed its UI and all deterministic axis compute; replaced with an expectancy-first Analysis view. `shared.ts` dropped `computeBehavioralRadar` + axis/timeframe machinery and gained `computeExpectancyR` / `computeLossGrowth`. −1518 lines. |
| `0356b89` | **Day Context** in the Position Size Calculator |
| `db942ee` | Log a Trade: persisted default position type, Instrument select, dropped the weekly-goals reminder strip |
| `aebc738` | Journal folder hover icons moved to bottom-right and shrunk |
| `d5b6640` | Weekly Goals collapsed action items 14px → 17px |
| `8aa7d50` | Coach API surfaces real Anthropic errors instead of masking them |
| `ab5afca` | `.claude/settings.local.json` allowlist churn |

**Session B — Futures mode:**

| Commit | What |
|---|---|
| `2614ac2` | **FUTURES as a third Position Size Calculator mode** — 42 contract specs, tick math, custom contracts, direction-aware R ladder, max-contracts band |
| `f1d0619` | Add-feature reset control became an icon-only teal `RotateCcw` |

### Untracked files sitting in the repo (left alone deliberately)

- `dev-server.log` — build artifact, not gitignored
- `.aidesigner/` — AIDesigner scratch
- `../lifesaver/` — unrelated project inside the repo root
- `../ersspeerDspeer25wickcoach` — **looks like an accidental artifact** from a mangled Windows
  path (`...ers\speer\Dspeer25\wickcoach`). Ask before deleting.

---

## 3. Repo geometry (this trips people up)

**The git repo root is `C:\Users\speer\Dspeer25` — one level ABOVE the Next.js project.**

```
C:\Users\speer\Dspeer25\          ← git root; has its own CLAUDE.md
├── CLAUDE.md                     ← user-wide Windows/terminal rules
├── lifesaver/                    ← unrelated, untracked
└── wickcoach/                    ← the Next.js app; has its own CLAUDE.md
    ├── CLAUDE.md                 ← project rules & design system
    ├── app/
    ├── scripts/
    └── package.json
```

Consequences:
- Tracked paths look like `wickcoach/app/components/shared.ts`.
- `git diff -- app/components/foo.tsx` run from the `wickcoach/` dir works (pathspecs are
  cwd-relative), but `git stash show` output shows the `wickcoach/`-prefixed form. Don't paste
  one into the other.
- `git status` shows sibling projects as untracked `../` entries. That's expected, not a bug.

---

## 4. Hard rules (from CLAUDE.md — these override defaults)

### Code
- **Inline styles ONLY.** No Tailwind, no CSS modules, no external stylesheets. Tailwind is in
  `devDependencies` but is not used for app styling.
- All green is `#00d4a0` (imported as `teal`). All red is `#ff4444`.
- **No emojis** in code, UI, or AI output.
- **Math is deterministic JS.** The AI only *explains* pre-computed results — it never
  generates statistics.
- **No hardcoded numbers on data-driven pages.** Every stat computes from the real trades array.
- `shared.ts` is the backbone: compute functions, context builders, formatters.

### Animation
- Never start animations from a `useEffect` with an empty `[]`. Always gate behind an explicit
  prop, with the prop name specified.

### File repair
- When a component is **broken**: DELETE the file completely, then CREATE from scratch. Never
  patch incrementally. (Note: this applies to *broken* components. Ordinary feature edits to a
  working component are normal edits.)

### Git (Windows/PowerShell)
- **NEVER `git pull`.** Use `git fetch` + `git reset --hard origin/<branch>`.
- **No `&&` chaining** — PowerShell 5.1 doesn't support it. One command per line.
- Stage specific files by path. Never `git add -A`.
- Detailed commit messages, co-authored with Claude.
- Create a named branch before major changes.

Standard terminal delivery template the user expects:

```
cd C:\Users\speer\Dspeer25\wickcoach
git fetch origin rules-rebuild-js-scoring
git reset --hard origin/rules-rebuild-js-scoring
npm run dev
```

### AIDesigner
- Load AIDesigner HTML as an iframe FIRST to verify it looks right.
- Only convert to React AFTER visual confirmation.
- Conversion is a **mechanical line-by-line translation** — never interpret or simplify, never
  change colors/spacing/gradients/positioning. The HTML is the source of truth.

---

## 5. Design system

### Colors
```
Background primary   #0A0D14
Background secondary #141822
Card background      #13141a / #141620
Border               #1a1b22
Accent teal          #00d4a0   ← `teal` from shared.ts
Red (losses/errors)  #ff4444
Text primary         #e0e0e0
Text secondary       #7a7d85
Text muted           #555
```

### Typography — IMPORTANT DISCREPANCY

`CLAUDE.md` documents Chakra Petch (display, `fd`) + DM Mono (mono, `fm`). **The code no longer
does that.** `shared.ts` lines 1–9 now define both `fd` and `fm` as the Apple system stack:

```ts
const appleStack = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
export const fm = appleStack;
export const fd = appleStack;
```

The comment says: if a spot genuinely needs monospace digit alignment, use
`"'SF Mono', ui-monospace, monospace"` inline rather than reaching for `fm`. The Google Fonts
`@import` for DM Mono / Chakra Petch is still in `page.tsx` but the constants no longer point at
them. **The code is the source of truth here; CLAUDE.md's typography section is stale.** Don't
"fix" `shared.ts` back to Chakra Petch without asking.

### Text hierarchy (apply consistently)
1. Page title 24px display w600 · 2. Section title 16px w500 · 3. Card title 14px w500
4. Subtitle 12px `#7a7d85` · 5. Axis ticks 11px `#555` · 6. Data labels 11px w500 (teal/red)
7. Legend 11px `#7a7d85` · 8. Stat label 11px `#7a7d85` · 9. Stat value 14px w500 teal
10. Interpretation boxes 12px `#ccc`, dark bg, left teal border

`PositionSizeContent.tsx` deviates deliberately — it defines a per-page lighter label color
`LABEL = '#a0a3ab'` because `#7a7d85` was too dim for small uppercase labels against its
card surface. That's documented in a comment at the top of the file.

---

## 6. Architecture

### The two-layer rule
- **Homepage carousel = marketing mocks.** Never connected to real data.
- **Real tabs = the functional product.**
- These layers are **completely separate**. Mock data never touches real tabs.

### File map (`app/`)

**Entry / chrome**
| File | Role |
|---|---|
| `page.tsx` | The whole frontend shell — tabs, routing, trade state, profile state, demo seeding, lite license gate, marketing homepage. Large. |
| `layout.tsx` | Next root layout |
| `components/NavBar.tsx` | Tab bar; handles lite locked-tab rendering + upgrade CTA |
| `components/SplashScreen.tsx` | Full-build splash (skipped in lite) |
| `components/Logo.tsx`, `TickerLogos.tsx`, `StockChartBackground.tsx` | Branding / decorative |

**Real product tabs**
| File | Role |
|---|---|
| `components/LogATradeContent.tsx` | The logging form. Default position type, instrument, strategy picker, journal, screenshot. |
| `components/PastTradesContent.tsx` | Trade table, equity curve, time-window filter, per-trade coach |
| `components/TradingGoalsContent.tsx` | Weekly goals, action items, goal chat, quant targets |
| `components/AnalysisHub.tsx` | The Analysis tab — expectancy-first view (post-radar-retirement), weekly summary, regressions |
| `components/ToolsContent.tsx` | Tools hub + `ToolPageShell` (the shared tool page wrapper) |
| `components/PositionSizeContent.tsx` | Position Size Calculator — **the most recently and heavily worked file** |
| `components/GrowthSimulatorContent.tsx` | A tool (not read in detail this session) |
| `components/OverallJournalContent.tsx` | Journal with folders + passcode lock |
| `components/WatchingContent.tsx` | Watchlist (not read in detail) |
| `components/StrategyPicker.tsx` | Inline strategy pick/add control |
| `components/AIChatWidget.tsx` | Chat widget (not read in detail) |

**Marketing mocks** — `CarouselAnalysis`, `CarouselLogTrade`, `CarouselNav`,
`CarouselPastTrades`, `CarouselTraderProfile`, `CarouselTradingGoals`, `Hero`, `FAQ`.
These are *previews*. Never wire them to real data.

**Lite**
| File | Role |
|---|---|
| `components/LicenseLockScreen.tsx` | Full-screen Gumroad gate |
| `api/license/verify/route.ts` | Server-side license verification |

**API**
| File | Role |
|---|---|
| `api/coach/route.ts` | The single Anthropic endpoint. All coach modes route through it. |

**Tests** — `scripts/*.mjs`, run with plain `node`:
- `test-futures-math.mjs` — parses the real `FUTURES_CONTRACTS` table out of `shared.ts` source
  text and asserts every spec + all tick math. **A typo in any tick value fails this test.**
- `test-kpi-metrics.mjs`, `test-score-number-goal.mjs` — mirror their functions inline
- `test-behavioral-radar.mjs` — **stale**, tests the retired radar. Candidate for deletion.

---

## 7. `shared.ts` — the backbone

~2,180 lines. Roughly in order:

- **Fonts / theme** — `fm`, `fd`, `teal`
- **Product variant** — `isLite()`, `isTabLocked()`, `UPGRADE_URL`, `GUMROAD_PRODUCT_ID`,
  `PURCHASE_URL`
- **Regression engine** — `RegressionResult`, `REGRESSION_VARIABLE_ALIASES`,
  `resolveTradeVariable`, `resolveTradeFilter`, `linearRegression`
- **Dates** — `parseLocalDate`, `toLocalYMD`
- **Position types & strategies** — `PositionType` (`SHARES|OPTIONS|FUTURES`),
  `STRATEGY_DEFAULTS`, `readCustomStrategies` / `write` / `add` / `remove` /
  `readAllCustomStrategies` / `removeCustomStrategyEverywhere`
- **Futures** (added `2614ac2`) — `FuturesContract`, `FuturesGroup`, `FUTURES_GROUP_ORDER`,
  `FUTURES_CONTRACTS` (42 specs), custom-contract CRUD, and the math block (see §9)
- **Trade** interface + formatters — `formatDollar`, `formatNumber`, `formatRR`, `parseRr`
- **Analytics** — `TraderAnalytics`, `computeExpectancy`, `computeProfitFactor`, `computeAvgR`,
  `computeExpectancyR` (min 5 trades), `computeLossGrowth` (min 4), `computeAnalytics`,
  `buildTraderStats`, `timeToMinutes`
- **Quant targets** — `QuantitativeTarget`, `DEFAULT_QUANT_TARGETS`, `readQuantTargets`,
  `getQuantTargetsForWeek`, `updateQuantTarget`, add/remove custom
- **Context builders** — `buildGoalsContext`, `buildProfileContext`, `buildDateContext`
- **Classification** — `CLASSIFY_PROMPT_VERSION`, `TradeClassification`, read/write cache

### The `Trade` shape

```ts
export interface Trade {
  id: string;
  ticker: string;
  companyName: string;
  date: string;          // "YYYY-MM-DD" local. ALWAYS via toLocalYMD/parseLocalDate.
  time: string;          // entry, "H:MM AM/PM" or "HH:MM"
  exitTime?: string;     // optional — older/imported trades lack it
  strategy: string;
  positionType?: PositionType;  // optional — legacy trades inferred
  direction: 'LONG' | 'SHORT';
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  pl: number;
  plPercent: number;
  riskAmount: number;
  riskReward: string;
  journal: string;
  screenshot?: string;
  aiScore?: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
}
```

**Date trap, called out explicitly in the source:** never use `new Date(t.date)` or
`new Date().toISOString()` on the `date` field. Both introduce UTC drift that shifts trades
across day boundaries. Use `parseLocalDate()` / `toLocalYMD()`.

**Legacy inference:** a trade with no `positionType` is treated as `SHARES` when
`strategy === 'Shares'`, otherwise `OPTIONS` — matching the historical SHARES/DERIVATIVES split.

---

## 8. localStorage key registry

Everything persists here. Keys verified by grep:

**Core data**
- `wickcoach_trades` — the trades array · `wickcoach_trades_version`
- `wickcoach_seeded` — demo-seed guard (lite never seeds)
- `wickcoach_trader_profile` · `wickcoach_goals` · `wickcoach_journal`
- `wickcoach_strategies` · `wickcoach_custom_strategies_{shares|options|futures}`
- `wickcoach_trade_classifications` · `wickcoach_regressions` · `wickcoach_week_summaries`
- `wickcoach_quant_targets_history`

**Position Size Calculator**
- `wickcoach_position_size_account` · `wickcoach_position_size_risk_pct`
- `wickcoach_psc_default_mode` — shares|options|futures
- `wickcoach_psc_day_pl` — `{value, date}`, **date-stamped and discarded if not today**
- `wickcoach_psc_futures_symbol` — last-used contract
- `wickcoach_custom_futures` — trader's own contract specs

**Log a Trade**
- `wickcoach_default_position_type`

**Past Trades UI state**
- `wickcoach_pasttrades_eq_range` · `wickcoach_equity_curve_mode` ·
  `wickcoach_pasttrades_chart_view`

**Journal lock**
- `wickcoach_journal_passcode_hash` · `_passcode_enabled` · `wickcoach_journal_unlocked` ·
  `wickcoach_journal_last_left`

**Goals migrations** — `wickcoach_goal_both_to_journal_v*`, `wickcoach_goal_kind_rebuild_v*`,
`wickcoach_seeded_last_week_v*`

**Other** — `wickcoach_watching`, `pcp_license` (lite gate)

### The hydration pattern (follow it)

Every persisted surface uses the same race-avoidance shape, and deviating from it causes
first-render defaults to overwrite real saved data:

```ts
const [hydrated, setHydrated] = useState(false);

useEffect(() => {                 // read once on mount
  try { /* read localStorage, setState */ } catch { /* ignore */ }
  setHydrated(true);
}, []);

useEffect(() => {                 // save effects GATED on hydrated
  if (!hydrated) return;
  try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
}, [value, hydrated]);
```

For values that must be correct on the *very first* render (no flash of the wrong state), use a
lazy `useState` initializer instead — e.g. the calculator's default mode and Log a Trade's
default position type both do `useState(() => readDefaultMode() ?? 'shares')`.

Every `localStorage` access is wrapped in try/catch with `typeof window === 'undefined'` guards
where it can run during SSR.

---

## 9. Position Size Calculator (deepest recent work)

`app/components/PositionSizeContent.tsx`. Three modes: **Shares | Options | Futures**.

### Shared math
```
maxRisk      = accountSize × riskPct/100
priceRisk    = signed distance entry→stop (SHORT flips the sign in futures)
riskPerTrade = effSize × perUnitLoss
badStop      = priceRisk <= 0   (futures: !isStopSideValid(direction, entry, stop))
overBudget   = !badStop && riskPerTrade > maxRisk
```

| Mode | `perUnitLoss` | "cost" slot |
|---|---|---|
| Shares | `priceRisk × 1` | Position cost |
| Options | `priceRisk × 100` | Position cost |
| Futures | `|entry−stop| / tickSize × tickValue` | **Notional value** (`size × entry × pointValue`) |

**There is no ×100 anywhere on the futures path.** Futures post margin rather than paying a
cost, which is why the third slot reports notional exposure instead.

### Averaging ("Add")
Mode-independent. Each add is a leg `{contracts, price}`; the running position is
`Σ(contracts×price) / Σcontracts`. `effEntry`/`effSize` then feed **all** downstream math, so
risk / cost / R-ladder behave identically whether or not the trader averaged in. Adds are
per-trade scratch — not persisted. The reset control is an icon-only teal `RotateCcw`
(`f1d0619`), labelled only via `title` / `aria-label`.

### Day Context (`0356b89`)
Optional "Today's P/L so far". Folds intraday P/L into three projections: day total if stopped,
at 1.5R, at 2R. Persisted as `{value, date}` and **discarded on mount if the stored date isn't
today** — a prior day's loss can never silently carry into today's math. Derives from the live
`riskPerTrade`, so it reflects Add legs.

### Futures mode (`2614ac2`)
- **42 contract specs** across Equity Index / Energy / Metals / Treasuries / Ags / FX / Crypto,
  micros under their parents. `pointValue` **always** equals `tickValue / tickSize`; the test
  harness asserts that identity on every row.
- **Custom contracts**: trader gives name + tick size + tick value; `pointValue` is *derived,
  never entered*, so a custom spec can't disagree with itself. Persisted to
  `wickcoach_custom_futures` and re-derived on read.
- **Tick precision**: sizes span `5` (BTC) down to `0.0000005` (6J). `tickDecimals()` derives
  precision from the tick's *exponential* form (plain `toString()` shows float noise on tiny
  ticks), and every displayed price is re-rounded to it — otherwise you get
  `4900.750000000001` in the UI.
- **Direction**: LONG needs stop below entry, SHORT above. Inverted takes the existing red
  alarm card with a direction-specific message.
- **R targets** run up from entry on LONG, down on SHORT, always snapped to a valid tick.
- **Off-tick prices** are snapped *for display only* with a quiet note, and used as entered in
  the math — never an error, since a pasted fill price isn't the trader's fault.
- **"Max contracts at this stop"** gets its own full-width band and says so plainly at zero.

Key exports in `shared.ts`: `tickDecimals`, `roundToTick`, `isOnTick`, `formatTickPrice`,
`futuresRiskPerContract`, `futuresTickDistance`, `futuresMaxContracts`, `isStopSideValid`,
`futuresRTarget`.

> **Note:** switching to Futures leaves the shares-era defaults (250 @ 50, stop 48) in place,
> which reads as a wildly over-budget position until the trader edits the inputs. That's
> deliberate — the red styling and the max-contracts band both correctly flag it — but it's the
> first thing a new user sees, so it may be worth revisiting.

---

## 10. The AI coach

**One endpoint:** `app/api/coach/route.ts`. Raw `fetch()` to
`https://api.anthropic.com/v1/messages` — **not** the Anthropic SDK. Key from
`ANTHROPIC_API_KEY` in `.env.local` (that's the only key in the file).

### Modes and models

| Mode | Purpose |
|---|---|
| `trades` (default) | Per-trade / general coaching |
| `goals` | Goal chat; reply ends with a hidden JSON completeness block that gets stripped |
| `analysis` | Analysis tab commentary |
| `deepPsych` | Deep psychology read |
| `actionItems` | Generates action items |
| `classify` | Deterministic trade classification |
| `regression` | Regression narration |
| `weeklySummary` | Tight 4–6 bullet weekly read |

```ts
const useHaiku = mode === 'classify' || mode === 'regression' || mode === 'weeklySummary';
const model    = useHaiku ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6';
const maxTokens = useHaiku ? 4000 : 500;
```

Haiku is used for cheap classification and the short weekly read; every other mode keeps the
voice-capable Sonnet.

### Prompt rules baked into the route
- Anti-markdown directive in all prompts. Only `**bold**`, dash bullets, markdown tables, and a
  triple-backtick chart block are allowed — no headings, no pound signs, no numbered lists, no
  italics, no stray backticks. The chat UI parses all of it.
- `goals` mode **overrides** that: plain conversational sentences only, because the reply must
  end with a clean JSON block that markdown would break.
- No entry/exit advice, no market predictions, no price targets, no emojis, never
  motivational-poster.
- All bots share unified context: trades + goals + profile + quantitative targets, assembled by
  the `build*Context` functions in `shared.ts`.

### Error surfacing (`8aa7d50`)
Before this fix, a failed call fell through `data.content?.[0]?.text` to the literal string
`"Unable to process."` — so a bad key, a wrong model ID, a rate limit, and an exhausted credit
balance all produced the same dead end with nothing logged. Now `response.ok` is checked first:
the status and full error payload go to the server console, and the real message comes back as
`API error <status>: <message>`.

### ⚠️ Model IDs are behind — and upgrading has a real trap

Verified against current Anthropic model docs:

- `claude-haiku-4-5-20251001` — **valid and current.** Haiku 4.5 is the current Haiku.
- `claude-sonnet-4-6` — **still active, but no longer current.** The current Sonnet is
  `claude-sonnet-5` (near-Opus quality on coding/agentic work). Current flagship overall is
  `claude-opus-5`.

**Do not do a bare model-string swap to `claude-sonnet-5`.** On Sonnet 5, omitting the
`thinking` parameter runs **adaptive thinking by default** (Sonnet 4.6 ran thinking-off), and
`max_tokens` is a hard cap on **thinking + response text together**. This route sets
`maxTokens = 500` for every Sonnet mode. Post-swap, thinking would eat that budget and coach
replies would truncate mid-sentence.

If/when you migrate, either:
- pass `thinking: { type: 'disabled' }` to preserve current behavior, **or**
- raise `max_tokens` substantially and accept the thinking spend.

Also note Sonnet 5 uses a new tokenizer (~30% more tokens for the same text), so cost baselines
shift even though per-token pricing is unchanged. Non-default `temperature`/`top_p`/`top_k`
would 400 — this route sets none, so that's clean.

Secondary, lower priority: the project is TypeScript with `@anthropic-ai/sdk` *not* installed;
the route hand-rolls HTTP. Moving to the official SDK would get typed errors and retries for
free, but it's a refactor, not a fix.

---

## 11. Build, test, verify

```
npm run dev     next dev
npm run build   next build      (Turbopack, Next 16.2.1)
npm run start   next start
npm run lint    eslint          ← BROKEN, see below
```

### Both builds must pass

Every commit is verified against **both** product builds:

```powershell
cd C:\Users\speer\Dspeer25\wickcoach
$env:NEXT_PUBLIC_PRODUCT = $null; npm run build
$env:NEXT_PUBLIC_PRODUCT = 'lite'; npm run build
$env:NEXT_PUBLIC_PRODUCT = $null
```

A build takes **~10 seconds**, so there's no excuse for skipping it. `isLite()` gates whole
components out, so a change can compile in one variant and break the other.

**Per-commit isolation:** when splitting a dirty tree into several commits, verify each commit
*standalone* by stashing the other files by pathspec:

```
git stash push -m tmp -- <other paths>
# build both variants, commit
git stash pop
```

### `npm run lint` is broken repo-wide
ESLint 9 requires an `eslint.config.js` and the repo has none (it still has the flat-config-era
`eslint-config-next` dependency but no config file). Pre-existing, unrelated to any recent work.
`next build` runs its own checks, so nothing is unguarded — but `npm run lint` will always exit
non-zero. Worth fixing.

### Other checks
```
npx tsc --noEmit                  # typecheck
node scripts/test-futures-math.mjs
node scripts/test-kpi-metrics.mjs
node scripts/test-score-number-goal.mjs
```

---

## 12. Traps that have actually bitten previous sessions

1. **PowerShell 5.1 mangles multi-line commit messages.** A `git commit -m @'...'@` here-string
   containing double quotes gets word-split on its way to `git.exe`; git sees dozens of bogus
   pathspecs and the commit silently fails. **Write the message to a file and use
   `git commit -F <path>`.** This ate a commit in a recent session.
2. **`stash@{0}` needs quoting in PowerShell.** Bare `git stash show stash@{0}` errors with
   "Too many revisions specified". Quote it: `"stash@{0}"`.
3. **Pathspecs vs repo root** — see §3. `git diff -- wickcoach/app/...` from inside `wickcoach/`
   silently returns nothing because it resolves to `wickcoach/wickcoach/app/...`.
4. **Work may be parked in a stash, not lost.** A previous session committed part of its plan,
   stashed the rest to verify a build in isolation, and stopped. `git status` looked clean and
   the work appeared to have vanished. **Always check `git stash list` and `git reflog` before
   concluding something is missing.**
5. **`tsconfig.tsbuildinfo`** used to dirty the tree on every build. Now untracked + gitignored.
6. **Float precision in futures.** Naive `Math.round(price/tick)*tick` leaks noise like
   `4900.750000000001`. Always route display through `roundToTick`/`formatTickPrice`.
7. **Date handling.** `new Date(t.date)` on a `YYYY-MM-DD` string parses as UTC and can shift
   the trade a day. Use `parseLocalDate`.
8. **Hydration races.** Save effects that aren't gated on `hydrated` will overwrite real saved
   data with first-render defaults.

---

## 13. Open items / candidates for next work

Nothing is blocked; these are the loose ends visible from the current state:

- **Lite launch blockers** — `GUMROAD_PRODUCT_ID`, `PURCHASE_URL`, `UPGRADE_URL` are all
  placeholders.
- **Coach model upgrade** — `claude-sonnet-4-6` → `claude-sonnet-5`, but read the `max_tokens`
  trap in §10 first.
- **`npm run lint` is dead** — needs an `eslint.config.js`.
- **`scripts/test-behavioral-radar.mjs` is stale** — tests machinery deleted in `1fe26cf`.
- **CLAUDE.md typography section is stale** — says Chakra Petch / DM Mono; code uses the Apple
  system stack. Either update the doc or revert the code, but they currently disagree.
- **`dev-server.log`** dirties the tree on every dev run; not gitignored.
- **Stray `../ersspeerDspeer25wickcoach`** in the repo root — likely an accident; ask before
  removing.
- **Futures defaults on mode switch** — see the note at the end of §9.
- **Supabase** is installed but unwired; persistence is entirely localStorage.

---

## 14. Quick orientation checklist for a fresh session

```
cd C:\Users\speer\Dspeer25\wickcoach
git log --oneline -10
git status
git stash list          # ← don't skip this one
```

Then read, in order: `wickcoach/CLAUDE.md` → `app/components/shared.ts` (top 60 lines for the
variant flag and fonts) → whichever component the task touches. `page.tsx` is the shell;
`shared.ts` is the brain.

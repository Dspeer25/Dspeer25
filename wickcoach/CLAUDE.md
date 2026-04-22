# WickCoach — Project Rules & Design System

## Stack
- Next.js 14, TypeScript, React
- Single page.tsx file for entire frontend
- Inline styles ONLY — no Tailwind, no CSS modules, no external stylesheets
- localStorage for persistence (Supabase planned)
- Claude API for AI coaching (/api/coach/route.ts)

## Design Tokens

### Colors
- Background primary: #0A0D14
- Background secondary: #141822
- Card background: #13141a / #141620
- Border: #1a1b22
- Accent teal: #00d4a0 (imported as `teal` from shared.ts)
- Red (losses/errors): #ff4444
- Text primary: #e0e0e0
- Text secondary: #7a7d85
- Text muted: #555

### Typography
- Display font: Chakra Petch (headings, titles, section headers)
- Body/mono font: DM Mono (all data, labels, stats, UI text)
- `fd` = Chakra Petch (display), `fm` = DM Mono (mono) — imported from shared.ts

### Text Hierarchy (apply consistently across all pages)
1. Page title: 24px Chakra Petch, weight 600
2. Section title: 16px Chakra Petch, weight 500
3. Chart/card title: 14px Chakra Petch, weight 500
4. Subtitle/description: 12px DM Mono, color #7a7d85
5. Axis tick labels: 11px DM Mono, color #555
6. Data value labels: 11px DM Mono, weight 500, colored (teal positive, red negative)
7. Legend items: 11px DM Mono, color #7a7d85
8. Stat card labels: 11px DM Mono, color #7a7d85
9. Stat card values: 14px DM Mono, weight 500, teal
10. Interpretation/insight boxes: 12px DM Mono, color #ccc, dark bg with left teal border

## Coding Rules
- Inline styles only. Never Tailwind, CSS modules, or external stylesheets
- All green is #00d4a0 (teal). All red is #ff4444
- No emojis in code, UI, or AI output
- Math is deterministic JS. AI only explains pre-computed results — never generates statistics
- No hardcoded numbers on data-driven pages. Every stat computes from real trades array
- shared.ts is the backbone: computeAnalytics(), linearRegression(), context builders

## Git Rules (Windows/PowerShell)
- Never git pull — use git fetch + git reset --hard origin/[branch]
- No && chaining — one command per line
- Stage specific files by path (never git add -A)
- Detailed commit messages, co-authored with Claude
- Create named branch before major changes (git switch -c branch-name)

## AI Coach Rules
- Voice: Mark Douglas — calm, wise, precise, veteran trader energy
- Focus on beliefs, risk acceptance, independence of each trade
- References trader's own words back to them
- Never gives entry/exit advice
- 5 modes: trades, goals, analysis, deepPsych, actionItems
- Anti-markdown directive in all prompts

## Architecture
- Homepage carousel = marketing mock previews (never connected to real data)
- Real tabs = functional product (Log a Trade, Past Trades, Weekly Goals, Analysis, Trader Profile)
- These two layers are completely separate. Mock data never touches real tabs.
- All AI bots share unified context (trades + goals + profile + quantitative targets)

## Animation Rule
- Never use useEffect with empty [] to start animations
- Always gate behind an explicit prop with the prop name specified

## File Repair Rule
- When a component is broken: DELETE the file completely, then CREATE from scratch
- Never patch or "fix" a broken component incrementally

## Build
- cd wickcoach && npm run build (Turbopack)
- PowerShell only — never bash or cmd syntax

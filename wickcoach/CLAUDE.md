# WickCoach

## What This Is
AI-powered trading psychology journal. Coaches trader behavior using Mark Douglas methodology. Reads journal entries + trade data together.

## Stack
Next.js 14, TypeScript, localStorage for all user data (no server database), Clerk auth, Claude API for AI coach.

## Design System
- Background: #0e0f14
- Card surfaces: #13141a
- Borders: #1a1b22
- Teal accent: #00d4a0
- Red accent: #ff5555
- Text primary: #e8e8f0
- Text secondary: #9a9da8
- Text muted: #6a6d78
- Display font: Chakra Petch (headings)
- Body font: DM Mono (everything else)
- All styles are inline. No Tailwind. No CSS modules.

## Logo
Stick figure with grey strokes. RIGHT ARM reaches up to hold a GREEN CANDLESTICK (green filled rect + thin wick lines). Text: "WICK" in grey + "COACH" in teal #00d4a0.

## Pricing
Essential $35 (no AI), Complete $99 (with AI). Both one-time payments.

## Rules For You
- NEVER patch or fix a broken file. DELETE it completely then CREATE from scratch with full code.
- Always run npm run build to verify before committing.
- Keep components in single files unless told otherwise.
- Minimum text size 14px for body, 12px for labels.
- All grey text must be readable — minimum color #8a8d98.
- Do not split page.tsx into separate component files unless asked.

## Project Structure
- wickcoach/app/page.tsx — homepage
- wickcoach/app/layout.tsx — root layout with fonts and metadata

## Tabs (pages to build)
1. Log a Trade — trade entry form
2. Past Trades — table with filters/sort
3. Analysis — AI chat + stats
4. Trading Goals — weekly goal tracking
5. Trader Profile — radar chart + history

## Known Issues & Patterns

### Tab wiring pattern
When adding tab-based navigation, ALWAYS verify:
1. Tab buttons have onClick handlers that set the SAME state variable the content section reads
2. The content conditional rendering block exists in the JSX and is placed BELOW the tab bar in the component tree
3. State variable names match EXACTLY between the onClick setter and the conditional check (string comparison — watch for casing and spacing)
Never assume existing buttons are wired to state. Always trace the click handler to the render logic.

# Error Log — 2026-03-30

## Mistake 1: External image URL as placeholder
- **What happened**: Used a Wikipedia URL for the trade chart placeholder image. External URLs can fail due to CORS, hotlink blocking, or sandbox restrictions. Should have used an inline SVG from the start.
- **Rule**: Never rely on external image URLs for UI placeholders. Always use inline SVG or local assets.

## Mistake 2: Claimed TickerLogo was removed when it wasn't
- **What happened**: User reported TickerLogo was removed. On inspection it was still present. Need to verify claims against actual code before responding.
- **Rule**: Always read and verify the actual file state before confirming or denying a reported issue.

## General lesson
- When the user says "do not change anything else", treat that as absolute. Read surrounding code carefully before editing to ensure no collateral changes.

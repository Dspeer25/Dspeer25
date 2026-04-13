# Project Preferences

## User's Windows Terminal Rules
- When giving git pull commands for the user to run on their Windows machine, ALWAYS include `--no-edit` flag to prevent the vim merge screen. Example: `git pull --no-edit origin branch-name`
- User's Windows PowerShell does NOT support `&&` chaining — always give commands one per line, never chained with `&&`
- **NEVER use git pull.** Always use `git fetch` + `git reset --hard` instead. This prevents merge conflicts.
- Standard template for every terminal delivery:
  ```
  cd C:\Users\speer\Dspeer25\[project-folder]
  git fetch origin [branch-name]
  git reset --hard origin/[branch-name]
  npm run dev
  ```
- Replace `[project-folder]` and `[branch-name]` with actual values. Never deviate from this pattern.

## AIDesigner Exports
- Always load AIDesigner HTML as iframe FIRST to verify it looks correct
- Only convert to React component AFTER visual confirmation
- When converting: mechanical line-by-line translation, never interpret or simplify
- Never change colors, spacing, gradients, or positioning during conversion
- The HTML file is the source of truth — if the React version looks different, the React version is wrong
- The correct green for this project is #00d4a0 (defined in shared.ts as teal)

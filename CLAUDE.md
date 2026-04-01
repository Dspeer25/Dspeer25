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

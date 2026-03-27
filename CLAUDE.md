# Project Preferences

## User's Windows Terminal Rules
- When giving git pull commands for the user to run on their Windows machine, ALWAYS include `--no-edit` flag to prevent the vim merge screen. Example: `git pull --no-edit origin branch-name`
- User's Windows PowerShell does NOT support `&&` chaining — always give commands one per line, never chained with `&&`

# Issue Log

A running record of bugs that have bitten us so future fixes don't re-introduce them.

---

## [FIXED] Entries not appearing in Entries tab after logging a trade

**Symptom:** User logs a trade on the Log tab, switches to Entries, and it is missing.

**Root cause:** The default date in the blank form used `new Date().toISOString().split("T")[0]`,
which returns the **UTC** date. For US users in the evening, UTC is already the next day, so
the entry gets stamped with tomorrow's date. The "month" range filter upper bound is
`new Date(year, month, date + 1)` local midnight — equal to the UTC-derived date — and the
filter condition was `d >= rangeEnd`, so the entry was excluded.

**Fix:**
- Replaced `new Date().toISOString().split("T")[0]` with a `localDateStr()` helper that
  formats the local clock as `YYYY-MM-DD`.
- Changed the default range filter from `"month"` to `"all"` so new entries always show
  immediately regardless of date arithmetic.

---

## [FIXED] Journals and folders not autosaving (data lost on tab switch)

**Symptom:** User creates or edits a journal entry / folder, switches to another tab, comes
back, and the changes are gone.

**Root cause:** `DailyJournalTab` is conditionally rendered (`{tab === "journal" && ...}`),
so it **fully unmounts** when the user navigates away and **remounts** when they return.
On every mount, `journals` and `folders` both start as `[]`. The save `useEffect`s fire
immediately on mount with this empty state, **wiping localStorage** before the load
`useEffect` has a chance to restore the saved data.

This is especially fatal in **React 18 StrictMode** (used in Next.js dev mode), which
intentionally unmounts and remounts every component once on mount to detect side effects.
The sequence becomes:
1. Mount → save effects fire with `[]` → **wipe localStorage**
2. StrictMode unmount
3. Remount → load effect fires → localStorage is now `[]` → nothing to restore

**Fix:** Added a `loaded` boolean state gate. Save effects check `if (!loaded) return` and
do nothing until the load `useEffect` finishes and sets `loaded = true`. This guarantees
saves only happen after the initial data has been read in.

```ts
const [loaded, setLoaded] = useState(false);

// Load once on mount
useEffect(() => {
  const js = localStorage.getItem("trading-journals");
  const fs = localStorage.getItem("trading-journal-folders");
  if (js) setJournals(JSON.parse(js));
  if (fs) setFolders(JSON.parse(fs));
  setLoaded(true);          // ← unlocks saves
}, []);

// Save only after load
useEffect(() => {
  if (!loaded) return;      // ← guard
  localStorage.setItem("trading-journals", JSON.stringify(journals));
}, [journals, loaded]);

useEffect(() => {
  if (!loaded) return;      // ← guard
  localStorage.setItem("trading-journal-folders", JSON.stringify(folders));
}, [folders, loaded]);
```

**Pattern to use for ANY component that:**
- is conditionally rendered (mounts/unmounts on tab switch), AND
- loads from localStorage on mount, AND
- saves to localStorage on state change.

Always use the `loaded` guard — never use `useState(() => localStorage.getItem(...))` for
conditionally-rendered components because the `useState` initializer does not re-run during
React hydration.

---

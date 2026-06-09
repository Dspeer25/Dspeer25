'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, ChevronRight, Pencil, Trash2,
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Palette,
} from 'lucide-react';
import { fd, fm, teal } from './shared';
import { ToolPageShell } from './ToolsContent';
import { MiniStickFigure } from './Logo';

// ─── Tokens ──────────────────────────────────────────────────────────

const TEXT_BASE   = '#e0e0e0';
const LABEL       = '#a0a3ab';
const BORDER      = 'rgba(255,255,255,0.10)';
const SURFACE_TOP = '#1f232d';
const SURFACE_BOT = '#181c26';
const SURFACE_HI  = '#262a36';   // hover

const FONT_SERIF = "'Lora', Georgia, serif";

// ─── Storage ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'wickcoach_journal';

interface DayEntry {
  id: string;
  label: string;
  /** Legacy "main journal" content from the original single-editor
   *  layout. No longer rendered (the journal moved to discrete
   *  sections), but kept on the type so historical entries don't get
   *  wiped on save. Future migration could merge this into preWeekNote
   *  or session if the trader wants to recover it. */
  content: string;
  /** "Pre Week Note" section — start-of-week framing (top of the
   *  three-section journal). HTML string from the rich-text editor.
   *  Optional for backward compat. */
  preWeekNote?: string;
  /** "Watching for tomorrow" section — what the trader plans to watch
   *  the next session. HTML string from the rich-text editor. */
  watchingTomorrow?: string;
  /** "Session" section — recap / debrief of today's trading session.
   *  HTML string from the rich-text editor. */
  session?: string;
  aiAnalysisEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
interface WeekEntry {
  id: string;
  label: string;
  days: DayEntry[];
  createdAt: string;
}
interface MonthEntry {
  id: string;
  label: string;
  weeks: WeekEntry[];
  createdAt: string;
}
interface JournalState {
  months: MonthEntry[];
}

function loadJournal(): JournalState {
  if (typeof window === 'undefined') return { months: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { months: [] };
  } catch {
    return { months: [] };
  }
}

function saveJournal(j: JournalState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(j));
  } catch { /* quota — silently ignore */ }
}

// ─── Passcode storage ───────────────────────────────────────────────
// The passcode lives as a SHA-256 hash in localStorage. Two pieces:
//   - hash: persists across toggle off (so re-enabling doesn't force
//     a new setup)
//   - enabled: the toggle state itself
// Unlock state ("I've already entered the right code this session")
// lives in sessionStorage so it clears when the browser tab closes.
//
// This is a privacy ward, not bank security. Anyone with devtools can
// clear localStorage and bypass it — which is by design, since
// localStorage is per-browser-per-machine anyway. No backdoor recovery.

const PASSCODE_HASH_KEY     = 'wickcoach_journal_passcode_hash';
const PASSCODE_ENABLED_KEY  = 'wickcoach_journal_passcode_enabled';
const PASSCODE_UNLOCKED_KEY = 'wickcoach_journal_unlocked';
const PASSCODE_LAST_LEFT_KEY = 'wickcoach_journal_last_left';

// Grace window: if you've been away from the journal for less than
// this, you don't get re-prompted on return. Idle time WHILE inside
// the journal doesn't count — only time spent unmounted.
const PASSCODE_GRACE_MS = 10 * 60 * 1000; // 10 minutes

function loadPasscodeHash(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PASSCODE_HASH_KEY);
}

function loadPasscodeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PASSCODE_ENABLED_KEY) === 'true';
}

function savePasscodeHash(hash: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(PASSCODE_HASH_KEY, hash); } catch { /* ignore */ }
}

function savePasscodeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(PASSCODE_ENABLED_KEY, String(enabled)); } catch { /* ignore */ }
}

// Returns true only if the user has unlocked AND hasn't been away from
// the journal longer than PASSCODE_GRACE_MS. Expired returns false and
// proactively wipes the unlock flag so the state is self-healing.
function isCurrentlyUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  const wasUnlocked = sessionStorage.getItem(PASSCODE_UNLOCKED_KEY) === 'true';
  if (!wasUnlocked) return false;
  const lastLeftStr = sessionStorage.getItem(PASSCODE_LAST_LEFT_KEY);
  // No "last left" stamp means we haven't left since unlocking — still good.
  if (!lastLeftStr) return true;
  const lastLeft = parseInt(lastLeftStr, 10);
  if (isNaN(lastLeft)) return true;
  const elapsed = Date.now() - lastLeft;
  if (elapsed > PASSCODE_GRACE_MS) {
    sessionStorage.removeItem(PASSCODE_UNLOCKED_KEY);
    sessionStorage.removeItem(PASSCODE_LAST_LEFT_KEY);
    return false;
  }
  return true;
}

function markUnlockedThisSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PASSCODE_UNLOCKED_KEY, 'true');
    // Clear any stale "last left" so the grace timer starts fresh
    // from the next time the user actually leaves.
    sessionStorage.removeItem(PASSCODE_LAST_LEFT_KEY);
  } catch { /* ignore */ }
}

function markLeftJournal(): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(PASSCODE_LAST_LEFT_KEY, String(Date.now())); } catch { /* ignore */ }
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Date helpers ────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad2(n: number): string { return String(n).padStart(2, '0'); }

function currentMonth(): { id: string; label: string } {
  // If today is a weekend, the trading "current month" is the month of
  // the upcoming Monday — usually the same calendar month, but matters
  // on weekends straddling a month boundary (e.g. Sat May 31 should
  // file under June, since the next trading day is Mon Jun 2).
  const d = nextTradingDay(new Date());
  return {
    id: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
    label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
  };
}

function currentWeek(): { id: string; label: string } {
  // Anchor on the Monday of the trading week we're currently in or
  // about to enter. On a weekend, this is the UPCOMING Monday — the
  // old behavior snapped Sunday back to last week's Monday, which is
  // wrong for a trading journal (markets are closed on weekends).
  const target = nextTradingDay(new Date());
  const day = target.getDay();              // Mon-Fri (1-5) only
  const diff = 1 - day;                      // snap to Monday of same week
  const monday = new Date(target);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  const id = `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
  const label = `Week of ${MONTH_NAMES[monday.getMonth()].slice(0, 3)} ${monday.getDate()}`;
  return { id, label };
}

function currentDay(): { id: string; label: string } {
  // On weekends, "new day" defaults to the upcoming Monday. Sunday
  // entries about Monday's plan should file under Monday, not Sunday.
  const d = nextTradingDay(new Date());
  const id = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const label = `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  return { id, label };
}

// Returns today if today is Mon-Fri, otherwise the upcoming Monday.
// Stock-market calendar awareness — markets are closed Sat + Sun, so
// the journal's "today" rolls forward across the weekend.
function nextTradingDay(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay(); // 0=Sun, 6=Sat
  if (day === 6) out.setDate(out.getDate() + 2); // Sat → Mon
  else if (day === 0) out.setDate(out.getDate() + 1); // Sun → Mon
  return out;
}

// Given a calendar date, return the next trading day strictly AFTER
// it. Friday + 1 → Monday (skips the weekend). Used to pick the
// default date for a new journal day so a Tuesday entry doesn't get
// re-created as Monday when today is still Monday.
function nextTradingDayAfter(d: Date): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + 1);
  return nextTradingDay(out);
}

// "YYYY-MM-DD" id + human label ("Tuesday, Jun 9") built from a
// Date. Centralized so addDay and the helpers downstream share the
// exact same format — id mismatches caused by ad-hoc formatting
// would otherwise let duplicate days slip through.
function buildDayMeta(d: Date): { id: string; label: string } {
  return {
    id: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    label: `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`,
  };
}

// ─── Shared bits ─────────────────────────────────────────────────────

const cardSurface: React.CSSProperties = {
  background: `linear-gradient(180deg, ${SURFACE_TOP} 0%, ${SURFACE_BOT} 100%)`,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  boxShadow: '0 16px 40px -8px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.05)',
};

const labelStyle: React.CSSProperties = {
  fontFamily: fd,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  color: LABEL,
  fontWeight: 600,
};

// ─── Calendar backgrounds ────────────────────────────────────────────
// Each folder kind (month / week / day) gets a faint teal calendar
// watermark behind the label so the tiles read as calendar pages
// rather than generic cards. Pure visual — no interactivity.

function parseMonthIdToDate(id: string): Date | null {
  const m = id.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, 1);
}

function parseDayIdToDate(id: string): Date | null {
  // Used for both week (Monday's date) and day folders — same format.
  const m = id.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
}

function MonthCalendarBg({ monthDate }: { monthDate: Date }) {
  const year  = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDow    = new Date(year, month, 1).getDay();      // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to multiple of 7 for a clean grid.
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div style={{
      position: 'absolute',
      inset: 18,
      top: 56,                  // leave space for the label up top
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gridAutoRows: '1fr',
      gap: 3,
      pointerEvents: 'none',
      opacity: 0.55,            // background opacity multiplier
    }}>
      {cells.map((c, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: c !== null ? 'rgba(0,212,160,0.10)' : 'transparent',
          border: c !== null ? '1px solid rgba(0,212,160,0.18)' : 'none',
          borderRadius: 3,
          fontFamily: fm,
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(0,212,160,0.55)',
        }}>
          {c}
        </div>
      ))}
    </div>
  );
}

function WeekCalendarBg({ mondayDate }: { mondayDate: Date }) {
  const dows = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    return d.getDate();
  });
  return (
    <div style={{
      position: 'absolute',
      inset: 18,
      top: 56,
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 5,
      pointerEvents: 'none',
      opacity: 0.55,
    }}>
      {days.map((d, i) => (
        <div key={i} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          background: 'rgba(0,212,160,0.10)',
          border: '1px solid rgba(0,212,160,0.20)',
          borderRadius: 4,
          padding: '8px 4px',
        }}>
          <div style={{
            fontFamily: fd,
            fontSize: 9,
            letterSpacing: 1,
            color: 'rgba(0,212,160,0.55)',
            fontWeight: 600,
          }}>{dows[i]}</div>
          <div style={{
            fontFamily: fm,
            fontSize: 16,
            fontWeight: 700,
            color: 'rgba(0,212,160,0.65)',
          }}>{d}</div>
        </div>
      ))}
    </div>
  );
}

function DayCalendarBg({ dayDate }: { dayDate: Date }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: fd,
        fontSize: 110,
        fontWeight: 700,
        color: teal,
        opacity: 0.10,
        lineHeight: 1,
      }}>
        {dayDate.getDate()}
      </div>
    </div>
  );
}

function calendarBgFor(kind: TileKind, dateRefId: string): React.ReactNode {
  if (kind === 'month') {
    const d = parseMonthIdToDate(dateRefId);
    return d ? <MonthCalendarBg monthDate={d} /> : null;
  }
  if (kind === 'week') {
    const d = parseDayIdToDate(dateRefId);
    return d ? <WeekCalendarBg mondayDate={d} /> : null;
  }
  const d = parseDayIdToDate(dateRefId);
  return d ? <DayCalendarBg dayDate={d} /> : null;
}

type TileKind = 'month' | 'week' | 'day';

// ─── Folder tile (Month/Week/Day) ────────────────────────────────────

function FolderTile({
  label, sublabel, kind, dateRefId, onClick, onRename, onDelete,
}: {
  label: string;
  sublabel?: string;
  kind: TileKind;
  dateRefId: string;
  onClick: () => void;
  onRename?: (newLabel: string) => void;
  /** When provided, shows a small trash affordance that calls this
   *  handler. The handler is expected to open a confirmation modal
   *  (see DeleteConfirmModal) — not delete immediately. */
  onDelete?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== label && onRename) onRename(trimmed);
    else setDraft(label);
  };

  return (
    <div
      onClick={() => { if (!editing) onClick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardSurface,
        background: hover && !editing
          ? `linear-gradient(180deg, ${SURFACE_HI} 0%, ${SURFACE_TOP} 100%)`
          : cardSurface.background,
        border: hover && !editing ? `1px solid rgba(0,212,160,0.40)` : `1px solid ${BORDER}`,
        padding: '24px 24px 18px',
        minHeight: 220,
        cursor: editing ? 'text' : 'pointer',
        transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.2s ease',
        transform: hover && !editing ? 'translateY(-2px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Calendar watermark — week strip / big day number. Month tiles
          intentionally have no watermark: the months page itself is
          laid out as a full-year calendar, so a tile-level mini
          calendar would be redundant and visually noisy. */}
      {kind !== 'month' && calendarBgFor(kind, dateRefId)}

      {/* Header row: label + chevron */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
              else if (e.key === 'Escape') { setDraft(label); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              background: 'rgba(6,8,12,0.85)',
              border: `1px solid ${teal}`,
              borderRadius: 6,
              color: TEXT_BASE,
              fontFamily: fd,
              fontSize: 22,
              fontWeight: 600,
              padding: '8px 12px',
              outline: 'none',
            }}
          />
        ) : (
          <div style={{
            fontFamily: fd,
            fontSize: 22,
            fontWeight: 600,
            color: TEXT_BASE,
            letterSpacing: 0.3,
            lineHeight: 1.2,
            // Subtle dark glow behind the label so it stays legible
            // when it overlaps the calendar watermark.
            textShadow: '0 0 12px rgba(10,13,20,0.9), 0 0 6px rgba(10,13,20,0.7)',
          }}>
            {label}
          </div>
        )}
        {!editing && (
          <ChevronRight size={20} color={hover ? teal : LABEL} style={{ flexShrink: 0 }} />
        )}
      </div>

      {/* Sublabel pinned bottom-left */}
      {sublabel && !editing && (
        <div style={{
          position: 'relative',
          marginTop: 'auto',
          paddingTop: 14,
          fontFamily: fm,
          fontSize: 14,
          color: '#c4c7cf',
          letterSpacing: 0.3,
          textShadow: '0 0 8px rgba(10,13,20,0.9)',
        }}>
          {sublabel}
        </div>
      )}

      {/* Hover-only icon overlay — centered over the tile. Pencil for
          rename (teal), trash for delete (red). Each button has its
          own hover state and stopPropagation so the parent tile's
          open handler doesn't fire when clicking an icon. */}
      {!editing && hover && (onRename || onDelete) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 12,
          zIndex: 5,
          background: 'rgba(10,13,20,0.82)',
          padding: '12px 16px',
          borderRadius: 12,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 12px 28px rgba(0,0,0,0.55)',
        }}>
          {onRename && (
            <IconAffordance
              icon={Pencil}
              label="Rename"
              hoverColor={teal}
              onClick={() => { setDraft(label); setEditing(true); }}
            />
          )}
          {onDelete && (
            <IconAffordance
              icon={Trash2}
              label="Delete"
              hoverColor="#ff4444"
              onClick={onDelete}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Circular icon button used in the FolderTile hover overlay. Each
// instance owns its own hover state so the icon recolors only when
// the cursor is on THIS button, not the whole overlay. Calls
// stopPropagation so the parent tile's open handler doesn't fire.
function IconAffordance({ icon: Icon, label, hoverColor, onClick }: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  hoverColor: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={label}
      title={label}
      style={{
        width: 46,
        height: 46,
        borderRadius: 10,
        background: hover ? `${hoverColor}26` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hover ? hoverColor : 'rgba(255,255,255,0.10)'}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s ease, border-color 0.15s ease',
        padding: 0,
      }}
    >
      <Icon size={22} color={hover ? hoverColor : '#c4c7cf'} strokeWidth={1.75} />
    </button>
  );
}

// ─── "New X" tile ────────────────────────────────────────────────────

function NewTile({ label, preview, kind, dateRefId, onClick }: {
  label: string;
  /** What you'd actually be creating, e.g. "June 2026" / "Week of Jun 8"
   *  / "Mon, Jun 8". Rendered as a second line so the trader can see
   *  the live calendar context without clicking. */
  preview?: string;
  /** Drives the calendar watermark behind the tile — same render as
   *  a real folder tile, so clicking just transitions the visual
   *  rather than swapping it. */
  kind: TileKind;
  dateRefId: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: hover ? 'rgba(0,212,160,0.10)' : 'transparent',
        border: `2px dashed ${hover ? teal : 'rgba(255,255,255,0.22)'}`,
        borderRadius: 16,
        padding: '24px 24px 18px',
        minHeight: 220,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        transition: 'border-color 0.2s ease, background 0.2s ease',
      }}
    >
      {/* Calendar watermark — same as the eventual folder tile, so the
          click feels like "filling in" the preview rather than swapping
          to a different tile. */}
      {calendarBgFor(kind, dateRefId)}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Plus size={32} color={hover ? teal : LABEL} strokeWidth={1.75} />
        <div style={{
          fontFamily: fd,
          fontSize: 15,
          fontWeight: 600,
          color: hover ? teal : LABEL,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          textAlign: 'center',
          textShadow: '0 0 8px rgba(10,13,20,0.9)',
        }}>
          {label}
        </div>
        {preview && (
          <div style={{
            fontFamily: fm,
            fontSize: 14,
            fontWeight: 500,
            color: hover ? TEXT_BASE : '#c4c7cf',
            textAlign: 'center',
            textShadow: '0 0 8px rgba(10,13,20,0.9)',
          }}>
            {preview}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Breadcrumb ──────────────────────────────────────────────────────

function Breadcrumb({ trail }: { trail: { label: string; onClick?: () => void }[] }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 32,
      flexWrap: 'wrap',
    }}>
      {trail.map((node, i) => {
        const isLast = i === trail.length - 1;
        return (
          <React.Fragment key={i}>
            <span
              onClick={node.onClick}
              style={{
                fontFamily: fd,
                fontSize: isLast ? 20 : 17,
                fontWeight: isLast ? 600 : 500,
                color: isLast ? TEXT_BASE : '#c4c7cf',
                cursor: node.onClick ? 'pointer' : 'default',
                letterSpacing: 0.3,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => { if (node.onClick) (e.currentTarget as HTMLElement).style.color = teal; }}
              onMouseLeave={(e) => { if (node.onClick) (e.currentTarget as HTMLElement).style.color = '#c4c7cf'; }}
            >
              {node.label}
            </span>
            {!isLast && <ChevronRight size={18} color={LABEL} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Closed book (the opening animation) ─────────────────────────────

function ClosedBook({ dayLabel, onOpen }: { dayLabel: string; onOpen: () => void }) {
  const [opening, setOpening] = useState(false);
  const [hover, setHover] = useState(false);

  const handleClick = () => {
    if (opening) return;
    setOpening(true);
    // Animation duration matches the CSS transition below.
    setTimeout(onOpen, 700);
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: '60px 20px',
        perspective: 1400,
      }}
    >
      <div
        onClick={handleClick}
        style={{
          position: 'relative',
          width: 440,
          height: 600,
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.7s cubic-bezier(0.6, 0.05, 0.3, 0.95), opacity 0.7s ease',
          transform: opening ? 'rotateY(-95deg) translateX(-40px)' : 'rotateY(-8deg)',
          transformOrigin: 'left center',
          opacity: opening ? 0 : 1,
        }}
      >
        {/* Cover */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #2a2e3a 0%, #1c2028 60%, #14171f 100%)',
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          boxShadow: `
            0 40px 80px -12px rgba(0,0,0,0.9),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset -10px 0 20px rgba(0,0,0,0.45)
          `,
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Top accent band */}
          <div style={{
            position: 'absolute',
            top: 30,
            left: 30,
            right: 30,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${teal}, transparent)`,
            opacity: 0.6,
          }} />

          {/* Spine seam on the left */}
          <div style={{
            position: 'absolute',
            top: 20,
            bottom: 20,
            left: 12,
            width: 2,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 2,
          }} />

          <div style={{ flex: 1 }} />

          {/* Stickman logo — the actual WickCoach mark */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <MiniStickFigure size={132} />
          </div>

          {/* Wordmark */}
          <div style={{
            fontFamily: fd,
            fontSize: 36,
            fontWeight: 700,
            color: TEXT_BASE,
            letterSpacing: 5,
            textAlign: 'center',
            lineHeight: 1.2,
          }}>
            WICKCOACH
          </div>

          <div style={{
            marginTop: 12,
            fontFamily: fm,
            fontSize: 15,
            color: '#c4c7cf',
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            Journal
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              fontFamily: fm,
              fontSize: 20,
              color: '#e0e0e0',
              fontStyle: 'italic',
              fontWeight: 500,
            }}>
              {dayLabel}
            </div>
          </div>

          {/* Bottom accent band */}
          <div style={{
            position: 'absolute',
            bottom: 30,
            left: 30,
            right: 30,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${teal}, transparent)`,
            opacity: 0.6,
          }} />
        </div>
      </div>

      <div
        onClick={handleClick}
        style={{
          fontFamily: fd,
          fontSize: 22,
          fontWeight: 700,
          color: opening ? 'transparent' : teal,
          textTransform: 'uppercase',
          letterSpacing: 3,
          transition: 'text-shadow 0.25s ease, color 0.3s ease, transform 0.2s ease',
          cursor: 'pointer',
          // Always-on subtle teal glow, intensifies on hover.
          textShadow: hover
            ? '0 0 18px rgba(0,212,160,0.95), 0 0 36px rgba(0,212,160,0.65), 0 0 60px rgba(0,212,160,0.4)'
            : '0 0 10px rgba(0,212,160,0.4)',
          transform: hover ? 'scale(1.06)' : 'scale(1)',
        }}
      >
        Click to open
      </div>
    </div>
  );
}

// ─── Privacy toggle ──────────────────────────────────────────────────

function PrivacyToggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
    >
      <button
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        aria-label="Toggle WickCoach analysis"
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 999,
          background: enabled ? teal : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer',
          transition: 'background 0.25s ease',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: enabled ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </button>
      <div
        onClick={() => onChange(!enabled)}
        style={{
          fontFamily: fd,
          fontSize: 13,
          fontWeight: 600,
          color: enabled ? teal : LABEL,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          userSelect: 'none',
          transition: 'color 0.2s ease',
        }}
      >
        WickCoach Analysis · {enabled ? 'On' : 'Off'}
      </div>

      {hover && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          left: 0,
          background: '#0e0f14',
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: '12px 14px',
          fontFamily: fm,
          fontSize: 12,
          lineHeight: 1.55,
          color: TEXT_BASE,
          width: 320,
          zIndex: 50,
          boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}>
          Your journal is yours. Keep it private and internal, or flip this on to let WickCoach analyze what you write and surface patterns in your coaching.
        </div>
      )}
    </div>
  );
}

// ─── Passcode: lock screen, setup modal, toggle ─────────────────────

function PasscodeToggle({
  enabled, hasHash, onChange,
}: {
  enabled: boolean;
  hasHash: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        aria-label="Toggle journal passcode"
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 999,
          background: enabled ? teal : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer',
          transition: 'background 0.25s ease',
          padding: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: enabled ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </button>
      <div
        onClick={() => onChange(!enabled)}
        style={{
          fontFamily: fd,
          fontSize: 13,
          fontWeight: 600,
          color: enabled ? teal : LABEL,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          userSelect: 'none',
          cursor: 'pointer',
        }}
      >
        Passcode · {enabled ? 'On' : 'Off'}{!hasHash && enabled ? ' (set up)' : ''}
      </div>
    </div>
  );
}

function PasscodeSetup({ onSave, onCancel }: {
  onSave: (hash: string) => void;
  onCancel: () => void;
}) {
  const [pc, setPc]           = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr]         = useState<string | null>(null);
  const [busy, setBusy]       = useState(false);

  const submit = async () => {
    setErr(null);
    if (pc.length < 4) {
      setErr('Passcode must be at least 4 characters.');
      return;
    }
    if (pc !== confirm) {
      setErr('Passcodes do not match.');
      return;
    }
    setBusy(true);
    try {
      const hash = await sha256(pc);
      onSave(hash);
    } catch {
      setErr('Could not hash passcode. Try again.');
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        ...cardSurface,
        padding: '36px 40px',
        maxWidth: 440,
        width: '100%',
      }}>
        <div style={{
          fontFamily: fd, fontSize: 22, fontWeight: 600,
          color: TEXT_BASE, letterSpacing: 0.5, marginBottom: 8,
        }}>
          Set a passcode
        </div>
        <div style={{
          fontFamily: fm, fontSize: 14, color: LABEL,
          lineHeight: 1.55, marginBottom: 24,
        }}>
          Stays in your browser only. No recovery — if you forget it, the only reset is clearing localStorage in devtools.
        </div>

        <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Passcode</label>
        <input
          type="password"
          autoFocus
          value={pc}
          onChange={(e) => setPc(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          style={passcodeInputStyle}
        />

        <label style={{ ...labelStyle, display: 'block', marginTop: 18, marginBottom: 8 }}>Confirm passcode</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          style={passcodeInputStyle}
        />

        {err && (
          <div style={{
            marginTop: 14, fontFamily: fm, fontSize: 13, color: '#ff4444',
          }}>
            {err}
          </div>
        )}

        <div style={{
          marginTop: 28, display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              ...passcodeBtnStyle,
              background: 'transparent',
              border: `1px solid ${BORDER}`,
              color: LABEL,
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            style={{
              ...passcodeBtnStyle,
              background: teal,
              border: `1px solid ${teal}`,
              color: '#0A0D14',
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? 'Saving…' : 'Save passcode'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LockScreen({ expectedHash, onUnlock }: {
  expectedHash: string;
  onUnlock: () => void;
}) {
  const [pc, setPc]       = useState('');
  const [shake, setShake] = useState(false);
  const [err, setErr]     = useState<string | null>(null);
  const [busy, setBusy]   = useState(false);

  const submit = async () => {
    if (!pc) return;
    setBusy(true);
    setErr(null);
    try {
      const h = await sha256(pc);
      if (h === expectedHash) {
        markUnlockedThisSession();
        onUnlock();
      } else {
        setErr('Incorrect passcode.');
        setShake(true);
        setPc('');
        setTimeout(() => setShake(false), 500);
        setBusy(false);
      }
    } catch {
      setErr('Could not verify. Try again.');
      setBusy(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 24, padding: '60px 20px',
    }}>
      <style>{`@keyframes lockShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`}</style>
      <div style={{
        ...cardSurface,
        padding: '40px 44px',
        width: 'min(440px, 100%)',
        animation: shake ? 'lockShake 0.4s ease' : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <MiniStickFigure size={64} />
        </div>
        <div style={{
          fontFamily: fd, fontSize: 22, fontWeight: 600, color: TEXT_BASE,
          letterSpacing: 0.5, textAlign: 'center', marginBottom: 8,
        }}>
          Journal locked
        </div>
        <div style={{
          fontFamily: fm, fontSize: 14, color: LABEL,
          textAlign: 'center', marginBottom: 24, lineHeight: 1.55,
        }}>
          Enter your passcode to open the journal.
        </div>

        <input
          type="password"
          autoFocus
          value={pc}
          onChange={(e) => setPc(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Passcode"
          style={passcodeInputStyle}
        />

        {err && (
          <div style={{
            marginTop: 12, fontFamily: fm, fontSize: 13,
            color: '#ff4444', textAlign: 'center',
          }}>
            {err}
          </div>
        )}

        <button
          onClick={submit}
          disabled={busy || !pc}
          style={{
            ...passcodeBtnStyle,
            width: '100%',
            marginTop: 18,
            background: teal,
            border: `1px solid ${teal}`,
            color: '#0A0D14',
            opacity: (busy || !pc) ? 0.5 : 1,
          }}
        >
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>

        <div style={{
          marginTop: 16, fontFamily: fm, fontSize: 12,
          color: LABEL, textAlign: 'center', lineHeight: 1.55,
        }}>
          Forgot it? There is no recovery — clear <code style={{ fontFamily: fm, color: TEXT_BASE }}>wickcoach_journal_passcode_hash</code> in devtools localStorage to reset.
        </div>
      </div>
    </div>
  );
}

const passcodeInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(6,8,12,0.6)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 8,
  color: TEXT_BASE,
  fontFamily: fm,
  fontSize: 18,
  fontWeight: 500,
  padding: '14px 16px',
  outline: 'none',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
  letterSpacing: 2,
  boxSizing: 'border-box',
};

const passcodeBtnStyle: React.CSSProperties = {
  fontFamily: fd,
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  padding: '12px 22px',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'opacity 0.15s ease, background 0.15s ease',
};

// ─── Editor toolbar ──────────────────────────────────────────────────

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Serif',   value: FONT_SERIF },
  { label: 'Mono',    value: fm },
  { label: 'Display', value: fd },
];

const SIZE_OPTIONS: { label: string; value: string }[] = [
  { label: 'S', value: '2' },
  { label: 'M', value: '4' },
  { label: 'L', value: '6' },
];

function ToolbarButton({
  onClick, children, title, active = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  active?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: active ? 'rgba(0,212,160,0.15)' : hover ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: 'none',
        color: active ? teal : (hover ? TEXT_BASE : LABEL),
        padding: '8px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div style={{
      width: 1,
      height: 22,
      background: 'rgba(255,255,255,0.10)',
      margin: '0 4px',
    }} />
  );
}

// 12-swatch palette popup that replaces the native <input type="color">.
// Click swatch → applies color via execCommand('foreColor', hex) → closes.
// Avoids the cross-browser focus-restore problems with the native picker.
const COLOR_PRESETS: { hex: string; label: string }[] = [
  { hex: '#e0e0e0', label: 'Default' },
  { hex: '#00d4a0', label: 'Teal'    },
  { hex: '#ff4444', label: 'Red'     },
  { hex: '#f59e0b', label: 'Amber'   },
  { hex: '#4a9eff', label: 'Blue'    },
  { hex: '#a855f7', label: 'Purple'  },
  { hex: '#ec4899', label: 'Pink'    },
  { hex: '#84cc16', label: 'Lime'    },
  { hex: '#f97316', label: 'Orange'  },
  { hex: '#14b8a6', label: 'Cyan'    },
  { hex: '#fbbf24', label: 'Yellow'  },
  { hex: '#a0a3ab', label: 'Gray'    },
];

function ColorPickerPopover({ currentColor, setCurrentColor, cmd }: {
  currentColor: string;
  setCurrentColor: (v: string) => void;
  cmd: (command: string, value?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on click outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // requestAnimationFrame so the click that opened the popup
    // doesn't immediately close it via this handler.
    const id = requestAnimationFrame(() => document.addEventListener('mousedown', onDown));
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const applyColor = (hex: string) => {
    setCurrentColor(hex);
    cmd('foreColor', hex);
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <ToolbarButton title="Font color" onClick={() => setOpen(o => !o)} active={open}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Palette size={16} />
          <div style={{ width: 16, height: 3, background: currentColor, borderRadius: 1 }} />
        </div>
      </ToolbarButton>

      {open && (
        <div
          // preventDefault on the wrapper's mousedown keeps the editor
          // from losing focus / collapsing the selection when the user
          // clicks anywhere inside the popup. The swatch buttons still
          // receive their click events.
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 50,
            background: '#0e0f14',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding: 10,
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            width: 180,
          }}
        >
          {COLOR_PRESETS.map(c => {
            const active = c.hex.toLowerCase() === currentColor.toLowerCase();
            return (
              <button
                key={c.hex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyColor(c.hex)}
                title={c.label}
                aria-label={c.label}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  background: c.hex,
                  border: active ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: active ? '0 0 0 1px rgba(0,0,0,0.6)' : 'none',
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function Toolbar({
  editorRef, savedRangeRef,
  currentFont, setCurrentFont,
  currentColor, setCurrentColor,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  savedRangeRef: React.RefObject<Range | null>;
  currentFont: string;
  setCurrentFont: (v: string) => void;
  currentColor: string;
  setCurrentColor: (v: string) => void;
}) {
  // execCommand wrapper. Order matters here:
  //   1. focus the editor first — focus() on contentEditable in some
  //      browsers (notably WebKit) collapses any existing selection,
  //      so if we restore before focusing, the focus can wipe out
  //      the range we just restored.
  //   2. restore the editor's last-known selection (toolbar focus
  //      otherwise collapsed it, so the command would apply to
  //      nothing or to the wrong text).
  //   3. run the legacy execCommand.
  const cmd = (command: string, value?: string) => {
    editorRef.current?.focus();
    const range = savedRangeRef.current;
    if (range) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    document.execCommand(command, false, value);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      flexWrap: 'wrap',
      padding: '10px 14px',
      background: 'rgba(0,0,0,0.25)',
      border: `1px solid ${BORDER}`,
      borderRadius: 10,
      marginBottom: 20,
    }}>
      {/* Font picker — preventDefault REMOVED from native selects;
          it was blocking the dropdown from opening on most browsers.
          Selection restore is handled inside cmd() via savedRangeRef. */}
      <select
        value={currentFont}
        onChange={(e) => {
          const v = e.target.value;
          setCurrentFont(v);
          cmd('fontName', v);
        }}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${BORDER}`,
          color: TEXT_BASE,
          fontFamily: fd,
          fontSize: 13,
          fontWeight: 500,
          padding: '6px 10px',
          borderRadius: 6,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {FONT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#0e0f14' }}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Size picker */}
      <select
        defaultValue="4"
        onChange={(e) => cmd('fontSize', e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${BORDER}`,
          color: TEXT_BASE,
          fontFamily: fd,
          fontSize: 13,
          fontWeight: 500,
          padding: '6px 10px',
          borderRadius: 6,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {SIZE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#0e0f14' }}>
            {opt.label}
          </option>
        ))}
      </select>

      <ToolbarDivider />

      <ToolbarButton title="Bold (Ctrl+B)"      onClick={() => cmd('bold')}><Bold size={16} /></ToolbarButton>
      <ToolbarButton title="Italic (Ctrl+I)"    onClick={() => cmd('italic')}><Italic size={16} /></ToolbarButton>
      <ToolbarButton title="Underline (Ctrl+U)" onClick={() => cmd('underline')}><Underline size={16} /></ToolbarButton>

      {/* Font color — custom palette popup. The native <input type=
          "color"> picker had unreliable behavior across browsers when
          combined with the editor's selection-save/restore dance;
          this avoids the native picker entirely. Click the Palette
          button → swatch grid appears → click a swatch → color
          applies to the saved selection immediately and the popup
          closes. */}
      <ColorPickerPopover currentColor={currentColor} setCurrentColor={setCurrentColor} cmd={cmd} />

      <ToolbarDivider />

      <ToolbarButton title="Align left"   onClick={() => cmd('justifyLeft')}><AlignLeft size={16} /></ToolbarButton>
      <ToolbarButton title="Align center" onClick={() => cmd('justifyCenter')}><AlignCenter size={16} /></ToolbarButton>
      <ToolbarButton title="Align right"  onClick={() => cmd('justifyRight')}><AlignRight size={16} /></ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Bulleted list" onClick={() => cmd('insertUnorderedList')}><List size={16} /></ToolbarButton>
      <ToolbarButton title="Numbered list" onClick={() => cmd('insertOrderedList')}><ListOrdered size={16} /></ToolbarButton>
    </div>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────

function Editor({ day, onPreWeekChange, onWatchingChange, onSessionChange, onTogglePrivacy }: {
  day: DayEntry;
  onPreWeekChange: (html: string) => void;
  onWatchingChange: (html: string) => void;
  onSessionChange: (html: string) => void;
  onTogglePrivacy: (v: boolean) => void;
}) {
  return (
    <div>
      {/* Top row: privacy toggle (left) + date title (right) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <PrivacyToggle
          enabled={day.aiAnalysisEnabled}
          onChange={onTogglePrivacy}
        />
        <div style={{
          fontFamily: fd,
          fontSize: 22,
          fontWeight: 600,
          color: TEXT_BASE,
          letterSpacing: 0.4,
        }}>
          {day.label}
        </div>
      </div>

      {/* Three discrete journal sections, in order. Each is a
          self-contained rich-text editor with its own toolbar so the
          font / size / color picker / bold / etc. work on whichever
          section the cursor is in. `key={day.id}` on each forces a
          remount when navigating between days so the editor content
          reloads cleanly from the new day's stored HTML. */}
      <SectionEditor
        key={day.id + ':pre'}
        title="Pre Week Note"
        initialHtml={day.preWeekNote || ''}
        onChange={onPreWeekChange}
        placeholder="Start-of-week framing. What you're working on, what you're avoiding, what you want this week to look like…"
        minHeight={300}
      />

      <div style={{ marginTop: 36 }}>
        <SectionEditor
          key={day.id + ':watching'}
          title="Watching for Tomorrow"
          initialHtml={day.watchingTomorrow || ''}
          onChange={onWatchingChange}
          placeholder="Setups, tickers, levels, news catalysts to watch tomorrow…"
          minHeight={300}
        />
      </div>

      <div style={{ marginTop: 36 }}>
        <SectionEditor
          key={day.id + ':session'}
          title="Session"
          initialHtml={day.session || ''}
          onChange={onSessionChange}
          placeholder="How the session actually went. What you did, what surprised you, what you'd repeat or change…"
          minHeight={360}
        />
      </div>

      <div style={{
        marginTop: 24,
        fontFamily: fm,
        fontSize: 14,
        color: '#c4c7cf',
        textAlign: 'right',
      }}>
        Auto-saved · last edited {new Date(day.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}

// Self-contained rich-text section editor — title bar + toolbar +
// lined-paper contentEditable in a single card. Each instance owns
// its own editor ref, saved-selection ref, and font/color state, so
// formatting actions apply to that section's text only. The parent
// (Editor) renders one of these per journal section (pre-week,
// watching, session) and keying them by `day.id` forces a remount
// when the user navigates between days so content reloads cleanly.
function SectionEditor({ title, initialHtml, onChange, placeholder, minHeight }: {
  title: string;
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [currentFont, setCurrentFont] = useState(FONT_SERIF);
  const [currentColor, setCurrentColor] = useState(TEXT_BASE);
  const [isEmpty, setIsEmpty] = useState(!initialHtml || initialHtml === '<br>');

  // selectionchange listener — saves the latest range whenever the
  // cursor is INSIDE this editor. The check against editorRef makes
  // sure we don't pick up selections in sibling editors or in
  // toolbar inputs.
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const editor = editorRef.current;
      if (editor && (editor === range.commonAncestorContainer || editor.contains(range.commonAncestorContainer))) {
        savedRangeRef.current = range.cloneRange();
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  // Imperatively load initial HTML on mount. Setting innerHTML via
  // React would clobber the caret on every re-render.
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml || '';
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedSave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setIsEmpty(html === '' || html === '<br>');
    if (debouncedSave.current) clearTimeout(debouncedSave.current);
    debouncedSave.current = setTimeout(() => onChange(html), 600);
  }, [onChange]);

  return (
    <div>
      <SectionHeader>{title}</SectionHeader>

      <Toolbar
        editorRef={editorRef}
        savedRangeRef={savedRangeRef}
        currentFont={currentFont}
        setCurrentFont={setCurrentFont}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
      />

      {/* Lined-paper editor surface */}
      <div style={{
        ...cardSurface,
        padding: '32px 40px',
        minHeight: (minHeight ?? 300) + 64,
        position: 'relative',
      }}>
        {/* Placeholder — only visible while the contentEditable is
            empty. contentEditable has no native placeholder attribute,
            so this is a positioned overlay that disappears once the
            user starts typing. */}
        {isEmpty && placeholder && (
          <div style={{
            position: 'absolute',
            top: 32,
            left: 40,
            right: 40,
            fontFamily: FONT_SERIF,
            fontSize: 17,
            lineHeight: '34px',
            color: '#7e818a',
            pointerEvents: 'none',
            fontStyle: 'italic',
          }}>
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          onFocus={(e) => {
            // Seed the default font if the editor is empty so the
            // first character the user types is in the right face.
            if (e.currentTarget.innerHTML === '' || e.currentTarget.innerHTML === '<br>') {
              document.execCommand('fontName', false, FONT_SERIF);
            }
          }}
          style={{
            outline: 'none',
            color: TEXT_BASE,
            fontFamily: currentFont,
            fontSize: 17,
            lineHeight: '34px',
            backgroundImage:
              'linear-gradient(to bottom, transparent 0, transparent 33px, rgba(160,163,171,0.18) 33px, rgba(160,163,171,0.18) 34px)',
            backgroundSize: '100% 34px',
            backgroundAttachment: 'local',
            minHeight: minHeight ?? 300,
            cursor: 'text',
            position: 'relative',
          }}
        />
      </div>
    </div>
  );
}

// Section header used inside the editor view to label the three
// sub-sections (Today's Notes / Watching for Tomorrow / Session). Small
// uppercase Chakra Petch with a thin teal accent underline — gives the
// journal page a little more structure without losing the "journal"
// feel.
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: fd,
      fontSize: 14,
      fontWeight: 600,
      color: TEXT_BASE,
      textTransform: 'uppercase',
      letterSpacing: 1.6,
      marginBottom: 14,
      paddingBottom: 8,
      borderBottom: `2px solid ${teal}`,
      width: 'fit-content',
    }}>
      {children}
    </div>
  );
}


// ─── Delete confirmation modal ──────────────────────────────────────
// Modal requires the user to type "delete" exactly before the Delete
// button activates — guards against accidental nukes of a month or
// week worth of journal entries.
function DeleteConfirmModal({ targetLabel, onConfirm, onCancel }: {
  targetLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState('');
  const ready = draft.trim().toLowerCase() === 'delete';
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ ...cardSurface, padding: '36px 40px', maxWidth: 460, width: '100%' }}>
        <div style={{
          fontFamily: fd, fontSize: 22, fontWeight: 600,
          color: '#ff4444', letterSpacing: 0.5, marginBottom: 10,
        }}>
          Delete {targetLabel}?
        </div>
        <div style={{
          fontFamily: fm, fontSize: 14, color: '#c4c7cf',
          lineHeight: 1.55, marginBottom: 24,
        }}>
          This removes the folder and everything inside it. Cannot be
          undone. Type <span style={{ color: '#ff4444', fontWeight: 600 }}>delete</span> to confirm.
        </div>

        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && ready) onConfirm(); }}
          placeholder="type 'delete' to confirm"
          style={{
            ...passcodeInputStyle,
            borderColor: ready ? 'rgba(255,68,68,0.5)' : 'rgba(255,255,255,0.10)',
            letterSpacing: 0,
          }}
        />

        <div style={{
          marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            style={{
              ...passcodeBtnStyle,
              background: 'transparent',
              border: `1px solid ${BORDER}`,
              color: LABEL,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (ready) onConfirm(); }}
            disabled={!ready}
            style={{
              ...passcodeBtnStyle,
              background: ready ? '#ff4444' : 'rgba(255,68,68,0.15)',
              border: `1px solid ${ready ? '#ff4444' : 'rgba(255,68,68,0.3)'}`,
              color: ready ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: ready ? 'pointer' : 'not-allowed',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Empty cell in the year-calendar grid — represents a month that has
// no journal folder yet. Clickable to create that month.
function EmptyMonthSlot({ monthIdx, year, isCurrent, onCreate }: {
  monthIdx: number;
  year: number;
  /** True if this slot represents the trader's current "today" month
   *  (weekend-aware). Renders with a brighter teal hint. */
  isCurrent: boolean;
  onCreate: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onCreate}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: hover ? 'rgba(0,212,160,0.08)' : 'transparent',
        border: `1.5px dashed ${
          hover ? teal :
          isCurrent ? 'rgba(0,212,160,0.4)' :
          'rgba(255,255,255,0.12)'
        }`,
        borderRadius: 14,
        minHeight: 180,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 18,
        transition: 'border-color 0.2s ease, background 0.2s ease',
      }}
    >
      <div style={{
        fontFamily: fd,
        fontSize: 24,
        fontWeight: 600,
        color: hover ? teal : isCurrent ? '#c4c7cf' : '#7e818a',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
      }}>
        {MONTH_NAMES[monthIdx].slice(0, 3)}
      </div>
      <div style={{
        fontFamily: fm,
        fontSize: 12,
        color: hover ? teal : '#7e818a',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}>
        {hover ? '+ Add' : isCurrent ? 'current' : ''}
      </div>
    </div>
  );
}

function YearSwitcher({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      padding: '8px 18px',
      background: 'rgba(6,8,12,0.5)',
      border: `1px solid ${BORDER}`,
      borderRadius: 10,
    }}>
      <button
        onClick={() => onChange(year - 1)}
        aria-label="Previous year"
        style={yearArrowStyle}
      >
        ‹
      </button>
      <div style={{
        fontFamily: fd,
        fontSize: 24,
        fontWeight: 700,
        color: TEXT_BASE,
        letterSpacing: 1,
        minWidth: 64,
        textAlign: 'center',
      }}>
        {year}
      </div>
      <button
        onClick={() => onChange(year + 1)}
        aria-label="Next year"
        style={yearArrowStyle}
      >
        ›
      </button>
    </div>
  );
}

const yearArrowStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: LABEL,
  fontSize: 28,
  fontFamily: fd,
  fontWeight: 700,
  cursor: 'pointer',
  padding: '0 6px',
  lineHeight: 1,
  transition: 'color 0.15s ease',
};

// ─── Main component ──────────────────────────────────────────────────

type View =
  | { kind: 'months' }
  | { kind: 'weeks';  monthId: string }
  | { kind: 'days';   monthId: string; weekId: string }
  | { kind: 'book';   monthId: string; weekId: string; dayId: string }
  | { kind: 'editor'; monthId: string; weekId: string; dayId: string };

export function OverallJournalContent({ onBack }: { onBack: () => void }) {
  const [journal, setJournal] = useState<JournalState>({ months: [] });
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>({ kind: 'months' });

  // Passcode state.
  //   passcodeHash    — null until the user has set a passcode at least
  //                     once. Persists across toggle off → on so flipping
  //                     the switch back on doesn't force a new setup.
  //   passcodeEnabled — the toggle state itself.
  //   unlocked        — set true once the user has entered the correct
  //                     code this browser-tab session.
  //   showSetup       — true while the set-passcode modal is open.
  const [passcodeHash, setPasscodeHash]       = useState<string | null>(null);
  const [passcodeEnabled, setPasscodeEnabled] = useState(false);
  const [unlocked, setUnlocked]               = useState(false);
  const [showSetup, setShowSetup]             = useState(false);

  // Initial load (client-only — localStorage is undefined during SSR).
  // The hydrated flag is critical: without it, the save effect below
  // fires on initial mount with the empty default state and overwrites
  // whatever's in storage *before* this load effect's setJournal
  // update is applied. Next.js dev strict-mode double-invokes effects,
  // so the second pass would then read the empty value back. Net
  // result: data loss on every page refresh.
  useEffect(() => {
    setJournal(loadJournal());
    setPasscodeHash(loadPasscodeHash());
    setPasscodeEnabled(loadPasscodeEnabled());
    // isCurrentlyUnlocked() respects the 10-minute grace window — it
    // returns false (and clears the unlock flag) if the user has been
    // away from the journal longer than that, so the lock screen
    // re-appears on return.
    setUnlocked(isCurrentlyUnlocked());
    setHydrated(true);
  }, []);

  // On unmount (user navigates back to Tools grid, or to another nav
  // tab — both unmount this component), stamp the "last left" time so
  // isCurrentlyUnlocked() on next mount knows how long the user was away.
  useEffect(() => {
    return () => { markLeftJournal(); };
  }, []);

  // Persist on every change — but only after hydration, so we never
  // write the empty default state over real saved data.
  useEffect(() => {
    if (!hydrated) return;
    saveJournal(journal);
  }, [journal, hydrated]);

  // Persist passcode toggle (hash is written separately when set).
  useEffect(() => {
    if (!hydrated) return;
    savePasscodeEnabled(passcodeEnabled);
  }, [passcodeEnabled, hydrated]);

  // ── Passcode toggle handler ──────────────────────────────────────
  // Turning ON when no hash exists → open setup modal. The toggle
  // doesn't flip yet — only after the user actually saves the
  // passcode does enabled go true (handled in handlePasscodeSaved).
  const handleTogglePasscode = (next: boolean) => {
    if (next && !passcodeHash) {
      setShowSetup(true);
      return;
    }
    setPasscodeEnabled(next);
  };

  const handlePasscodeSaved = (hash: string) => {
    savePasscodeHash(hash);
    setPasscodeHash(hash);
    setPasscodeEnabled(true);
    setShowSetup(false);
    // Setting a passcode counts as unlocking it for this session —
    // it'd be obnoxious to immediately lock the user out of their own
    // journal right after they confirmed the code.
    markUnlockedThisSession();
    setUnlocked(true);
  };

  // ── Helpers to find / mutate folders ─────────────────────────────
  const findMonth = (id: string) => journal.months.find(m => m.id === id);
  const findWeek  = (mid: string, wid: string) =>
    findMonth(mid)?.weeks.find(w => w.id === wid);
  const findDay   = (mid: string, wid: string, did: string) =>
    findWeek(mid, wid)?.days.find(d => d.id === did);

  const updateMonths = (fn: (months: MonthEntry[]) => MonthEntry[]) => {
    setJournal(j => ({ ...j, months: fn(j.months) }));
  };

  // ── Creation ─────────────────────────────────────────────────────
  const addMonth = () => {
    const cm = currentMonth();
    if (journal.months.some(m => m.id === cm.id)) {
      // Already exists — just navigate into it.
      setView({ kind: 'weeks', monthId: cm.id });
      return;
    }
    const m: MonthEntry = { ...cm, weeks: [], createdAt: new Date().toISOString() };
    updateMonths(ms => [...ms, m]);
    setView({ kind: 'weeks', monthId: m.id });
  };

  const addWeek = (monthId: string) => {
    const cw = currentWeek();
    const m = findMonth(monthId);
    if (m && m.weeks.some(w => w.id === cw.id)) {
      setView({ kind: 'days', monthId, weekId: cw.id });
      return;
    }
    const w: WeekEntry = { ...cw, days: [], createdAt: new Date().toISOString() };
    updateMonths(ms => ms.map(m =>
      m.id === monthId ? { ...m, weeks: [...m.weeks, w] } : m
    ));
    setView({ kind: 'days', monthId, weekId: w.id });
  };

  const addDay = (monthId: string, weekId: string) => {
    const w = findWeek(monthId, weekId);

    // Pick the target date for the new day:
    //   - If the week already has days, the new day defaults to the
    //     next trading day AFTER the most recent existing entry.
    //   - If today is later than (latest + 1 trading day), use today.
    //   - If the week is empty, fall back to today (or the upcoming
    //     Monday on weekends, via nextTradingDay).
    // This kills the old behavior where the "+ NEW DAY" button always
    // landed on today's id — which, on a day that already had an
    // entry, would silently navigate back to it and look like a
    // pre-filled clone of yesterday's content.
    const today = nextTradingDay(new Date());
    let targetDate: Date;
    if (w && w.days.length > 0) {
      const latest = w.days
        .map(d => parseDayIdToDate(d.id))
        .filter((x): x is Date => x !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0];
      if (latest) {
        const dayAfterLatest = nextTradingDayAfter(latest);
        targetDate = today.getTime() > dayAfterLatest.getTime() ? today : dayAfterLatest;
      } else {
        targetDate = today;
      }
    } else {
      targetDate = today;
    }

    const meta = buildDayMeta(targetDate);

    // If a day with the computed id already exists (e.g. you've
    // already filed Tuesday and click + again), navigate to it
    // instead of stacking a duplicate. Same shortcut as before, just
    // keyed on the COMPUTED next-day id rather than today's id.
    if (w && w.days.some(d => d.id === meta.id)) {
      setView({ kind: 'book', monthId, weekId, dayId: meta.id });
      return;
    }

    // Fresh, blank entry. We explicitly list every section field
    // (content / preWeekNote / watchingTomorrow / session) so a
    // future field added to DayEntry can't accidentally inherit
    // from anywhere. No spread of a previous entry; nothing
    // carried over.
    const now = new Date().toISOString();
    const d: DayEntry = {
      id: meta.id,
      label: meta.label,
      content: '',
      preWeekNote: '',
      watchingTomorrow: '',
      session: '',
      aiAnalysisEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    updateMonths(ms => ms.map(m =>
      m.id === monthId
        ? {
            ...m,
            weeks: m.weeks.map(w =>
              w.id === weekId ? { ...w, days: [...w.days, d] } : w
            ),
          }
        : m
    ));
    setView({ kind: 'book', monthId, weekId, dayId: d.id });
  };

  // ── Rename ───────────────────────────────────────────────────────
  const renameMonth = (id: string, label: string) => {
    updateMonths(ms => ms.map(m => m.id === id ? { ...m, label } : m));
  };
  const renameWeek = (mid: string, wid: string, label: string) => {
    updateMonths(ms => ms.map(m => m.id === mid
      ? { ...m, weeks: m.weeks.map(w => w.id === wid ? { ...w, label } : w) }
      : m
    ));
  };
  const renameDay = (mid: string, wid: string, did: string, label: string) => {
    updateMonths(ms => ms.map(m => m.id === mid
      ? {
          ...m,
          weeks: m.weeks.map(w => w.id === wid
            ? { ...w, days: w.days.map(d => d.id === did ? { ...d, label } : d) }
            : w
          ),
        }
      : m
    ));
  };

  // ── Delete handlers ──────────────────────────────────────────────
  const deleteMonth = (id: string) => {
    updateMonths(ms => ms.filter(m => m.id !== id));
  };
  const deleteWeek = (mid: string, wid: string) => {
    updateMonths(ms => ms.map(m => m.id === mid
      ? { ...m, weeks: m.weeks.filter(w => w.id !== wid) }
      : m
    ));
  };
  const deleteDay = (mid: string, wid: string, did: string) => {
    updateMonths(ms => ms.map(m => m.id === mid
      ? {
          ...m,
          weeks: m.weeks.map(w => w.id === wid
            ? { ...w, days: w.days.filter(d => d.id !== did) }
            : w
          ),
        }
      : m
    ));
  };

  // Used by the year-calendar grid to create any month, not just the
  // current one. Trader can backfill past months or pre-create future
  // ones by clicking empty cells.
  const addSpecificMonth = (year: number, monthIdx: number) => {
    const id = `${year}-${pad2(monthIdx + 1)}`;
    if (journal.months.some(m => m.id === id)) {
      setView({ kind: 'weeks', monthId: id });
      return;
    }
    const m: MonthEntry = {
      id,
      label: `${MONTH_NAMES[monthIdx]} ${year}`,
      weeks: [],
      createdAt: new Date().toISOString(),
    };
    updateMonths(ms => [...ms, m]);
    setView({ kind: 'weeks', monthId: id });
  };

  // Active delete confirmation — null when no modal is open.
  type PendingDelete =
    | { kind: 'month'; id: string; label: string }
    | { kind: 'week';  mid: string; wid: string; label: string }
    | { kind: 'day';   mid: string; wid: string; did: string; label: string };
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'month') deleteMonth(pendingDelete.id);
    else if (pendingDelete.kind === 'week') deleteWeek(pendingDelete.mid, pendingDelete.wid);
    else deleteDay(pendingDelete.mid, pendingDelete.wid, pendingDelete.did);
    setPendingDelete(null);
  };

  // ── Year navigation (for the year-calendar month view) ───────────
  const [displayYear, setDisplayYear] = useState(() => new Date().getFullYear());

  // ── Day mutation (content + privacy) ─────────────────────────────
  const updateDay = (mid: string, wid: string, did: string, patch: Partial<DayEntry>) => {
    updateMonths(ms => ms.map(m => m.id === mid
      ? {
          ...m,
          weeks: m.weeks.map(w => w.id === wid
            ? {
                ...w,
                days: w.days.map(d => d.id === did
                  ? { ...d, ...patch, updatedAt: new Date().toISOString() }
                  : d
                ),
              }
            : w
          ),
        }
      : m
    ));
  };

  // ── Render: month / week / day grids ─────────────────────────────

  const renderMonths = () => {
    const todayMonthId = currentMonth().id;
    return (
      <>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 600, color: TEXT_BASE, letterSpacing: 0.5 }}>
            Overall Journal
          </div>
          <div style={{ marginTop: 10, fontFamily: fm, fontSize: 16, color: LABEL, lineHeight: 1.5 }}>
            A folder for every month, week, and day of your trading.
          </div>
          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
            <PasscodeToggle
              enabled={passcodeEnabled}
              hasHash={!!passcodeHash}
              onChange={handleTogglePasscode}
            />
          </div>
        </div>

        {/* Year switcher above the calendar grid */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 32,
          marginBottom: 24,
        }}>
          <YearSwitcher year={displayYear} onChange={setDisplayYear} />
        </div>

        {/* Year-calendar grid — 12 cells, Jan-Dec in chronological
            order, each cell either a real month folder or an empty
            create-me slot. Page IS the calendar. */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}>
          {Array.from({ length: 12 }, (_, monthIdx) => {
            const id = `${displayYear}-${pad2(monthIdx + 1)}`;
            const existing = journal.months.find(m => m.id === id);
            if (existing) {
              return (
                <FolderTile
                  key={id}
                  kind="month"
                  dateRefId={id}
                  label={existing.label}
                  sublabel={`${existing.weeks.length} week${existing.weeks.length === 1 ? '' : 's'}`}
                  onClick={() => setView({ kind: 'weeks', monthId: id })}
                  onRename={(label) => renameMonth(id, label)}
                  onDelete={() => setPendingDelete({ kind: 'month', id, label: existing.label })}
                />
              );
            }
            return (
              <EmptyMonthSlot
                key={id}
                monthIdx={monthIdx}
                year={displayYear}
                isCurrent={id === todayMonthId}
                onCreate={() => addSpecificMonth(displayYear, monthIdx)}
              />
            );
          })}
        </div>
      </>
    );
  };

  const renderWeeks = (monthId: string) => {
    const m = findMonth(monthId);
    if (!m) { setView({ kind: 'months' }); return null; }
    return (
      <>
        <Breadcrumb trail={[
          { label: 'Journal', onClick: () => setView({ kind: 'months' }) },
          { label: m.label },
        ]} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 18,
        }}>
          {m.weeks
            .slice()
            .sort((a, b) => b.id.localeCompare(a.id))
            .map(w => (
              <FolderTile
                key={w.id}
                kind="week"
                dateRefId={w.id}
                label={w.label}
                sublabel={`${w.days.length} day${w.days.length === 1 ? '' : 's'}`}
                onClick={() => setView({ kind: 'days', monthId: m.id, weekId: w.id })}
                onRename={(label) => renameWeek(m.id, w.id, label)}
                onDelete={() => setPendingDelete({ kind: 'week', mid: m.id, wid: w.id, label: w.label })}
              />
            ))}
          <NewTile
            kind="week"
            dateRefId={currentWeek().id}
            label="New Week"
            preview={currentWeek().label}
            onClick={() => addWeek(m.id)}
          />
        </div>
      </>
    );
  };

  const renderDays = (monthId: string, weekId: string) => {
    const m = findMonth(monthId);
    const w = findWeek(monthId, weekId);
    if (!m || !w) { setView({ kind: 'months' }); return null; }
    return (
      <>
        <Breadcrumb trail={[
          { label: 'Journal', onClick: () => setView({ kind: 'months' }) },
          { label: m.label,   onClick: () => setView({ kind: 'weeks',  monthId: m.id }) },
          { label: w.label },
        ]} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 18,
        }}>
          {w.days
            .slice()
            .sort((a, b) => b.id.localeCompare(a.id))
            .map(d => (
              <FolderTile
                key={d.id}
                kind="day"
                dateRefId={d.id}
                label={d.label}
                sublabel={d.content ? 'has entry' : 'empty'}
                onClick={() => setView({ kind: 'book', monthId: m.id, weekId: w.id, dayId: d.id })}
                onRename={(label) => renameDay(m.id, w.id, d.id, label)}
                onDelete={() => setPendingDelete({ kind: 'day', mid: m.id, wid: w.id, did: d.id, label: d.label })}
              />
            ))}
          <NewTile
            kind="day"
            dateRefId={currentDay().id}
            label="New Day"
            preview={currentDay().label}
            onClick={() => addDay(m.id, w.id)}
          />
        </div>
      </>
    );
  };

  const renderBook = (monthId: string, weekId: string, dayId: string) => {
    const d = findDay(monthId, weekId, dayId);
    if (!d) { setView({ kind: 'months' }); return null; }
    return (
      <ClosedBook
        dayLabel={d.label}
        onOpen={() => setView({ kind: 'editor', monthId, weekId, dayId })}
      />
    );
  };

  const renderEditor = (monthId: string, weekId: string, dayId: string) => {
    const m = findMonth(monthId);
    const w = findWeek(monthId, weekId);
    const d = findDay(monthId, weekId, dayId);
    if (!m || !w || !d) { setView({ kind: 'months' }); return null; }
    return (
      <>
        <Breadcrumb trail={[
          { label: 'Journal', onClick: () => setView({ kind: 'months' }) },
          { label: m.label,   onClick: () => setView({ kind: 'weeks',  monthId: m.id }) },
          { label: w.label,   onClick: () => setView({ kind: 'days',   monthId: m.id, weekId: w.id }) },
          { label: d.label },
        ]} />
        <Editor
          day={d}
          onPreWeekChange={(html) => updateDay(m.id, w.id, d.id, { preWeekNote: html })}
          onWatchingChange={(html) => updateDay(m.id, w.id, d.id, { watchingTomorrow: html })}
          onSessionChange={(html) => updateDay(m.id, w.id, d.id, { session: html })}
          onTogglePrivacy={(v) => updateDay(m.id, w.id, d.id, { aiAnalysisEnabled: v })}
        />
      </>
    );
  };

  // Lock-screen gate: when passcode is enabled, hash exists, and the
  // user hasn't unlocked yet this session, render the lock instead of
  // any journal content. The setup modal layers on top of either view
  // (locked or unlocked) and handles its own backdrop.
  const showLock = hydrated && passcodeEnabled && passcodeHash && !unlocked;

  return (
    <ToolPageShell title="Overall Journal" onBack={onBack}>
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
      }}>
        {showLock ? (
          <LockScreen
            expectedHash={passcodeHash!}
            onUnlock={() => setUnlocked(true)}
          />
        ) : (
          <>
            {view.kind === 'months' && renderMonths()}
            {view.kind === 'weeks'  && renderWeeks(view.monthId)}
            {view.kind === 'days'   && renderDays(view.monthId, view.weekId)}
            {view.kind === 'book'   && renderBook(view.monthId, view.weekId, view.dayId)}
            {view.kind === 'editor' && renderEditor(view.monthId, view.weekId, view.dayId)}
          </>
        )}
      </div>
      {showSetup && (
        <PasscodeSetup
          onSave={handlePasscodeSaved}
          onCancel={() => setShowSetup(false)}
        />
      )}
      {pendingDelete && (
        <DeleteConfirmModal
          targetLabel={pendingDelete.label}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </ToolPageShell>
  );
}

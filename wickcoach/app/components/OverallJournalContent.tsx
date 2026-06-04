'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, ChevronRight,
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered,
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
  content: string;
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

// ─── Date helpers ────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad2(n: number): string { return String(n).padStart(2, '0'); }

function currentMonth(): { id: string; label: string } {
  const d = new Date();
  return {
    id: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`,
    label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
  };
}

function currentWeek(): { id: string; label: string } {
  // Monday-anchored, matches startOfWeek in shared.ts
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diff);
  const id = `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
  const label = `Week of ${MONTH_NAMES[monday.getMonth()].slice(0, 3)} ${monday.getDate()}`;
  return { id, label };
}

function currentDay(): { id: string; label: string } {
  const d = new Date();
  const id = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const label = `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  return { id, label };
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

// ─── Folder tile (Month/Week/Day) ────────────────────────────────────

function FolderTile({
  label, sublabel, onClick, onRename,
}: {
  label: string;
  sublabel?: string;
  onClick: () => void;
  onRename?: (newLabel: string) => void;
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
      onDoubleClick={(e) => {
        if (!onRename) return;
        e.stopPropagation();
        setDraft(label);
        setEditing(true);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardSurface,
        background: hover && !editing
          ? `linear-gradient(180deg, ${SURFACE_HI} 0%, ${SURFACE_TOP} 100%)`
          : cardSurface.background,
        border: hover && !editing ? `1px solid rgba(0,212,160,0.3)` : `1px solid ${BORDER}`,
        padding: 24,
        minHeight: 120,
        cursor: editing ? 'text' : 'pointer',
        transition: 'border-color 0.2s ease, background 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
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
              background: 'rgba(6,8,12,0.6)',
              border: `1px solid ${teal}`,
              borderRadius: 6,
              color: TEXT_BASE,
              fontFamily: fd,
              fontSize: 18,
              fontWeight: 600,
              padding: '6px 10px',
              outline: 'none',
            }}
          />
        ) : (
          <div style={{
            fontFamily: fd,
            fontSize: 18,
            fontWeight: 600,
            color: TEXT_BASE,
            letterSpacing: 0.3,
          }}>
            {label}
          </div>
        )}
        {!editing && (
          <ChevronRight size={18} color={hover ? teal : LABEL} style={{ flexShrink: 0 }} />
        )}
      </div>

      {sublabel && !editing && (
        <div style={{ fontFamily: fm, fontSize: 13, color: LABEL, marginTop: 12 }}>
          {sublabel}
        </div>
      )}

      {onRename && hover && !editing && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          right: 14,
          fontFamily: fm,
          fontSize: 11,
          color: LABEL,
          opacity: 0.7,
          letterSpacing: 0.3,
        }}>
          double-click to rename
        </div>
      )}
    </div>
  );
}

// ─── "New X" tile ────────────────────────────────────────────────────

function NewTile({ label, onClick }: { label: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(0,212,160,0.08)' : 'transparent',
        border: `2px dashed ${hover ? teal : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 16,
        padding: 24,
        minHeight: 120,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        transition: 'border-color 0.2s ease, background 0.2s ease',
      }}
    >
      <Plus size={28} color={hover ? teal : LABEL} strokeWidth={1.75} />
      <div style={{
        fontFamily: fd,
        fontSize: 14,
        fontWeight: 600,
        color: hover ? teal : LABEL,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
      }}>
        {label}
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
                fontSize: 14,
                fontWeight: 500,
                color: isLast ? TEXT_BASE : LABEL,
                cursor: node.onClick ? 'pointer' : 'default',
                textTransform: 'uppercase',
                letterSpacing: 1,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => { if (node.onClick) (e.currentTarget as HTMLElement).style.color = teal; }}
              onMouseLeave={(e) => { if (node.onClick) (e.currentTarget as HTMLElement).style.color = LABEL; }}
            >
              {node.label}
            </span>
            {!isLast && <ChevronRight size={14} color={LABEL} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Closed book (the opening animation) ─────────────────────────────

function ClosedBook({ dayLabel, onOpen }: { dayLabel: string; onOpen: () => void }) {
  const [opening, setOpening] = useState(false);

  const handleClick = () => {
    if (opening) return;
    setOpening(true);
    // Animation duration matches the CSS transition below.
    setTimeout(onOpen, 700);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: '60px 20px',
      perspective: 1400,
    }}>
      <div
        onClick={handleClick}
        style={{
          position: 'relative',
          width: 320,
          height: 440,
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
          borderRadius: 10,
          boxShadow: `
            0 30px 60px -12px rgba(0,0,0,0.85),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset -8px 0 16px rgba(0,0,0,0.4)
          `,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Top accent band */}
          <div style={{
            position: 'absolute',
            top: 24,
            left: 24,
            right: 24,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${teal}, transparent)`,
            opacity: 0.6,
          }} />

          {/* Spine seam on the left */}
          <div style={{
            position: 'absolute',
            top: 16,
            bottom: 16,
            left: 10,
            width: 2,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 2,
          }} />

          <div style={{ flex: 1 }} />

          {/* Stickman logo — the actual WickCoach mark */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <MiniStickFigure size={96} />
          </div>

          {/* Wordmark */}
          <div style={{
            fontFamily: fd,
            fontSize: 26,
            fontWeight: 700,
            color: TEXT_BASE,
            letterSpacing: 4,
            textAlign: 'center',
            lineHeight: 1.2,
          }}>
            WICKCOACH
          </div>

          <div style={{
            marginTop: 8,
            fontFamily: fm,
            fontSize: 11,
            color: LABEL,
            letterSpacing: 2.5,
            textTransform: 'uppercase',
          }}>
            Journal
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              fontFamily: fm,
              fontSize: 13,
              color: LABEL,
              fontStyle: 'italic',
            }}>
              {dayLabel}
            </div>
          </div>

          {/* Bottom accent band */}
          <div style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${teal}, transparent)`,
            opacity: 0.6,
          }} />
        </div>
      </div>

      <div style={{
        fontFamily: fd,
        fontSize: 13,
        fontWeight: 600,
        color: opening ? 'transparent' : LABEL,
        textTransform: 'uppercase',
        letterSpacing: 2,
        transition: 'color 0.3s ease',
      }}>
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

function Toolbar({
  editorRef,
  currentFont, setCurrentFont,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  currentFont: string;
  setCurrentFont: (v: string) => void;
}) {
  // execCommand wrapper that re-focuses the editor first so commands
  // apply to the selection rather than failing silently.
  const cmd = (command: string, value?: string) => {
    editorRef.current?.focus();
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
      {/* Font picker */}
      <select
        value={currentFont}
        onMouseDown={(e) => e.preventDefault()}
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
        onMouseDown={(e) => e.preventDefault()}
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

function Editor({ day, onContentChange, onTogglePrivacy }: {
  day: DayEntry;
  onContentChange: (html: string) => void;
  onTogglePrivacy: (v: boolean) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentFont, setCurrentFont] = useState(FONT_SERIF);

  // Set initial HTML once on mount and whenever the day id changes.
  // Doing it imperatively (instead of via React's dangerouslySetInnerHTML)
  // avoids React wiping the user's caret/selection on every re-render.
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== day.content) {
      editorRef.current.innerHTML = day.content || '';
    }
  }, [day.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedSave = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (debouncedSave.current) clearTimeout(debouncedSave.current);
    debouncedSave.current = setTimeout(() => onContentChange(html), 600);
  }, [onContentChange]);

  // Set default font on first focus so a blank journal starts in serif.
  const setDefaultFont = () => {
    document.execCommand('fontName', false, FONT_SERIF);
  };

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
          fontSize: 16,
          fontWeight: 500,
          color: LABEL,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        }}>
          {day.label}
        </div>
      </div>

      <Toolbar
        editorRef={editorRef}
        currentFont={currentFont}
        setCurrentFont={setCurrentFont}
      />

      {/* Lined paper journal surface */}
      <div style={{
        ...cardSurface,
        padding: '32px 40px',
        minHeight: 600,
      }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          onFocus={(e) => {
            // Seed default font only if the editor is empty.
            if (e.currentTarget.innerHTML === '' || e.currentTarget.innerHTML === '<br>') {
              setDefaultFont();
            }
          }}
          style={{
            outline: 'none',
            color: TEXT_BASE,
            fontFamily: currentFont,
            fontSize: 16,
            lineHeight: '32px',
            // Lined paper: one faint horizontal rule every 32px so text
            // sits on the lines like a real journal.
            backgroundImage:
              'linear-gradient(to bottom, transparent 0, transparent 31px, rgba(160,163,171,0.18) 31px, rgba(160,163,171,0.18) 32px)',
            backgroundSize: '100% 32px',
            backgroundAttachment: 'local',
            minHeight: 540,
            cursor: 'text',
          }}
        />
      </div>

      <div style={{
        marginTop: 14,
        fontFamily: fm,
        fontSize: 12,
        color: LABEL,
        textAlign: 'right',
      }}>
        Auto-saved · last edited {new Date(day.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}

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

  // Initial load (client-only — localStorage is undefined during SSR).
  // The hydrated flag is critical: without it, the save effect below
  // fires on initial mount with the empty default state and overwrites
  // whatever's in storage *before* this load effect's setJournal
  // update is applied. Next.js dev strict-mode double-invokes effects,
  // so the second pass would then read the empty value back. Net
  // result: data loss on every page refresh.
  useEffect(() => {
    setJournal(loadJournal());
    setHydrated(true);
  }, []);

  // Persist on every change — but only after hydration, so we never
  // write the empty default state over real saved data.
  useEffect(() => {
    if (!hydrated) return;
    saveJournal(journal);
  }, [journal, hydrated]);

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
    const cd = currentDay();
    const w = findWeek(monthId, weekId);
    if (w && w.days.some(d => d.id === cd.id)) {
      setView({ kind: 'book', monthId, weekId, dayId: cd.id });
      return;
    }
    const now = new Date().toISOString();
    const d: DayEntry = {
      ...cd,
      content: '',
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

  const renderMonths = () => (
    <>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 600, color: TEXT_BASE, letterSpacing: 0.5 }}>
          Overall Journal
        </div>
        <div style={{ marginTop: 10, fontFamily: fm, fontSize: 16, color: LABEL, lineHeight: 1.5 }}>
          A folder for every month, week, and day of your trading.
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 18,
      }}>
        {journal.months
          .slice()
          .sort((a, b) => b.id.localeCompare(a.id))
          .map(m => (
            <FolderTile
              key={m.id}
              label={m.label}
              sublabel={`${m.weeks.length} week${m.weeks.length === 1 ? '' : 's'}`}
              onClick={() => setView({ kind: 'weeks', monthId: m.id })}
              onRename={(label) => renameMonth(m.id, label)}
            />
          ))}
        <NewTile label="New Month" onClick={addMonth} />
      </div>
    </>
  );

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
                label={w.label}
                sublabel={`${w.days.length} day${w.days.length === 1 ? '' : 's'}`}
                onClick={() => setView({ kind: 'days', monthId: m.id, weekId: w.id })}
                onRename={(label) => renameWeek(m.id, w.id, label)}
              />
            ))}
          <NewTile label="New Week" onClick={() => addWeek(m.id)} />
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
                label={d.label}
                sublabel={d.content ? 'has entry' : 'empty'}
                onClick={() => setView({ kind: 'book', monthId: m.id, weekId: w.id, dayId: d.id })}
                onRename={(label) => renameDay(m.id, w.id, d.id, label)}
              />
            ))}
          <NewTile label="New Day" onClick={() => addDay(m.id, w.id)} />
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
          onContentChange={(html) => updateDay(m.id, w.id, d.id, { content: html })}
          onTogglePrivacy={(v) => updateDay(m.id, w.id, d.id, { aiAnalysisEnabled: v })}
        />
      </>
    );
  };

  return (
    <ToolPageShell title="Overall Journal" onBack={onBack}>
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
      }}>
        {view.kind === 'months' && renderMonths()}
        {view.kind === 'weeks'  && renderWeeks(view.monthId)}
        {view.kind === 'days'   && renderDays(view.monthId, view.weekId)}
        {view.kind === 'book'   && renderBook(view.monthId, view.weekId, view.dayId)}
        {view.kind === 'editor' && renderEditor(view.monthId, view.weekId, view.dayId)}
      </div>
    </ToolPageShell>
  );
}

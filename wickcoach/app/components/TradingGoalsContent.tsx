'use client';
import React, { useState, useEffect, useRef } from "react";
import { fm, fd, teal, Trade, Goal, GoalScoringCriteria, GOAL_TYPES, getDefaultGoals, getCurrentWeekStart, getAllWeekStarts, formatWeekRange, readAllGoals, writeAllGoals, startOfWeek, toISODate, buildGoalsContext, buildProfileContext, buildTraderStats, QuantitativeTarget, QuantTargetType, readQuantTargets, updateQuantTarget, addCustomQuantTarget, removeCustomQuantTarget } from "./shared";
import { MiniStickFigure } from "./Logo";

export default function TradingGoalsContent({ trades, onMessageSent, weeklyTabResetTick = 0 }: { trades: Trade[]; onMessageSent?: (inputRect: DOMRect) => void; weeklyTabResetTick?: number }) {
  // trades is used in AI context payloads below
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeView, setActiveView] = useState<'weekly' | 'monthly' | 'behavioral'>('weekly');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [contextInputs, setContextInputs] = useState<Record<string, string>>({});
  const [loadingGoalId, setLoadingGoalId] = useState<string | null>(null);
  const [hoveredGoalId, setHoveredGoalId] = useState<string | null>(null);
  const [hoveredContextBtn, setHoveredContextBtn] = useState<string | null>(null);
  const [loggingGoalId, setLoggingGoalId] = useState<string | null>(null);
  const [hoveredAddBtn, setHoveredAddBtn] = useState(false);

  // ── Weekly goal history ─────────────────────────────────────
  // viewedWeekStart === null → the current Monday. Anything else
  // means the user is looking at a past week in read-only mode.
  const [viewedWeekStart, setViewedWeekStart] = useState<string | null>(null);
  const [copyModal, setCopyModal] = useState<{ sourceWeekStart: string; sourceGoals: Goal[] } | null>(null);
  const [copyMode, setCopyMode] = useState<'append' | 'replace' | 'cancel'>('append');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };
  // Whenever the parent increments this tick (user clicks the "Weekly
  // Goals" tab in the main nav) snap back to the current week.
  useEffect(() => {
    setViewedWeekStart(null);
    setExpandedGoalId(null);
  }, [weeklyTabResetTick]);

  const currentWeekStart = getCurrentWeekStart();
  const activeWeekStart = viewedWeekStart || currentWeekStart;
  const isReadOnly = viewedWeekStart !== null && viewedWeekStart !== currentWeekStart;
  const visibleGoals = goals.filter(g => g.weekStart === activeWeekStart);

  // Sidebar HISTORY list: unique week starts seen in stored goals plus
  // the current week (so it's always present even when empty), sorted
  // descending and capped to 12.
  const historyWeekStarts = (() => {
    const set = new Set<string>(goals.map(g => g.weekStart).filter(Boolean));
    set.add(currentWeekStart);
    return Array.from(set).sort((a, b) => b.localeCompare(a)).slice(0, 12);
  })();

  // Psychology vs Numerical toggle + quantitative-target state
  const [goalMode, setGoalMode] = useState<'psychology' | 'numerical'>('psychology');
  const [quantTargets, setQuantTargets] = useState<QuantitativeTarget[]>([]);
  const [customTargets, setCustomTargets] = useState<QuantitativeTarget[]>([]);
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newCustomType, setNewCustomType] = useState<QuantTargetType>('number');
  const refreshQuantTargets = () => {
    const r = readQuantTargets();
    setQuantTargets(r.quantitativeTargets);
    setCustomTargets(r.customQuantTargets);
  };
  useEffect(() => { refreshQuantTargets(); }, []);

  const handleQuantValueChange = (id: string, raw: string) => {
    const n = raw.trim() === '' ? null : Number(raw);
    const finalValue = n === null || Number.isNaN(n) ? null : n;
    updateQuantTarget(id, finalValue);
    refreshQuantTargets();
  };
  const handleAddCustomTarget = () => {
    const label = newCustomLabel.trim();
    if (!label) return;
    addCustomQuantTarget(label, newCustomType);
    setNewCustomLabel('');
    setNewCustomType('number');
    refreshQuantTargets();
  };
  const handleRemoveCustomTarget = (id: string) => {
    removeCustomQuantTarget(id);
    refreshQuantTargets();
  };
  const chatEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // trades is now threaded into AI context payloads below

  useEffect(() => {
    // Self-healing migration: any stored goal missing weekStart gets
    // stamped with the current week's Monday, then persisted. This is
    // a one-time upgrade so pre-history-feature data lands in the
    // current week's bucket instead of vanishing.
    const stamp = getCurrentWeekStart();
    const stored = readAllGoals();
    let working: Goal[];
    if (stored.length > 0) {
      let changed = false;
      working = stored.map((g: Goal) => {
        const next: Goal = { ...g, actionItems: g.actionItems || [], goalType: g.goalType || 'General', weekStart: g.weekStart || stamp };
        if (!g.weekStart) changed = true;
        return next;
      });
      if (changed) writeAllGoals(working);
    } else {
      working = getDefaultGoals();
      writeAllGoals(working);
    }

    // One-time seed of LAST week's history so the HISTORY sidebar has
    // something to click right after upgrading. Gated on a dedicated
    // localStorage flag so deleting the seed goals doesn't re-create
    // them. The flag is specific to this feature — no collision with
    // any other migration.
    try {
      const SEED_FLAG = 'wickcoach_seeded_last_week_v1';
      if (!localStorage.getItem(SEED_FLAG)) {
        const lastWeekStart = toISODate(new Date(startOfWeek(new Date()).getTime() - 7 * 86400000));
        const alreadyHasLastWeek = working.some(g => g.weekStart === lastWeekStart);
        if (!alreadyHasLastWeek) {
          const nowIso = new Date().toISOString();
          const seedLast: Goal[] = [
            { id: `seed_${lastWeekStart}_1`, title: 'SAMPLE — LAST WEEK RISK CAP AT 1R', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: nowIso, goalType: 'Risk Management',  weekStart: lastWeekStart },
            { id: `seed_${lastWeekStart}_2`, title: 'SAMPLE — CONFIRM 5M BEFORE ENTRY',  context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: nowIso, goalType: 'Entry Criteria',   weekStart: lastWeekStart },
            { id: `seed_${lastWeekStart}_3`, title: 'SAMPLE — WAIT FOR PULLBACK TO 20MA', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: nowIso, goalType: 'Patience / Setup', weekStart: lastWeekStart },
          ];
          working = [...working, ...seedLast];
          writeAllGoals(working);
        }
        localStorage.setItem(SEED_FLAG, '1');
      }
    } catch { /* ignore storage errors */ }

    setGoals(working);
  }, []);

  useEffect(() => {
    if (goals.length > 0) writeAllGoals(goals);
  }, [goals]);

  useEffect(() => {
    if (expandedGoalId) {
      chatEndRefs.current[expandedGoalId]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [goals, expandedGoalId, loadingGoalId]);

  const addNewGoal = () => {
    if (isReadOnly) return;
    const newGoal: Goal = {
      id: `g${Date.now()}`,
      title: '',
      context: [],
      aiResponses: [],
      contextComplete: false,
      actionItems: [],
      createdAt: new Date().toISOString(),
      goalType: 'General',
      weekStart: currentWeekStart,
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoalTitle = (id: string, title: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, title } : g));
  };

  const cycleGoalType = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const currentIdx = GOAL_TYPES.indexOf(g.goalType);
      const nextIdx = (currentIdx + 1) % GOAL_TYPES.length;
      return { ...g, goalType: GOAL_TYPES[nextIdx] };
    }));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (expandedGoalId === id) setExpandedGoalId(null);
  };

  const clearGoalContext = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, context: [], aiResponses: [], contextComplete: false, actionItems: [], completeness: undefined, scoringCriteria: undefined } : g));
  };

  const handleTextareaGrow = (e: React.ChangeEvent<HTMLTextAreaElement>, goalId: string) => {
    setContextInputs(prev => ({ ...prev, [goalId]: e.target.value }));
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const sendGoalContext = async (goalId: string) => {
    const input = contextInputs[goalId]?.trim();
    if (!input || loadingGoalId) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedContext = [...goal.context, input];
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, context: updatedContext } : g));
    setContextInputs(prev => ({ ...prev, [goalId]: '' }));
    setLoadingGoalId(goalId);

    const textareaEl = textareaRefs.current[goalId];
    if (textareaEl && onMessageSent) {
      onMessageSent(textareaEl.getBoundingClientRect());
    }

    const messages: { role: string; content: string }[] = [];
    for (let i = 0; i < updatedContext.length; i++) {
      messages.push({ role: 'user', content: updatedContext[i] });
      if (goal.aiResponses[i]) messages.push({ role: 'assistant', content: goal.aiResponses[i] });
    }

    const goalsContext = updatedContext.join(' | ');
    const exchangeNumber = updatedContext.length;

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          goalsContext,                              // clarification thread for THIS goal
          allGoalsContext: buildGoalsContext(),      // every goal the trader has set, for awareness
          tradesContext: buildTraderStats(trades),   // so the bot can reference actual trades
          profileContext: buildProfileContext(),
          mode: 'goals',
          goalTitle: goal.title,
          exchangeNumber,
        })
      });
      const data = await res.json();
      const aiReply: string = data.reply;
      const meta = data.metadata as { completeness?: number; scoring_criteria?: GoalScoringCriteria } | null;
      const completeness = typeof meta?.completeness === 'number' ? meta.completeness : undefined;
      const scoringCriteria = meta?.scoring_criteria;
      setGoals(prev => {
        const next = prev.map(g => g.id === goalId ? {
          ...g,
          context: updatedContext,
          aiResponses: [...g.aiResponses, aiReply],
          ...(completeness !== undefined ? { completeness } : {}),
          ...(scoringCriteria ? { scoringCriteria } : {}),
        } : g);
        const profileData = JSON.parse(localStorage.getItem('wickcoach_trader_profile') || '{"goalContexts":[],"totalExchanges":0}');
        profileData.goalContexts = next.filter(g => g.context.length > 0).map(g => ({
          goalTitle: g.title,
          exchanges: g.context.map((c, i) => ({ user: c, ai: g.aiResponses[i] || '' })),
          actionItems: g.actionItems || [],
          complete: g.contextComplete,
          completeness: g.completeness,
          scoringCriteria: g.scoringCriteria,
        }));
        profileData.totalExchanges = profileData.goalContexts.reduce((sum: number, g: { exchanges: unknown[] }) => sum + g.exchanges.length, 0);
        profileData.lastUpdated = new Date().toISOString();
        localStorage.setItem('wickcoach_trader_profile', JSON.stringify(profileData));
        return next;
      });
    } catch {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, context: updatedContext, aiResponses: [...g.aiResponses, 'Failed to connect to WickCoach.'] } : g));
    }
    setLoadingGoalId(null);
  };

  const handleLogAndExit = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    setLoggingGoalId(goalId);

    let thread = '';
    for (let i = 0; i < goal.context.length; i++) {
      thread += `User: ${goal.context[i]}\n`;
      if (goal.aiResponses[i]) thread += `WickCoach: ${goal.aiResponses[i]}\n`;
    }

    // The system prompt (mode: 'actionItems') carries all the format/shape
    // rules — the user message just hands over the conversation context.
    const actionPrompt = `Conversation about the trader's goal "${goal.title}":\n\n${thread}`;

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: actionPrompt }],
          mode: 'actionItems',
          profileContext: buildProfileContext(),
        })
      });
      const data = await res.json();
      const reply: string = data.reply || '';
      const items = reply.split('\n').map((line: string) => line.replace(/^\d+\.\s*/, '').trim()).filter((line: string) => line.length > 0).slice(0, 3);
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, contextComplete: true, actionItems: items } : g));
    } catch {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, contextComplete: true, actionItems: [] } : g));
    }

    setLoggingGoalId(null);
    setExpandedGoalId(null);
  };

  const isReadyToLog = (g: Goal) => g.completeness === 100;

  const getProgressPercent = (g: Goal) => Math.max(0, Math.min(100, g.completeness ?? 0));

  // HISTORY section collapse state. Starts expanded so the user sees
  // the list on first load.
  const [historyOpen, setHistoryOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)', fontFamily: fm, background: 'transparent' }}>
      {/* ═══ LEFT SIDEBAR ═══ */}
      <div style={{ width: 220, background: '#141822', borderRight: '1px solid #2A3143', padding: '28px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ fontFamily: fm, fontSize: 13, color: '#7a7d85', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Navigation</div>
        <div style={{ fontFamily: fm, fontSize: 15, color: teal, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 18 }}>Goals Hierarchy</div>
        <div style={{ height: 1, background: '#2a2b32', marginBottom: 20 }} />

        {(['weekly', 'monthly', 'behavioral'] as const).map(v => {
          const isActive = activeView === v;
          const label = v === 'weekly' ? 'Weekly Goals' : v === 'monthly' ? 'Monthly Goals' : 'Behavioral';
          return (
            <div
              key={v}
              onClick={() => {
                setActiveView(v);
                // Clicking the Weekly Goals hierarchy item also snaps
                // the view back to the current week.
                if (v === 'weekly') setViewedWeekStart(null);
              }}
              style={{
                padding: '12px 14px',
                marginBottom: 4,
                borderRadius: 6,
                cursor: 'pointer',
                background: isActive ? '#1a1f2a' : 'transparent',
                borderLeft: isActive ? `3px solid ${teal}` : '3px solid transparent',
                color: isActive ? '#ffffff' : '#9ca0ab',
                fontSize: 15,
                fontFamily: fm,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{label}</span>
              {isActive && <span style={{ color: teal, fontSize: 13 }}>›</span>}
            </div>
          );
        })}

        {/* ═══ HISTORY — collapsible, header acts as toggle ═══ */}
        {activeView === 'weekly' && (
          <>
            <div style={{ height: 1, background: '#2a2b32', margin: '24px 0 12px' }} />
            <div
              onClick={() => setHistoryOpen(o => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontFamily: fm,
                fontSize: 15,
                color: teal,
                textTransform: 'uppercase',
                letterSpacing: 2,
                fontWeight: 700,
                padding: '6px 0',
                marginBottom: historyOpen ? 10 : 0,
                userSelect: 'none',
              }}
            >
              <span>History</span>
              <span style={{ fontSize: 13, color: teal, transition: 'transform 0.15s ease', display: 'inline-block', transform: historyOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
            </div>
            {historyOpen && historyWeekStarts.map(ws => {
              const isCurrent = ws === currentWeekStart;
              const isActive = (viewedWeekStart === null && isCurrent) || viewedWeekStart === ws;
              const label = formatWeekRange(ws) + (isCurrent ? ' (current)' : '');
              return (
                <div
                  key={ws}
                  onClick={() => setViewedWeekStart(isCurrent ? null : ws)}
                  style={{
                    padding: '10px 14px',
                    marginBottom: 4,
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isActive ? '#1a1f2a' : 'transparent',
                    borderLeft: isActive ? `3px solid ${teal}` : '3px solid transparent',
                    color: isActive ? (isCurrent ? teal : '#ffffff') : (isCurrent ? teal : '#9ca0ab'),
                    fontSize: 13,
                    fontFamily: fm,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    letterSpacing: 0.3,
                  }}
                >
                  <span>{label}</span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ flex: 1, padding: '40px 36px 32px', overflowY: 'auto' }}>
        {/* Past-week banner + Copy button — only when viewing a locked past week */}
        {isReadOnly && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 14px', marginBottom: 24, borderBottom: '1px solid #1a1b22', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: fm, fontSize: 12, color: '#7a7d85', letterSpacing: 0.3 }}>
              Viewing goals from {formatWeekRange(activeWeekStart)} — locked history
            </span>
            {visibleGoals.length > 0 && (
              <span
                onClick={() => { setCopyMode('append'); setCopyModal({ sourceWeekStart: activeWeekStart, sourceGoals: visibleGoals }); }}
                style={{
                  fontFamily: fm,
                  fontSize: 11,
                  color: teal,
                  border: `1px solid ${teal}`,
                  borderRadius: 999,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  background: 'transparent',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,160,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >Copy to Current Week</span>
            )}
          </div>
        )}
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: fd, fontSize: 28, color: '#ffffff', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
                {activeView === 'weekly' ? 'Weekly Goals' : activeView === 'monthly' ? 'Monthly Goals' : 'Behavioral'}
              </h2>
              <p style={{ fontFamily: fm, fontSize: 14, color: '#888', margin: '8px 0 0' }}>
                {goalMode === 'psychology'
                  ? 'Active behavioral and technical parameters for the current week.'
                  : 'Quantitative targets for the current week. What numbers are you aiming for?'}
              </p>
            </div>
            {/* Psychology / Numerical toggle */}
            {activeView === 'weekly' && (
              <div style={{ display: 'inline-flex', background: '#0f1318', border: '1px solid #2A3143', borderRadius: 999, padding: 3, marginTop: 4 }}>
                {(['psychology', 'numerical'] as const).map(m => {
                  const active = goalMode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setGoalMode(m)}
                      style={{
                        padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
                        fontFamily: fm, fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
                        background: active ? teal : 'transparent',
                        color: active ? '#0A0D14' : '#aab0bd',
                        transition: 'all 0.2s ease',
                      }}
                    >{m}</button>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: teal }} />
            <span style={{ fontFamily: fm, fontSize: 13, color: teal }}>
              {goalMode === 'psychology'
                ? `${visibleGoals.length} Active Rule${visibleGoals.length !== 1 ? 's' : ''}`
                : `${[...quantTargets, ...customTargets].filter(t => t.value !== null).length} / ${quantTargets.length + customTargets.length} targets set`}
            </span>
          </div>
        </div>

        {/* ═══ GOAL CARDS (Psychology view) ═══ */}
        {goalMode === 'psychology' && isReadOnly && visibleGoals.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#7a7d85', fontFamily: fm, fontSize: 12, border: '1px dashed #1a1b22', borderRadius: 8, backgroundColor: '#13141a' }}>
            No goals were set for this week.
          </div>
        )}
        {goalMode === 'psychology' && visibleGoals.map((g, idx) => {
          const isExpanded = expandedGoalId === g.id;
          return (
            <div key={g.id} style={{
              background: '#1f2430',
              border: isExpanded ? '1px solid rgba(0,212,160,0.5)' : '1px solid #2A3143',
              borderRadius: 12,
              padding: '24px 28px',
              marginBottom: 16,
              boxShadow: isExpanded
                ? '0 0 15px rgba(0,212,160,0.18), 0 0 30px rgba(0,212,160,0.06)'
                : '0 2px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
            }}>
              {/* Top row: number + title area + context button + delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Green numbered circle */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `2px solid ${teal}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: teal, fontFamily: fm, lineHeight: 1 }}>{idx + 1}</span>
                </div>

                {/* Title + TYPE tag */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isReadOnly ? (
                    <div style={{ width: '100%', color: '#ffffff', fontFamily: fd, fontSize: 16, fontWeight: 700, letterSpacing: 1, padding: '2px 0', textTransform: 'uppercase' }}>
                      {g.title || '—'}
                    </div>
                  ) : (
                    <input
                      value={g.title}
                      onChange={e => updateGoalTitle(g.id, e.target.value.toUpperCase())}
                      placeholder="TYPE YOUR GOAL HERE..."
                      onMouseEnter={() => setHoveredGoalId(g.id)}
                      onMouseLeave={() => setHoveredGoalId(null)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: hoveredGoalId === g.id ? '1px dashed #2a2b32' : '1px solid transparent',
                        outline: 'none',
                        color: '#ffffff',
                        fontFamily: fd,
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: 1,
                        cursor: 'text',
                        padding: '2px 0',
                        textTransform: 'uppercase',
                        transition: 'border-color 0.15s ease',
                      }}
                    />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span
                      onClick={isReadOnly ? undefined : () => cycleGoalType(g.id)}
                      style={{
                        fontFamily: fm,
                        fontSize: 11,
                        fontWeight: 700,
                        color: teal,
                        background: 'rgba(0,212,160,0.18)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        letterSpacing: 1,
                        cursor: isReadOnly ? 'default' : 'pointer',
                        userSelect: 'none',
                      }}
                    >TYPE</span>
                    <span style={{ fontFamily: fm, fontSize: 13, color: '#888' }}>{g.goalType}</span>
                  </div>

                  {/* Action items below type tag */}
                  {g.contextComplete && g.actionItems.length > 0 && !isExpanded && (
                    <div style={{ marginTop: 10 }}>
                      {g.actionItems.map((item, i) => (
                        <div key={i} style={{ fontFamily: fm, fontSize: 14, color: teal, lineHeight: 1.7, marginBottom: 2 }}>
                          ↳ {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Context button area — hidden in read-only past-week view */}
                {!isReadOnly && (
                <div
                  onClick={() => setExpandedGoalId(isExpanded ? null : g.id)}
                  onMouseEnter={() => setHoveredContextBtn(g.id)}
                  onMouseLeave={() => setHoveredContextBtn(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #2a2b32',
                    background: hoveredContextBtn === g.id ? 'rgba(0,212,160,0.06)' : '#13141a',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {/* Hover tooltip — explains why context makes WickCoach smarter */}
                  {hoveredContextBtn === g.id && !isExpanded && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: 8,
                        background: '#FCD34D',
                        color: '#000',
                        padding: '12px 16px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontFamily: 'DM Mono, monospace',
                        maxWidth: 280,
                        width: 'max-content',
                        lineHeight: 1.5,
                        zIndex: 50,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        pointerEvents: 'none',
                      }}
                    >
                      The more context you give, the smarter WickCoach gets at scoring your trades against this goal. Be specific about what this rule means to you and what violation looks like.
                    </div>
                  )}
                  <MiniStickFigure size={28} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 12,
                      color: g.contextComplete ? teal : (hoveredContextBtn === g.id ? teal : '#9ca3af'),
                      fontFamily: fm,
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s ease',
                    }}>
                      {g.contextComplete ? 'context provided ✓' : 'click to give context'}
                    </span>
                    {g.contextComplete && (
                      <span
                        onClick={e => { e.stopPropagation(); setExpandedGoalId(isExpanded ? null : g.id); }}
                        style={{ fontSize: 10, color: hoveredContextBtn === g.id ? teal : '#6b7280', cursor: 'pointer', fontFamily: fm, marginTop: 2, transition: 'color 0.15s ease' }}
                      >view / edit</span>
                    )}
                  </div>
                </div>
                )}

                {/* Delete button — hidden in read-only past-week view */}
                {!isReadOnly && (
                  <span
                    onClick={() => deleteGoal(g.id)}
                    style={{ fontSize: 16, color: '#3a3d48', cursor: 'pointer', lineHeight: 1, flexShrink: 0, marginLeft: 4, padding: '4px' }}
                    title="Delete goal"
                  >✕</span>
                )}
              </div>

              {/* ═══ Expanded Chat Area ═══ */}
              {isExpanded && (
                <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
                  <div style={{ flex: 2 }} />
                  <div style={{
                    flex: 1,
                    background: '#0a0b0f',
                    border: '1px solid #2A3143',
                    borderRadius: 8,
                    padding: 14,
                    minHeight: 450,
                    maxHeight: 500,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* Progress bar */}
                    <div style={{ height: 3, background: '#2A3143', borderRadius: 2, marginBottom: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ width: `${getProgressPercent(g)}%`, height: '100%', background: teal, borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                    {g.contextComplete && (
                      <div style={{ fontSize: 11, color: teal, fontFamily: fm, marginBottom: 8, fontWeight: 600, flexShrink: 0 }}>Context provided ✓</div>
                    )}

                    {/* iMessage-style chat thread */}
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8, minHeight: 300, backgroundImage: 'radial-gradient(rgba(0,212,160,0.18) 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
                      {g.context.map((msg, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                            <div style={{ maxWidth: '80%', fontFamily: fm, fontSize: 14, color: '#e8e8f0', lineHeight: 1.6, background: '#2a2b32', borderRadius: '16px 16px 4px 16px', padding: '12px 16px' }}>{msg}</div>
                          </div>
                          {g.aiResponses[i] && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                              <div style={{ maxWidth: '80%', fontFamily: fm, fontSize: 14, color: teal, lineHeight: 1.6, background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.2)', borderRadius: '16px 16px 16px 4px', padding: '12px 16px' }}>
                                {g.aiResponses[i].split('\n').filter((ln: string) => ln.trim()).map((ln: string, li: number) => {
                                  const isBullet = /^[•\-\d]/.test(ln.trim());
                                  return <div key={li} style={{ marginBottom: 8, paddingLeft: isBullet ? 16 : 0 }}>{ln.trim()}</div>;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {loadingGoalId === g.id && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontFamily: fm, fontSize: 14, color: teal, background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.2)', borderRadius: '16px 16px 16px 4px', padding: '12px 16px' }}>
                            <span style={{ animation: 'blink 1s step-end infinite' }}>...</span>
                          </div>
                        </div>
                      )}
                      <div ref={el => { chatEndRefs.current[g.id] = el; }} />
                    </div>

                    {/* Textarea input */}
                    {!g.contextComplete && (
                      <div style={{ flexShrink: 0 }}>
                        <textarea
                          ref={el => { textareaRefs.current[g.id] = el; }}
                          value={contextInputs[g.id] || ''}
                          onChange={e => handleTextareaGrow(e, g.id)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGoalContext(g.id); } }}
                          placeholder={isReadyToLog(g) ? 'Add more or click Log & Exit...' : 'Why does this rule matter to you?'}
                          rows={1}
                          style={{ width: '100%', background: '#141822', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 8, padding: '12px 16px', color: '#ffffff', fontFamily: fm, fontSize: 15, outline: 'none', boxSizing: 'border-box', minHeight: 44, maxHeight: 120, caretColor: teal, boxShadow: 'inset 0 0 20px rgba(0,212,160,0.03)', resize: 'none', overflow: 'hidden', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
                        />
                      </div>
                    )}

                    {/* Log & Exit button */}
                    {!g.contextComplete && isReadyToLog(g) && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, flexShrink: 0 }}>
                        <div
                          onClick={() => !loggingGoalId && handleLogAndExit(g.id)}
                          style={{ background: loggingGoalId === g.id ? '#1a1b22' : teal, color: loggingGoalId === g.id ? '#4a4d58' : '#0e0f14', fontFamily: fm, fontSize: 12, fontWeight: 700, padding: '8px 20px', borderRadius: 6, cursor: loggingGoalId === g.id ? 'default' : 'pointer' }}
                        >
                          {loggingGoalId === g.id ? 'Logging...' : 'Log & Exit'}
                        </div>
                      </div>
                    )}

                    {/* Clear context */}
                    {g.contextComplete && (
                      <div style={{ flexShrink: 0, marginTop: 4 }}>
                        <span onClick={() => clearGoalContext(g.id)} style={{ fontSize: 10, color: '#ef4444', cursor: 'pointer', fontFamily: fm }}>clear context</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ═══ Add New Goal Button (Psychology view only, current week only) ═══ */}
        {goalMode === 'psychology' && !isReadOnly && (
          <div
            onClick={addNewGoal}
            onMouseEnter={() => setHoveredAddBtn(true)}
            onMouseLeave={() => setHoveredAddBtn(false)}
            style={{
              border: `1px dashed ${hoveredAddBtn ? teal : '#2a2b32'}`,
              borderRadius: 12,
              padding: '22px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              marginTop: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{
              fontSize: 14,
              color: hoveredAddBtn ? teal : '#666',
              fontFamily: fm,
              letterSpacing: 2,
              textTransform: 'uppercase',
              transition: 'color 0.15s ease',
            }}>+ Initialize New Parameter</span>
          </div>
        )}

        {/* ═══ NUMERICAL VIEW — quantitative weekly targets ═══ */}
        {goalMode === 'numerical' && (
          <>
            {[...quantTargets, ...customTargets].map((t, idx) => {
              const isCustom = !quantTargets.find(q => q.id === t.id);
              const suffix = t.type === 'percent' ? '%' : t.type === 'dollar' ? '$' : '';
              return (
                <div key={t.id} style={{
                  background: '#1f2430',
                  border: '1px solid #2A3143',
                  borderRadius: 12,
                  padding: '24px 28px',
                  marginBottom: 16,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  {/* Numbered circle */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', border: `2px solid ${teal}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: teal, fontFamily: fm, lineHeight: 1 }}>{idx + 1}</span>
                  </div>

                  {/* Label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fd, fontSize: 18, color: '#ffffff', fontWeight: 600, letterSpacing: '0.02em' }}>{t.label.toUpperCase()}</div>
                    <div style={{ fontFamily: fm, fontSize: 12, color: '#888', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
                      {t.type === 'percent' ? 'Percentage' : t.type === 'dollar' ? 'Dollars' : 'Number'}
                    </div>
                  </div>

                  {/* Value input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {t.type === 'dollar' && <span style={{ color: '#aab0bd', fontFamily: fm, fontSize: 16 }}>$</span>}
                    {t.id === 'target-rr' && <span style={{ color: '#aab0bd', fontFamily: fd, fontSize: 16, fontWeight: 600 }}>R</span>}
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={t.value === null ? '' : t.value}
                      onChange={e => handleQuantValueChange(t.id, e.target.value)}
                      placeholder="—"
                      style={{
                        width: 100,
                        background: '#141822',
                        border: '1px solid #2A3143',
                        borderRadius: 8,
                        padding: '10px 12px',
                        color: '#ffffff',
                        fontFamily: fd,
                        fontSize: 18,
                        fontWeight: 700,
                        textAlign: 'right',
                        outline: 'none',
                      }}
                    />
                    {t.type === 'percent' && <span style={{ color: '#aab0bd', fontFamily: fm, fontSize: 16 }}>%</span>}
                    {t.type === 'number' && t.id !== 'target-rr' && suffix && <span style={{ color: '#aab0bd', fontFamily: fm, fontSize: 16 }}>{suffix}</span>}
                  </div>

                  {/* Delete (only for custom targets) */}
                  {isCustom && (
                    <span
                      onClick={() => handleRemoveCustomTarget(t.id)}
                      style={{ fontSize: 16, color: '#3a3d48', cursor: 'pointer', lineHeight: 1, flexShrink: 0, marginLeft: 4, padding: 4 }}
                      title="Remove custom target"
                    >✕</span>
                  )}
                </div>
              );
            })}

            {/* "Type to record" add-custom-target card */}
            <div style={{
              background: '#1f2430',
              border: '1px dashed #2a2b32',
              borderRadius: 12,
              padding: '22px 20px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', border: '2px dashed #3a3d48',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 16, color: '#3a3d48', fontFamily: fm, lineHeight: 1 }}>+</span>
              </div>
              <input
                value={newCustomLabel}
                onChange={e => setNewCustomLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTarget(); } }}
                placeholder="Type to record a new target..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: fm,
                  fontSize: 15,
                  color: '#ffffff',
                  padding: '8px 0',
                }}
              />
              <select
                value={newCustomType}
                onChange={e => setNewCustomType(e.target.value as QuantTargetType)}
                style={{
                  background: '#141822',
                  border: '1px solid #2A3143',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#c9cdd4',
                  fontFamily: fm,
                  fontSize: 12,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="number">Number</option>
                <option value="percent">Percent</option>
                <option value="dollar">Dollar</option>
              </select>
              <button
                onClick={handleAddCustomTarget}
                disabled={!newCustomLabel.trim()}
                style={{
                  background: newCustomLabel.trim() ? teal : '#1a1b22',
                  color: newCustomLabel.trim() ? '#0A0D14' : '#4a4d58',
                  fontFamily: fm,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: newCustomLabel.trim() ? 'pointer' : 'default',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >Add</button>
            </div>
          </>
        )}
      </div>

      {/* ═══ COPY-TO-CURRENT-WEEK MODAL ═══ */}
      {copyModal && (() => {
        const sourceCount = copyModal.sourceGoals.length;
        const currentCount = goals.filter(g => g.weekStart === currentWeekStart).length;
        const closeModal = () => { setCopyModal(null); setCopyMode('append'); };
        const confirm = () => {
          if (copyMode === 'cancel') { closeModal(); return; }
          const nowIso = new Date().toISOString();
          const cloned: Goal[] = copyModal.sourceGoals.map(g => ({
            ...g,
            id: `g${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            createdAt: nowIso,
            weekStart: currentWeekStart,
            // A copy starts fresh — the coach will re-clarify context
            // for the new week rather than inheriting stale scoring.
            context: [],
            aiResponses: [],
            contextComplete: false,
            actionItems: [],
            completeness: undefined,
            scoringCriteria: undefined,
          }));
          if (copyMode === 'append') {
            setGoals(prev => [...prev, ...cloned]);
            showToast(`Copied ${cloned.length} goal${cloned.length === 1 ? '' : 's'}`);
          } else {
            // replace
            setGoals(prev => [...prev.filter(g => g.weekStart !== currentWeekStart), ...cloned]);
            showToast(`Replaced current week with ${cloned.length} goal${cloned.length === 1 ? '' : 's'}`);
          }
          setViewedWeekStart(null);
          closeModal();
        };
        const radio = (value: 'append' | 'replace' | 'cancel', label: string) => (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 0', fontFamily: fm, fontSize: 12, color: '#ccc' }}>
            <input
              type="radio"
              name="copyMode"
              checked={copyMode === value}
              onChange={() => setCopyMode(value)}
              style={{ accentColor: teal, cursor: 'pointer' }}
            />
            <span>{label}</span>
          </label>
        );
        return (
          <>
            <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000 }} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, width: 440, maxWidth: 'calc(100vw - 32px)', background: '#13141a', border: '1px solid #1a1b22', borderRadius: 8, padding: 24 }}>
              <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 500, color: '#e0e0e0', marginBottom: 12 }}>Copy goals to current week?</div>
              <div style={{ fontFamily: fm, fontSize: 12, color: '#ccc', lineHeight: 1.5, marginBottom: 14, whiteSpace: 'pre-line' }}>
                {`This will add ${sourceCount} goal${sourceCount === 1 ? '' : 's'} from ${formatWeekRange(copyModal.sourceWeekStart)} to your current week.\nCurrent week already has ${currentCount} goal${currentCount === 1 ? '' : 's'}.\n\nChoose how to apply:`}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18 }}>
                {radio('append',  `Append — add past goals to current (current week becomes ${sourceCount + currentCount} goals)`)}
                {radio('replace', `Replace — wipe current goals and use past goals only`)}
                {radio('cancel',  `Cancel — do nothing`)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <span onClick={closeModal} style={{ fontFamily: fm, fontSize: 12, color: '#7a7d85', padding: '8px 16px', cursor: 'pointer', background: 'transparent' }}>Cancel</span>
                <span onClick={confirm} style={{ fontFamily: fm, fontSize: 12, fontWeight: 500, color: '#000', background: teal, padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>Confirm</span>
              </div>
            </div>
          </>
        );
      })()}

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#13141a',
          border: `1px solid ${teal}`,
          color: teal,
          fontFamily: fm,
          fontSize: 12,
          padding: '10px 20px',
          borderRadius: 8,
          zIndex: 2000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,160,0.18)',
          letterSpacing: 0.5,
        }}>
          {toast}
        </div>
      )}

      <style>{`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </div>
  );
}


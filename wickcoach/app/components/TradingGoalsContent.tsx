'use client';
import React, { useState, useEffect, useRef } from "react";
import { fm, fd, teal, Trade, Goal, GoalScoringCriteria, GOAL_TYPES, DEFAULT_GOALS, buildGoalsContext, buildProfileContext, buildTraderStats } from "./shared";
import { MiniStickFigure } from "./Logo";

export default function TradingGoalsContent({ trades, onMessageSent }: { trades: Trade[]; onMessageSent?: (inputRect: DOMRect) => void }) {
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
  const chatEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // trades is now threaded into AI context payloads below

  useEffect(() => {
    const saved = localStorage.getItem('wickcoach_goals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && 'context' in parsed[0]) {
          setGoals(parsed.map((g: Goal) => ({ ...g, actionItems: g.actionItems || [], goalType: g.goalType || 'General' })));
        } else {
          setGoals(DEFAULT_GOALS);
          localStorage.setItem('wickcoach_goals', JSON.stringify(DEFAULT_GOALS));
        }
      } catch {
        setGoals(DEFAULT_GOALS);
        localStorage.setItem('wickcoach_goals', JSON.stringify(DEFAULT_GOALS));
      }
    } else {
      setGoals(DEFAULT_GOALS);
      localStorage.setItem('wickcoach_goals', JSON.stringify(DEFAULT_GOALS));
    }
  }, []);

  useEffect(() => {
    if (goals.length > 0) localStorage.setItem('wickcoach_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (expandedGoalId) {
      chatEndRefs.current[expandedGoalId]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [goals, expandedGoalId, loadingGoalId]);

  const addNewGoal = () => {
    const newGoal: Goal = {
      id: `g${Date.now()}`,
      title: '',
      context: [],
      aiResponses: [],
      contextComplete: false,
      actionItems: [],
      createdAt: new Date().toISOString(),
      goalType: 'General',
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

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)', fontFamily: fm, background: 'transparent' }}>
      {/* ═══ LEFT SIDEBAR ═══ */}
      <div style={{ width: 220, background: '#141822', borderRight: '1px solid #2A3143', padding: '28px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ fontFamily: fm, fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Navigation</div>
        <div style={{ fontFamily: fm, fontSize: 13, color: teal, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 16 }}>Goals Hierarchy</div>
        <div style={{ height: 1, background: '#2a2b32', marginBottom: 20 }} />

        {(['weekly', 'monthly', 'behavioral'] as const).map(v => {
          const isActive = activeView === v;
          const label = v === 'weekly' ? 'Weekly Goals' : v === 'monthly' ? 'Monthly Goals' : 'Behavioral';
          return (
            <div
              key={v}
              onClick={() => setActiveView(v)}
              style={{
                padding: '12px 14px',
                marginBottom: 4,
                borderRadius: 6,
                cursor: 'pointer',
                background: isActive ? '#1a1f2a' : 'transparent',
                borderLeft: isActive ? `3px solid ${teal}` : '3px solid transparent',
                color: isActive ? '#ffffff' : '#6b7280',
                fontSize: 14,
                fontFamily: fm,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{label}</span>
              {isActive && <span style={{ color: teal, fontSize: 12 }}>›</span>}
            </div>
          );
        })}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ flex: 1, padding: '40px 36px 32px', overflowY: 'auto' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontFamily: fd, fontSize: 28, color: '#ffffff', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
              {activeView === 'weekly' ? 'Weekly Goals' : activeView === 'monthly' ? 'Monthly Goals' : 'Behavioral'}
            </h2>
            <p style={{ fontFamily: fm, fontSize: 14, color: '#888', margin: '8px 0 0' }}>
              Active behavioral and technical parameters for the current week.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: teal }} />
            <span style={{ fontFamily: fm, fontSize: 13, color: teal }}>{goals.length} Active Rule{goals.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* ═══ GOAL CARDS ═══ */}
        {goals.map((g, idx) => {
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span
                      onClick={() => cycleGoalType(g.id)}
                      style={{
                        fontFamily: fm,
                        fontSize: 11,
                        fontWeight: 700,
                        color: teal,
                        background: 'rgba(0,212,160,0.18)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        letterSpacing: 1,
                        cursor: 'pointer',
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

                {/* Context button area */}
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

                {/* Delete button */}
                <span
                  onClick={() => deleteGoal(g.id)}
                  style={{ fontSize: 16, color: '#3a3d48', cursor: 'pointer', lineHeight: 1, flexShrink: 0, marginLeft: 4, padding: '4px' }}
                  title="Delete goal"
                >✕</span>
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
                          placeholder={isReadyToLog(g) ? 'Add more context or click Log & Exit...' : 'Tell WickCoach why this matters...'}
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

        {/* ═══ Add New Goal Button ═══ */}
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
      </div>
      <style>{`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </div>
  );
}


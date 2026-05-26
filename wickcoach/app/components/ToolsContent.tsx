'use client';
import React, { useState } from 'react';
import { Calculator, MessageSquare, BookOpen, TrendingUp, Trophy } from 'lucide-react';
import { fd, fm, teal } from './shared';
import { GrowthSimulatorContent } from './GrowthSimulatorContent';
import { PositionSizeContent } from './PositionSizeContent';

type ToolSlug = 'position-size' | 'coach-brainstorm' | 'overall-journal' | 'growth-simulator' | 'leaderboard';

interface ToolDef {
  slug: ToolSlug;
  title: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
}

const TOOLS: ToolDef[] = [
  {
    slug: 'position-size',
    title: 'POSITION SIZE CALCULATOR',
    description: 'Calculate share or contract size based on account risk, stop distance, and target R-multiple.',
    Icon: Calculator,
  },
  {
    slug: 'coach-brainstorm',
    title: 'TRADING COACH 1:1',
    description: 'Open-ended brainstorming session with WickCoach AI. Ask anything about your trading, no rules attached.',
    Icon: MessageSquare,
  },
  {
    slug: 'overall-journal',
    title: 'OVERALL JOURNAL',
    description: 'Free-form journal entries unattached to specific trades. Pre-market notes, market read, mindset check-ins.',
    Icon: BookOpen,
  },
  {
    slug: 'growth-simulator',
    title: 'GROWTH SIMULATOR',
    description: 'Project account growth across years using your win rate, R:R, risk profile, and withdrawals. Monte Carlo realistic.',
    Icon: TrendingUp,
  },
  {
    slug: 'leaderboard',
    title: 'LEADERBOARD',
    description: 'Generate a shareable trader card highlighting your weekly improvements. Build a movement around process, not P/L.',
    Icon: Trophy,
  },
];

function ToolCard({ tool, onOpen }: { tool: ToolDef; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  const Icon = tool.Icon;
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        background: 'linear-gradient(155deg, rgba(36,40,52,0.6) 0%, rgba(18,20,28,0.85) 55%, rgba(8,10,16,0.92) 100%)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 22,
        padding: 28,
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'center',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        boxShadow: hover
          ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,160,0.5), 0 0 28px rgba(0,212,160,0.45), 0 0 70px rgba(0,212,160,0.25), 0 12px 32px rgba(0,0,0,0.55)'
          : 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.45), 0 12px 32px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
      }}
    >
      {/* Soft specular highlight — radial hot spot in upper-left, mimics light hitting curved glass */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 28% -10%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)',
        pointerEvents: 'none',
        borderRadius: 'inherit',
      }} />
      {/* Top sheen — bright glass-edge highlight that fades down */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '55%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
      }} />
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        marginTop: 8,
      }}>
        <Icon size={36} strokeWidth={1.5} color="#e0e0e0" />
        <div style={{
          fontFamily: fd,
          fontSize: 15,
          fontWeight: 500,
          color: '#e0e0e0',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {tool.title}
        </div>
        <div style={{
          fontFamily: fm,
          fontSize: 12,
          color: '#9da0a8',
          lineHeight: 1.5,
          maxWidth: 240,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 3,
          overflow: 'hidden',
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}>
          {tool.description}
        </div>
      </div>
      <div style={{
        position: 'relative',
        fontFamily: fm,
        fontSize: 11,
        fontWeight: 500,
        color: '#555',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
      }}>
        Open →
      </div>
    </div>
  );
}

function ToolGrid({ onOpen }: { onOpen: (slug: ToolSlug) => void }) {
  return (
    <div style={{
      maxWidth: 920,
      margin: '0 auto',
      padding: '0 32px',
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: fd,
          fontSize: 24,
          fontWeight: 600,
          color: '#e0e0e0',
        }}>
          Tools
        </div>
        <div style={{
          marginTop: 4,
          fontFamily: fm,
          fontSize: 13,
          color: '#7a7d85',
        }}>
          Calculators, brainstorming, and journals to support your trading process.
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 24,
      }}>
        {TOOLS.map(t => (
          <ToolCard key={t.slug} tool={t} onOpen={() => onOpen(t.slug)} />
        ))}
      </div>
    </div>
  );
}

export function ToolPageShell({ title, onBack, children }: { title: string; onBack: () => void; children?: React.ReactNode }) {
  return (
    <div style={{
      maxWidth: 1280,
      margin: '0 auto',
      padding: '0 40px',
    }}>
      <div
        onClick={onBack}
        style={{
          fontFamily: fm,
          fontSize: 13,
          color: teal,
          cursor: 'pointer',
          display: 'inline-block',
        }}
      >
        ← Back to Tools
      </div>
      <div style={{
        marginTop: 24,
        fontFamily: fd,
        fontSize: 24,
        fontWeight: 600,
        color: '#e0e0e0',
      }}>
        {title}
      </div>
      {children ? (
        <div style={{ marginTop: 24 }}>{children}</div>
      ) : (
        <div style={{
          fontFamily: fm,
          fontSize: 14,
          color: '#7a7d85',
          textAlign: 'center',
          padding: '80px 0',
        }}>
          Coming soon.
        </div>
      )}
    </div>
  );
}

function CoachBrainstormContent({ onBack }: { onBack: () => void }) {
  return <ToolPageShell title="Trading Coach 1:1" onBack={onBack} />;
}

function OverallJournalContent({ onBack }: { onBack: () => void }) {
  return <ToolPageShell title="Overall Journal" onBack={onBack} />;
}

function LeaderboardContent({ onBack }: { onBack: () => void }) {
  return <ToolPageShell title="Leaderboard" onBack={onBack} />;
}

export default function ToolsContent() {
  const [activeTool, setActiveTool] = useState<ToolSlug | null>(null);
  const back = () => setActiveTool(null);

  if (activeTool === 'position-size')    return <PositionSizeContent    onBack={back} />;
  if (activeTool === 'coach-brainstorm') return <CoachBrainstormContent onBack={back} />;
  if (activeTool === 'overall-journal')  return <OverallJournalContent  onBack={back} />;
  if (activeTool === 'growth-simulator') return <GrowthSimulatorContent onBack={back} />;
  if (activeTool === 'leaderboard')      return <LeaderboardContent     onBack={back} />;
  return <ToolGrid onOpen={setActiveTool} />;
}

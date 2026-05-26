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
  gradient: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
}

const TOOLS: ToolDef[] = [
  {
    slug: 'position-size',
    title: 'POSITION SIZE CALCULATOR',
    description: 'Calculate share or contract size based on account risk, stop distance, and target R-multiple.',
    gradient: 'linear-gradient(135deg, #0e1a24 0%, #131822 100%)',
    Icon: Calculator,
  },
  {
    slug: 'coach-brainstorm',
    title: 'TRADING COACH 1:1',
    description: 'Open-ended brainstorming session with WickCoach AI. Ask anything about your trading, no rules attached.',
    gradient: 'linear-gradient(135deg, #0e2418 0%, #131c18 100%)',
    Icon: MessageSquare,
  },
  {
    slug: 'overall-journal',
    title: 'OVERALL JOURNAL',
    description: 'Free-form journal entries unattached to specific trades. Pre-market notes, market read, mindset check-ins.',
    gradient: 'linear-gradient(135deg, #1a1429 0%, #181522 100%)',
    Icon: BookOpen,
  },
  {
    slug: 'growth-simulator',
    title: 'GROWTH SIMULATOR',
    description: 'Project account growth across years using your win rate, R:R, risk profile, and withdrawals. Monte Carlo realistic.',
    gradient: 'linear-gradient(135deg, #1a1a14 0%, #181812 100%)',
    Icon: TrendingUp,
  },
  {
    slug: 'leaderboard',
    title: 'LEADERBOARD',
    description: 'Generate a shareable trader card highlighting your weekly improvements. Build a movement around process, not P/L.',
    gradient: 'linear-gradient(135deg, #1a1518 0%, #181318 100%)',
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
        background: tool.gradient,
        border: `1px solid ${hover ? teal : '#1a1b22'}`,
        borderRadius: 12,
        padding: 24,
        minHeight: 200,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <Icon size={32} strokeWidth={1.5} color={teal} />
        <div style={{
          marginTop: 16,
          fontFamily: fd,
          fontSize: 18,
          fontWeight: 500,
          color: '#e0e0e0',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {tool.title}
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: fm,
          fontSize: 12,
          color: '#7a7d85',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
        }}>
          {tool.description}
        </div>
      </div>
      <div style={{
        fontFamily: fm,
        fontSize: 11,
        fontWeight: 500,
        color: teal,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        Open →
      </div>
    </div>
  );
}

function ToolGrid({ onOpen }: { onOpen: (slug: ToolSlug) => void }) {
  return (
    <div>
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
    <div>
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

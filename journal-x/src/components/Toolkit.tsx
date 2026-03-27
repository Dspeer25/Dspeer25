'use client';

import { useState } from 'react';

interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'calculators' | 'psychology' | 'planning';
}

const tools: ToolCard[] = [
  {
    id: 'position-size',
    title: 'Position Size Calculator',
    description: 'Calculate your ideal position size based on account size, risk %, and stop distance.',
    icon: '⊞',
    category: 'calculators',
  },
  {
    id: 'rr-calc',
    title: 'Risk/Reward Calculator',
    description: 'Quickly compute R:R ratio from entry, stop, and target prices.',
    icon: '⇅',
    category: 'calculators',
  },
  {
    id: 'breakeven',
    title: 'Breakeven Win Rate',
    description: 'Find the minimum win rate needed to be profitable at your average R:R.',
    icon: '◎',
    category: 'calculators',
  },
  {
    id: 'pre-trade',
    title: 'Pre-Trade Checklist',
    description: 'Run through your rules before clicking buy. Builds discipline.',
    icon: '✓',
    category: 'planning',
  },
  {
    id: 'tilt-check',
    title: 'Tilt Check',
    description: 'Quick emotional self-assessment. Are you in the right headspace to trade?',
    icon: '◇',
    category: 'psychology',
  },
  {
    id: 'rule-review',
    title: 'Rule Review',
    description: 'Review your trading rules and risk limits before the session.',
    icon: '☰',
    category: 'planning',
  },
];

function PositionSizeCalc() {
  const [account, setAccount] = useState('');
  const [riskPct, setRiskPct] = useState('1');
  const [stopDist, setStopDist] = useState('');

  const riskDollars = account && riskPct ? (parseFloat(account) * parseFloat(riskPct)) / 100 : 0;
  const shares = riskDollars && stopDist ? Math.floor(riskDollars / parseFloat(stopDist)) : 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-[#8b8b9e] block mb-1">Account Size ($)</label>
        <input type="number" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="25000" className="w-full text-sm py-2.5 rounded-xl" />
      </div>
      <div>
        <label className="text-xs text-[#8b8b9e] block mb-1">Risk Per Trade (%)</label>
        <input type="number" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} placeholder="1" className="w-full text-sm py-2.5 rounded-xl" />
      </div>
      <div>
        <label className="text-xs text-[#8b8b9e] block mb-1">Stop Distance ($)</label>
        <input type="number" value={stopDist} onChange={(e) => setStopDist(e.target.value)} placeholder="0.50" className="w-full text-sm py-2.5 rounded-xl" />
      </div>
      <div className="glass rounded-xl p-4 text-center">
        <div className="text-xs text-[#55556a] mb-1">Risk Amount</div>
        <div className="text-lg font-bold text-[#6366f1]">${riskDollars.toFixed(2)}</div>
        <div className="text-xs text-[#55556a] mt-3 mb-1">Position Size</div>
        <div className="text-2xl font-black">{shares} shares</div>
      </div>
    </div>
  );
}

function RRCalc() {
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [target, setTarget] = useState('');

  const risk = entry && stop ? Math.abs(parseFloat(entry) - parseFloat(stop)) : 0;
  const reward = entry && target ? Math.abs(parseFloat(target) - parseFloat(entry)) : 0;
  const rr = risk > 0 ? (reward / risk).toFixed(2) : '—';

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-[#8b8b9e] block mb-1">Entry Price</label>
        <input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="150.00" className="w-full text-sm py-2.5 rounded-xl" />
      </div>
      <div>
        <label className="text-xs text-[#8b8b9e] block mb-1">Stop Loss</label>
        <input type="number" value={stop} onChange={(e) => setStop(e.target.value)} placeholder="148.50" className="w-full text-sm py-2.5 rounded-xl" />
      </div>
      <div>
        <label className="text-xs text-[#8b8b9e] block mb-1">Target Price</label>
        <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="154.00" className="w-full text-sm py-2.5 rounded-xl" />
      </div>
      <div className="glass rounded-xl p-4 text-center">
        <div className="text-xs text-[#55556a] mb-1">Risk : Reward</div>
        <div className="text-2xl font-black text-[#6366f1]">1 : {rr}</div>
      </div>
    </div>
  );
}

function BreakevenCalc() {
  const [avgRR, setAvgRR] = useState('');

  const be = avgRR ? (1 / (1 + parseFloat(avgRR))) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-[#8b8b9e] block mb-1">Average R:R</label>
        <input type="number" value={avgRR} onChange={(e) => setAvgRR(e.target.value)} placeholder="2.0" className="w-full text-sm py-2.5 rounded-xl" />
      </div>
      <div className="glass rounded-xl p-4 text-center">
        <div className="text-xs text-[#55556a] mb-1">Breakeven Win Rate</div>
        <div className="text-2xl font-black text-[#6366f1]">{be > 0 ? `${be.toFixed(1)}%` : '—'}</div>
        <div className="text-xs text-[#8b8b9e] mt-2">You need to win at least this often to break even.</div>
      </div>
    </div>
  );
}

function PreTradeChecklist() {
  const checks = [
    'Is this setup in my playbook?',
    'Am I risking within my limits?',
    'Do I have a clear stop loss?',
    'Do I have a defined target?',
    'Am I in the right emotional state?',
    'Have I reviewed the bigger picture / context?',
    'Is there a news event I should be aware of?',
  ];
  const [checked, setChecked] = useState<boolean[]>(new Array(checks.length).fill(false));

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };

  const allChecked = checked.every(Boolean);

  return (
    <div className="space-y-3">
      {checks.map((c, i) => (
        <button key={i} onClick={() => toggle(i)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all ${checked[i] ? 'glass border border-[#34d399]/20 text-[#34d399]' : 'glass text-[#8b8b9e]'}`}>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition-all ${checked[i] ? 'bg-[#34d399]/20 border-[#34d399]/40' : 'border-[rgba(255,255,255,0.1)]'}`}>
            {checked[i] && '✓'}
          </div>
          {c}
        </button>
      ))}
      {allChecked && (
        <div className="text-center text-[#34d399] text-sm font-semibold py-3 animate-fade-in">
          All clear. Execute with confidence.
        </div>
      )}
    </div>
  );
}

function TiltCheck() {
  const [score, setScore] = useState<number | null>(null);
  const levels = [
    { value: 1, label: 'Locked In', desc: 'Calm, focused, following the plan.', color: 'text-[#34d399]' },
    { value: 2, label: 'Slightly Off', desc: 'A bit distracted or impatient. Trade carefully.', color: 'text-[#facc15]' },
    { value: 3, label: 'Tilted', desc: 'Frustrated, revenge-trading urge, or chasing. Step away.', color: 'text-[#fb923c]' },
    { value: 4, label: 'Full Tilt', desc: 'Emotional, angry, or desperate. Do NOT trade. Walk away now.', color: 'text-[#f87171]' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#8b8b9e] mb-4">How are you feeling right now? Be honest.</p>
      {levels.map((l) => (
        <button key={l.value} onClick={() => setScore(l.value)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all ${score === l.value ? 'glass border border-[rgba(255,255,255,0.1)]' : 'glass opacity-60 hover:opacity-100'}`}>
          <div className={`text-lg font-black ${l.color}`}>{l.value}</div>
          <div>
            <div className={`text-sm font-semibold ${l.color}`}>{l.label}</div>
            <div className="text-xs text-[#55556a]">{l.desc}</div>
          </div>
        </button>
      ))}
      {score && score >= 3 && (
        <div className="text-center text-[#f87171] text-sm font-semibold py-3 animate-fade-in">
          Close the charts. Go for a walk. Come back when you&apos;re level 1.
        </div>
      )}
    </div>
  );
}

export default function Toolkit() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const categories = ['calculators', 'psychology', 'planning'] as const;

  const renderTool = () => {
    switch (activeTool) {
      case 'position-size': return <PositionSizeCalc />;
      case 'rr-calc': return <RRCalc />;
      case 'breakeven': return <BreakevenCalc />;
      case 'pre-trade': return <PreTradeChecklist />;
      case 'tilt-check': return <TiltCheck />;
      case 'rule-review': return null; // TODO: pull from settings
      default: return null;
    }
  };

  if (activeTool) {
    const tool = tools.find((t) => t.id === activeTool);
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <button onClick={() => setActiveTool(null)} className="text-sm text-[#8b8b9e] hover:text-white transition-colors mb-6 flex items-center gap-2">
          ← Back to Toolkit
        </button>
        <h2 className="text-xl font-bold mb-1">{tool?.title}</h2>
        <p className="text-sm text-[#55556a] mb-6">{tool?.description}</p>
        {renderTool()}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold mb-6">Toolkit</h2>
      {categories.map((cat) => (
        <div key={cat} className="mb-8">
          <h3 className="text-xs text-[#55556a] uppercase tracking-[0.15em] mb-3">{cat}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.filter((t) => t.category === cat).map((tool) => (
              <button key={tool.id} onClick={() => setActiveTool(tool.id)} className="glass rounded-xl p-4 text-left hover:border-[#6366f1]/30 transition-all group">
                <div className="text-xl mb-2 opacity-40 group-hover:opacity-70 transition-opacity">{tool.icon}</div>
                <div className="text-sm font-semibold mb-1">{tool.title}</div>
                <div className="text-xs text-[#55556a] leading-relaxed">{tool.description}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

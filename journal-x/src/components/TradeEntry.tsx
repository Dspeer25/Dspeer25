'use client';

import { useState, useEffect } from 'react';
import { Trade, UserSettings } from '@/lib/types';
import { addTrade, getSettings } from '@/lib/store';

function InfoIcon({ text }: { text: string }) {
  return (
    <span className="tooltip-trigger inline-flex ml-1 cursor-help">
      <span className="w-4 h-4 rounded-full bg-[rgba(12,12,20,0.6)] border border-[rgba(255,255,255,0.06)] text-[10px] flex items-center justify-center text-[#55556a]">i</span>
      <span className="tooltip-content">{text}</span>
    </span>
  );
}

export default function TradeEntry({ onSaved }: { onSaved: () => void }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    ticker: '',
    time: new Date().toTimeString().slice(0, 5),
    tradeType: 'Day' as 'Day' | 'Swing',
    initialRisk: '',
    result: '' as '' | 'W' | 'L' | 'BE',
    dollarPnl: '',
    rr: '',
    notes: '',
    grade: '' as Trade['grade'],
    customFields: {} as Record<string, string>,
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const update = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateCustom = (fieldId: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      customFields: { ...prev.customFields, [fieldId]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker || !form.result || saving) return;

    setSaving(true);
    await addTrade({
      date: form.date,
      ticker: form.ticker.toUpperCase(),
      time: form.time,
      tradeType: form.tradeType,
      initialRisk: parseFloat(form.initialRisk as string) || 0,
      result: form.result as 'W' | 'L' | 'BE',
      dollarPnl: parseFloat(form.dollarPnl as string) || 0,
      rr: parseFloat(form.rr as string) || 0,
      notes: form.notes,
      starred: false,
      grade: form.grade,
      customFields: form.customFields,
    });

    setForm({
      date: form.date,
      ticker: '',
      time: new Date().toTimeString().slice(0, 5),
      tradeType: 'Day',
      initialRisk: '',
      result: '',
      dollarPnl: '',
      rr: '',
      notes: '',
      grade: '',
      customFields: {},
    });
    setSaving(false);
    onSaved();
  };

  if (!settings) return null;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-xl font-semibold mb-6">New Trade</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Date / Ticker / Time */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[#8b8b9e] mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[#8b8b9e] mb-1">Ticker</label>
            <input
              type="text"
              value={form.ticker}
              onChange={(e) => update('ticker', e.target.value)}
              placeholder="AAPL"
              className="w-full uppercase"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8b8b9e] mb-1">Time</label>
            <input type="time" value={form.time} onChange={(e) => update('time', e.target.value)} className="w-full" />
          </div>
        </div>

        {/* Row 2: Trade Type Toggle */}
        <div>
          <label className="block text-xs text-[#8b8b9e] mb-1">Trade Type</label>
          <div className="flex gap-1 glass rounded-xl p-1 w-fit">
            {(['Day', 'Swing'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update('tradeType', t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  form.tradeType === t ? 'bg-[#6366f1] text-white' : 'text-[#8b8b9e] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Custom Fields */}
        {settings.customFields.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {settings.customFields.map((field) => (
              <div key={field.id}>
                <label className="block text-xs text-[#8b8b9e] mb-1">
                  {field.label}
                  {field.description && <InfoIcon text={field.description} />}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={form.customFields[field.id] || ''}
                    onChange={(e) => updateCustom(field.id, e.target.value)}
                    className="w-full"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.customFields[field.id] || ''}
                    onChange={(e) => updateCustom(field.id, e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Row 4: Risk / Result / PnL / R:R */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[#8b8b9e] mb-1">Initial Risk ($)</label>
            <input
              type="number"
              step="0.01"
              value={form.initialRisk}
              onChange={(e) => update('initialRisk', e.target.value)}
              placeholder="100"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8b8b9e] mb-1">Result</label>
            <div className="flex gap-1 glass rounded-xl p-1">
              {(['W', 'L', 'BE'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update('result', r)}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    form.result === r
                      ? r === 'W'
                        ? 'bg-[#34d399] text-white'
                        : r === 'L'
                        ? 'bg-[#f87171] text-white'
                        : 'bg-[#fbbf24] text-black'
                      : 'text-[#8b8b9e] hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#8b8b9e] mb-1">$ PnL</label>
            <input
              type="number"
              step="0.01"
              value={form.dollarPnl}
              onChange={(e) => update('dollarPnl', e.target.value)}
              placeholder="250"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8b8b9e] mb-1">R:R</label>
            <input
              type="number"
              step="0.1"
              value={form.rr}
              onChange={(e) => update('rr', e.target.value)}
              placeholder="2.5"
              className="w-full"
            />
          </div>
        </div>

        {/* Row 5: Grade */}
        <div>
          <label className="block text-xs text-[#8b8b9e] mb-1">Grade</label>
          <div className="flex gap-1 glass rounded-xl p-1 w-fit">
            {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => {
              const def = settings.gradeDefinitions.find((d) => d.grade === g);
              return (
                <div key={g} className="tooltip-trigger">
                  <button
                    type="button"
                    onClick={() => update('grade', form.grade === g ? '' : g)}
                    className={`w-9 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      form.grade === g
                        ? g === 'A'
                          ? 'bg-[#34d399] text-white'
                          : g === 'B'
                          ? 'bg-[#6366f1] text-white'
                          : g === 'C'
                          ? 'bg-[#fbbf24] text-black'
                          : g === 'D'
                          ? 'bg-orange-500 text-white'
                          : 'bg-[#f87171] text-white'
                        : 'text-[#8b8b9e] hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                  {def && <span className="tooltip-content">{def.description}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 6: Notes */}
        <div>
          <label className="block text-xs text-[#8b8b9e] mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            placeholder="Trade reasoning, observations..."
            className="w-full resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-50 text-white py-2.5 rounded-xl font-medium transition-all duration-200"
        >
          {saving ? 'Saving...' : 'Log Trade'}
        </button>
      </form>
    </div>
  );
}

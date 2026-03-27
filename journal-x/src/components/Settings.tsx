'use client';

import { useState, useEffect } from 'react';
import { UserSettings, CustomField } from '@/lib/types';
import { getSettings, saveSettings, generateId } from '@/lib/store';

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const save = (updates: Partial<UserSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...updates };
    setSettings(updated);
    saveSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const addField = () => {
    if (!settings) return;
    const newField: CustomField = { id: generateId(), label: 'New Field', type: 'select', options: ['Option 1', 'Option 2'], description: '' };
    save({ customFields: [...settings.customFields, newField] });
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    if (!settings) return;
    save({ customFields: settings.customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)) });
  };

  const removeField = (id: string) => {
    if (!settings) return;
    save({ customFields: settings.customFields.filter((f) => f.id !== id) });
  };

  const addOption = (fieldId: string) => {
    if (!settings) return;
    const field = settings.customFields.find((f) => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, { options: [...(field.options || []), 'New Option'] });
  };

  const updateOption = (fieldId: string, index: number, value: string) => {
    if (!settings) return;
    const field = settings.customFields.find((f) => f.id === fieldId);
    if (!field?.options) return;
    const options = [...field.options];
    options[index] = value;
    updateField(fieldId, { options });
  };

  const removeOption = (fieldId: string, index: number) => {
    if (!settings) return;
    const field = settings.customFields.find((f) => f.id === fieldId);
    if (!field?.options) return;
    updateField(fieldId, { options: field.options.filter((_, i) => i !== index) });
  };

  if (!settings) return <div className="text-[#55556a] py-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Settings</h2>
        {saved && <span className="text-xs text-[#34d399]">Saved!</span>}
      </div>

      <section className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Risk Management</h3>
        <div>
          <label className="block text-xs text-[#55556a] mb-1">Max Daily Loss ($)</label>
          <input type="number" value={settings.maxDailyLoss} onChange={(e) => save({ maxDailyLoss: parseFloat(e.target.value) || 0 })} className="w-40 text-sm" />
          <p className="text-xs text-[#55556a] mt-1">Trading locks when daily loss exceeds this amount.</p>
        </div>
      </section>

      <section className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Grade Definitions</h3>
        <div className="space-y-3">
          {settings.gradeDefinitions.map((def) => (
            <div key={def.grade} className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${
                def.grade === 'A' ? 'bg-[#34d399]/20 text-[#34d399]'
                : def.grade === 'B' ? 'bg-[#6366f1]/20 text-[#6366f1]'
                : def.grade === 'C' ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                : def.grade === 'D' ? 'bg-[#fb923c]/20 text-[#fb923c]'
                : 'bg-[#f87171]/20 text-[#f87171]'
              }`}>{def.grade}</span>
              <input
                type="text"
                value={def.description}
                onChange={(e) => {
                  save({ gradeDefinitions: settings.gradeDefinitions.map((d) => d.grade === def.grade ? { ...d, description: e.target.value } : d) });
                }}
                className="flex-1 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Custom Fields</h3>
          <button onClick={addField} className="text-xs px-3 py-1 bg-[#6366f1] rounded-lg text-white hover:bg-[#818cf8]">+ Add Field</button>
        </div>
        <div className="space-y-4">
          {settings.customFields.map((field) => (
            <div key={field.id} className="border border-[rgba(255,255,255,0.06)] rounded-xl p-3 bg-[#0c0c14]">
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} className="flex-1 text-sm font-medium" placeholder="Field name" />
                <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as 'select' | 'text' })} className="text-xs py-1.5">
                  <option value="select">Dropdown</option>
                  <option value="text">Text</option>
                </select>
                <button onClick={() => removeField(field.id)} className="text-[#55556a] hover:text-[#f87171] text-sm px-1">{'\u2715'}</button>
              </div>
              <input type="text" value={field.description || ''} onChange={(e) => updateField(field.id, { description: e.target.value })} className="w-full text-xs mb-2" placeholder="Description (shows on hover)" />
              {field.type === 'select' && (
                <div className="space-y-1">
                  {field.options?.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input type="text" value={opt} onChange={(e) => updateOption(field.id, i, e.target.value)} className="flex-1 text-xs py-1" />
                      <button onClick={() => removeOption(field.id, i)} className="text-[#55556a] hover:text-[#f87171] text-xs px-1">{'\u2715'}</button>
                    </div>
                  ))}
                  <button onClick={() => addOption(field.id)} className="text-xs text-[#6366f1] hover:text-blue-400">+ Add Option</button>
                </div>
              )}
            </div>
          ))}
          {settings.customFields.length === 0 && (
            <div className="text-center py-4 text-[#55556a] text-sm">No custom fields. Add one to get started.</div>
          )}
        </div>
      </section>

      <section className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Focus Video URL</h3>
        <input type="text" value={settings.focusVideoUrl} onChange={(e) => save({ focusVideoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/..." className="w-full text-sm" />
        <p className="text-xs text-[#55556a] mt-1">YouTube embed URL for the Focus tab.</p>
      </section>
    </div>
  );
}

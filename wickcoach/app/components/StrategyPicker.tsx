'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  PositionType,
  readCustomStrategies,
  addCustomStrategy,
  removeCustomStrategy,
  readAllCustomStrategies,
  removeCustomStrategyEverywhere,
} from './shared';

interface StrategyPickerProps {
  value: string;
  onChange: (v: string) => void;
  /** Scoped mode: read+write only this position type's list.
   *  Undefined → union mode: read the union of all three lists;
   *  adding requires the user to pick which list to add to. */
  positionType?: PositionType;
  placeholder?: string;
  /** Visual style override for the trigger button. */
  triggerStyle?: React.CSSProperties;
  /** Disabled — no dropdown opens, no add/delete. */
  disabled?: boolean;
}

/**
 * Custom dropdown that lets the trader pick a strategy from a
 * persistent list, add new ones inline, and delete entries via a
 * small × on each row. Native <select> can't render per-option
 * buttons, so this is a div-based dropdown.
 *
 * Two modes:
 *   - Scoped (positionType set): used by Log a Trade. Reads and
 *     writes the matching per-type list only.
 *   - Union (positionType undefined): used by the NUMBER goal
 *     builder. Reads the union of all three lists. Adding requires
 *     picking which position type the new strategy belongs to;
 *     deleting removes the name from every list that has it.
 */
export default function StrategyPicker({
  value,
  onChange,
  positionType,
  placeholder = 'Pick a strategy…',
  triggerStyle,
  disabled = false,
}: StrategyPickerProps) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addTo, setAddTo] = useState<PositionType>(positionType ?? 'OPTIONS');
  const [strategies, setStrategies] = useState<string[]>(() => loadList(positionType));
  const containerRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Re-read the list whenever positionType changes (scoped mode) so
  // switching position types in Log a Trade swaps the dropdown
  // contents without a remount.
  useEffect(() => {
    setStrategies(loadList(positionType));
    setAdding(false);
    setNewName('');
  }, [positionType]);

  // Refresh from storage on focus — covers the case where the trader
  // added a strategy in the goal builder while Log a Trade is open
  // (or vice versa) and we want the dropdown to reflect it without
  // a refresh.
  useEffect(() => {
    const refresh = () => setStrategies(loadList(positionType));
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', refresh);
      return () => window.removeEventListener('focus', refresh);
    }
  }, [positionType]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Auto-focus the add input as soon as it appears.
  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    setAdding(false);
    setNewName('');
  };

  const handleDelete = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (positionType) {
      const next = removeCustomStrategy(positionType, name);
      setStrategies(next);
    } else {
      removeCustomStrategyEverywhere(name);
      setStrategies(readAllCustomStrategies());
    }
    // If the deleted strategy was selected, clear selection so the
    // trigger doesn't display a phantom name.
    if (name === value) onChange('');
  };

  const handleSubmitNew = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    const targetType: PositionType = positionType ?? addTo;
    addCustomStrategy(targetType, trimmed);
    setStrategies(loadList(positionType));
    onChange(trimmed);
    setAdding(false);
    setNewName('');
    setOpen(false);
  };

  const triggerLabel = value || placeholder;
  const triggerColor = value ? '#e0e0e0' : '#6b7280';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%',
          background: '#0e0f14',
          border: '1px solid #2A3143',
          color: triggerColor,
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          padding: '10px 12px',
          borderRadius: 8,
          cursor: disabled ? 'default' : 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          outline: 'none',
          ...triggerStyle,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{triggerLabel}</span>
        <span style={{ color: '#00d4a0', fontSize: 11, marginLeft: 8, flexShrink: 0 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#0e0f14',
            border: '1px solid #2A3143',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 100,
            maxHeight: 320,
            overflowY: 'auto',
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
          }}
        >
          {strategies.length === 0 && !adding && (
            <div style={{ padding: '14px 12px', color: '#6b7280', fontStyle: 'italic' }}>
              No strategies yet — add one below.
            </div>
          )}
          {strategies.map(name => {
            const isSelected = name === value;
            return (
              <div
                key={name}
                onClick={() => handleSelect(name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 8px 10px 12px',
                  cursor: 'pointer',
                  color: isSelected ? '#00d4a0' : '#e0e0e0',
                  background: isSelected ? 'rgba(0,212,160,0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                <button
                  type="button"
                  onClick={e => handleDelete(name, e)}
                  title="Remove from list (existing trades are unaffected)"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 16,
                    fontWeight: 700,
                    padding: '0 8px',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ff4444'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
                >×</button>
              </div>
            );
          })}

          {/* Add control */}
          {!adding ? (
            <div
              onClick={() => setAdding(true)}
              style={{
                padding: '12px',
                cursor: 'pointer',
                color: '#00d4a0',
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                fontSize: 11,
                background: 'rgba(0,212,160,0.04)',
                borderTop: '1px solid #2A3143',
              }}
            >+ Add new</div>
          ) : (
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid #2A3143',
              background: '#0b0e13',
            }}>
              {/* Union-mode add: trader picks which list to add to */}
              {!positionType && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {(['SHARES', 'OPTIONS', 'FUTURES'] as PositionType[]).map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setAddTo(pt)}
                      style={{
                        flex: 1,
                        background: addTo === pt ? '#00d4a0' : '#0e0f14',
                        color: addTo === pt ? '#0A0D14' : '#a0a3ab',
                        border: addTo === pt ? '1px solid #00d4a0' : '1px solid #2A3143',
                        borderRadius: 6,
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1,
                        padding: '6px 8px',
                        cursor: 'pointer',
                      }}
                    >{pt}</button>
                  ))}
                </div>
              )}
              <input
                ref={addInputRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSubmitNew(); }
                  if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                }}
                placeholder="Strategy name + Enter"
                style={{
                  width: '100%',
                  background: '#0e0f14',
                  border: '1px solid #2A3143',
                  color: '#e0e0e0',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 13,
                  padding: '8px 10px',
                  borderRadius: 6,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleSubmitNew}
                  style={{
                    flex: 1,
                    background: '#00d4a0',
                    color: '#0A0D14',
                    border: 'none',
                    borderRadius: 6,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: '8px',
                    cursor: 'pointer',
                  }}
                >Save</button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setNewName(''); }}
                  style={{
                    flex: 1,
                    background: '#0e0f14',
                    color: '#a0a3ab',
                    border: '1px solid #2A3143',
                    borderRadius: 6,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: '8px',
                    cursor: 'pointer',
                  }}
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function loadList(positionType: PositionType | undefined): string[] {
  return positionType ? readCustomStrategies(positionType) : readAllCustomStrategies();
}

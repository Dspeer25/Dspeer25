'use client';
import React, { useState } from 'react';
import { fm, fd, teal, PURCHASE_URL } from './shared';
import Logo from './Logo';

const RED = '#ff4444';

// Full-screen license gate for Position Calc Pro (lite). Rendered instead
// of the app when there's no stored verified license. On a valid key it
// stores { key, verifiedAt } in localStorage 'pcp_license' and calls
// onUnlock so the parent renders the app.
export default function LicenseLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    const key = licenseKey.trim();
    if (!key || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch('/api/license/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // increment: true — this is the activation, so it consumes one use.
        body: JSON.stringify({ license_key: key, increment: true }),
      });
      const data = await res.json().catch(() => ({ status: 'error' }));

      if (data.status === 'valid') {
        try {
          localStorage.setItem('pcp_license', JSON.stringify({ key, verifiedAt: new Date().toISOString() }));
        } catch { /* ignore storage errors */ }
        onUnlock();
        return; // component unmounts — don't touch state after this
      }

      if (data.status === 'limit') {
        setError('This key has already been activated on the maximum number of devices.');
      } else if (data.status === 'refunded' || data.status === 'disabled') {
        setError('This license is no longer active.');
      } else if (data.status === 'error') {
        setError('Could not reach the license server. Check your connection and try again.');
      } else {
        setError('Invalid license key. Double-check it and try again.');
      }
    } catch {
      setError('Could not reach the license server. Check your connection and try again.');
    }
    setVerifying(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0D14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: fm,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#141822',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '40px 36px',
        boxShadow: '0 24px 60px -12px rgba(0,0,0,0.7)',
        textAlign: 'center',
      }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 4 }}>
          <Logo size={38} />
          <div style={{ fontFamily: fd, fontWeight: 700, letterSpacing: '0.08em', fontSize: 28, lineHeight: 1 }}>
            <span style={{ color: '#d0d0d8' }}>POSITION CALC </span>
            <span style={{ color: teal }}>PRO</span>
          </div>
        </div>
        <div style={{ fontFamily: fm, fontSize: 14, color: '#a0a3ab', marginBottom: 28 }}>A WickCoach product</div>

        <div style={{ fontFamily: fm, fontSize: 15, color: '#e0e0e0', marginBottom: 18, lineHeight: 1.5 }}>
          Enter your license key to unlock the app.
        </div>

        <input
          type="text"
          value={licenseKey}
          onChange={e => { setLicenseKey(e.target.value); if (error) setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') verify(); }}
          placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
          autoFocus
          spellCheck={false}
          style={{
            width: '100%',
            background: 'rgba(6,8,12,0.7)',
            border: `1px solid ${error ? RED : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 8,
            color: '#e0e0e0',
            fontFamily: fm,
            fontSize: 15,
            padding: '13px 15px',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '0.04em',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{ fontFamily: fm, fontSize: 13, color: RED, marginTop: 12, lineHeight: 1.45 }}>
            {error}
          </div>
        )}

        <button
          onClick={verify}
          disabled={verifying || !licenseKey.trim()}
          style={{
            width: '100%',
            marginTop: 18,
            background: verifying || !licenseKey.trim() ? 'rgba(0,212,160,0.35)' : teal,
            color: '#06120e',
            fontFamily: fd,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '14px 0',
            border: 'none',
            borderRadius: 10,
            cursor: verifying || !licenseKey.trim() ? 'default' : 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          {verifying ? 'Verifying…' : 'Unlock'}
        </button>
      </div>

      {/* Buy link */}
      <div style={{ marginTop: 24, fontFamily: fm, fontSize: 14, color: '#a0a3ab', textAlign: 'center' }}>
        Don&rsquo;t have a key?{' '}
        <a
          href={PURCHASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: teal, fontWeight: 600, textDecoration: 'none' }}
        >
          Buy Position Calc Pro — $24
        </a>
      </div>
    </div>
  );
}

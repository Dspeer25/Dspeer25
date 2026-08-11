'use client';
import React, { useState } from "react";
import { Lock } from "lucide-react";
import { fm, fd, teal, isLite, isTabLocked, UPGRADE_URL } from "./shared";
import Logo from "./Logo";

interface NavBarProps {
  view: 'home' | 'app';
  tabs: string[];
  activeTab: string;
  onTabClick: (tab: string) => void;
  onLogoClick: () => void;
  showClickHint?: boolean;
  tabGlow?: boolean;
  onLoginClick?: () => void;
}

export default function NavBar({ view, tabs, activeTab, onTabClick, onLogoClick, showClickHint = false, tabGlow = false, onLoginClick }: NavBarProps) {
  // Which locked tab (if any) is hovered — drives its upgrade tooltip.
  const [hoveredLock, setHoveredLock] = useState<string | null>(null);
  return (
    <>
      {/* Lite has no marketing homepage, so no "back to home" affordance. */}
      {view === 'app' && !isLite() && (
        <div style={{ padding: "12px 24px", background: '#181c26' }}>
          <span onClick={onLogoClick} style={{ color: "#8a8d98", fontFamily: fm, fontSize: 13, cursor: "pointer" }}>&larr; Back to home</span>
        </div>
      )}
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 56px", minHeight: 100, borderBottom: "none", overflow: "visible", position: 'relative', background: '#181c26' }}>
        {isLite() ? (
          // Position Calc Pro branding — same design system, no logo→home nav.
          <div style={{ marginTop: 14, marginBottom: 8, textAlign: 'center' }}>
            <div style={{ fontFamily: fd, fontWeight: 700, letterSpacing: '0.12em', fontSize: 30, lineHeight: 1 }}>
              <span style={{ color: '#d0d0d8' }}>POSITION CALC </span>
              <span style={{ color: teal }}>PRO</span>
            </div>
            <div style={{ fontFamily: fm, fontSize: 12, color: '#a0a3ab', marginTop: 6, letterSpacing: '0.04em' }}>A WickCoach product</div>
          </div>
        ) : (
          <div onClick={view === 'app' ? onLogoClick : undefined} style={{ marginTop: 14, marginBottom: 8, cursor: view === 'app' ? 'pointer' : 'default' }}>
            <Logo size={54} showText />
          </div>
        )}
        {/* Lite swaps the WickCoach Login for a teal-outline upgrade CTA. */}
        {isLite() ? (
        <a
          href={UPGRADE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            top: 40,
            right: 56,
            color: teal,
            fontFamily: fm,
            fontSize: 16,
            cursor: 'pointer',
            fontWeight: 600,
            padding: '8px 22px',
            border: `2px solid ${teal}`,
            borderRadius: 999,
            background: 'transparent',
            letterSpacing: '0.05em',
            textDecoration: 'none',
            transition: 'background 0.2s ease, color 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = teal; e.currentTarget.style.color = '#0A0D14'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = teal; }}
        >Get WickCoach</a>
        ) : (
        <span
          style={{
            position: 'absolute',
            top: 40,
            right: 56,
            color: '#ffffff',
            fontFamily: fm,
            fontSize: 16,
            cursor: 'pointer',
            fontWeight: 500,
            padding: '8px 22px',
            border: '2px solid #ffffff',
            borderRadius: 999,
            background: 'transparent',
            letterSpacing: '0.05em',
            transition: 'background 0.2s ease, color 0.2s ease',
          }}
          onClick={onLoginClick}
          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#0A0D14'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
        >Login</span>
        )}
        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 1000, marginBottom: 0 }}>
          {tabs.map((t, idx) => {
            const locked = isTabLocked(t);
            const isActive = view === 'app' && activeTab === t && !locked;
            const isTools = t === 'Tools' && !locked;
            // Color swatches: Tools uses white, all others use teal
            const accent = isTools ? '#ffffff' : '#00d4a0';
            const bgActive = isTools ? 'rgba(255,255,255,0.18)' : 'rgba(0,212,160,0.2)';
            const bgIdle = isTools ? 'rgba(255,255,255,0.06)' : 'rgba(0,212,160,0.08)';
            const bgHover = isTools ? 'rgba(255,255,255,0.18)' : 'rgba(0,212,160,0.2)';
            const borderIdle = isTools ? 'rgba(255,255,255,0.55)' : 'rgba(0,212,160,0.6)';

            // LOCKED tab (lite only): visible, muted, with a lock icon and an
            // upgrade tooltip. onClick is inert — it never calls onTabClick,
            // so activeTab can't change and the component can't mount. No
            // attention pulse. The tooltip <a> is a DOM child so hovering it
            // keeps it open; paddingTop bridges the gap to the tab.
            if (locked) {
              return (
                <span
                  key={t}
                  onClick={() => {}}
                  onMouseEnter={() => setHoveredLock(t)}
                  onMouseLeave={() => setHoveredLock(null)}
                  style={{
                    position: 'relative',
                    fontSize: 17,
                    color: '#a0a3ab',
                    letterSpacing: '0.03em',
                    padding: '10px 16px',
                    cursor: 'default',
                    fontFamily: 'Chakra Petch, sans-serif',
                    borderRadius: 8,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.03)',
                    border: '2px solid rgba(255,255,255,0.10)',
                    flex: 1,
                    textAlign: 'center',
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                  }}
                >
                  {t}
                  <Lock size={13} color="#a0a3ab" strokeWidth={2} />
                  {hoveredLock === t && (
                    <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', paddingTop: 10, zIndex: 60 }}>
                      <a
                        href={UPGRADE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          width: 230,
                          background: '#141822',
                          border: '1px solid rgba(0,212,160,0.4)',
                          borderRadius: 10,
                          padding: '12px 16px',
                          boxShadow: '0 10px 32px rgba(0,0,0,0.55), 0 0 20px rgba(0,212,160,0.12)',
                          textAlign: 'center',
                          textDecoration: 'none',
                          fontFamily: fm,
                        }}
                      >
                        <span style={{ display: 'block', fontFamily: fd, fontSize: 14, fontWeight: 700, color: teal, lineHeight: 1.4 }}>Unlock with WickCoach</span>
                        <span style={{ display: 'block', fontSize: 12, color: '#a0a3ab', marginTop: 4, letterSpacing: '0.02em' }}>Get the full product</span>
                      </a>
                    </span>
                  )}
                </span>
              );
            }

            return (
              <span
                key={t}
                onClick={() => onTabClick(t)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = bgHover; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isActive ? accent : borderIdle; e.currentTarget.style.background = isActive ? bgActive : bgIdle; }}
                style={{
                  fontSize: 17,
                  color: accent,
                  letterSpacing: "0.03em",
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontFamily: "Chakra Petch, sans-serif",
                  borderRadius: 8,
                  fontWeight: 700,
                  background: isActive ? bgActive : bgIdle,
                  border: isActive ? `2px solid ${accent}` : `2px solid ${borderIdle}`,
                  flex: 1,
                  textAlign: "center",
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.3s ease',
                  animation: !isActive
                    ? `${isTools ? 'tabPulseWhite' : 'tabPulse'} 3s ease-in-out ${idx * 0.4}s infinite`
                    : 'none',
                }}
              >{t}</span>
            );
          })}
        </div>
        <style>{`
          @keyframes tabPulse {
            0%, 100% { border-color: rgba(0,212,160,0.6); box-shadow: 0 0 0 0 rgba(0,212,160,0); }
            50% { border-color: #00d4a0; box-shadow: 0 0 12px rgba(0,212,160,0.3); }
          }
          @keyframes tabPulseWhite {
            0%, 100% { border-color: rgba(255,255,255,0.55); box-shadow: 0 0 0 0 rgba(255,255,255,0); }
            50% { border-color: #ffffff; box-shadow: 0 0 12px rgba(255,255,255,0.25); }
          }
        `}</style>
      </nav>
    </>
  );
}




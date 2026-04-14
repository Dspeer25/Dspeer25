'use client';
import React from "react";
import { fm, teal } from "./shared";
import Logo from "./Logo";

interface NavBarProps {
  view: 'home' | 'app';
  tabs: string[];
  activeTab: string;
  onTabClick: (tab: string) => void;
  onLogoClick: () => void;
  showClickHint?: boolean;
  tabGlow?: boolean;
  profileTabGlow?: boolean;
  traderProfileTabRef?: React.RefObject<HTMLSpanElement | null>;
}

export default function NavBar({ view, tabs, activeTab, onTabClick, onLogoClick, showClickHint = false, tabGlow = false, profileTabGlow = false, traderProfileTabRef }: NavBarProps) {
  return (
    <>
      {view === 'app' && (
        <div style={{ padding: "12px 24px" }}>
          <span onClick={onLogoClick} style={{ color: "#6b7280", fontFamily: fm, fontSize: 13, cursor: "pointer" }}>&larr; Back to home</span>
        </div>
      )}
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 56px", minHeight: 100, borderBottom: "none", overflow: "visible", position: 'relative', background: '#181c26' }}>
        <div onClick={view === 'app' ? onLogoClick : undefined} style={{ marginTop: 14, marginBottom: 8, cursor: view === 'app' ? 'pointer' : 'default' }}>
          <Logo size={54} showText />
        </div>
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
          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#0A0D14'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffffff'; }}
        >Login</span>
        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 1000, marginBottom: 0 }}>
          {tabs.map((t, idx) => {
            const isActive = view === 'app' && activeTab === t;
            const isTools = t === 'Tools';
            // Color swatches: Tools uses white, all others use teal
            const accent = isTools ? '#ffffff' : '#00d4a0';
            const bgActive = isTools ? 'rgba(255,255,255,0.18)' : 'rgba(0,212,160,0.2)';
            const bgIdle = isTools ? 'rgba(255,255,255,0.06)' : 'rgba(0,212,160,0.08)';
            const bgHover = isTools ? 'rgba(255,255,255,0.18)' : 'rgba(0,212,160,0.2)';
            const borderIdle = isTools ? 'rgba(255,255,255,0.55)' : 'rgba(0,212,160,0.6)';
            return (
              <span
                ref={t === 'Trader Profile' ? traderProfileTabRef : undefined}
                key={t}
                onClick={() => onTabClick(t)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = bgHover; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isActive ? accent : borderIdle; e.currentTarget.style.background = isActive ? bgActive : bgIdle; }}
                style={{
                  fontSize: 24,
                  color: accent,
                  letterSpacing: "0.03em",
                  padding: "14px 24px",
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
                  boxShadow: t === 'Trader Profile' && profileTabGlow ? '0 0 15px rgba(0,212,160,0.4)' : 'none',
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




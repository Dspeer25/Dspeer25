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
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 56px", minHeight: 104, borderBottom: "none", overflow: "visible", position: 'relative', background: 'transparent' }}>
        <div onClick={view === 'app' ? onLogoClick : undefined} style={{ marginTop: 22, marginBottom: 22, cursor: view === 'app' ? 'pointer' : 'default' }}>
          <Logo size={44} showText />
        </div>
        <span style={{ position: 'absolute', top: 40, right: 56, color: '#00d4a0', fontFamily: fm, fontSize: 18, cursor: 'pointer', fontWeight: 500 }}>Login</span>
        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 1000, marginBottom: 12 }}>
          {tabs.map((t, idx) => {
            const isActive = view === 'app' && activeTab === t;
            return (
              <span
                ref={t === 'Trader Profile' ? traderProfileTabRef : undefined}
                key={t}
                onClick={() => onTabClick(t)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4a0'; e.currentTarget.style.background = 'rgba(0,212,160,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isActive ? '#00d4a0' : 'rgba(0,212,160,0.6)'; e.currentTarget.style.background = isActive ? 'rgba(0,212,160,0.2)' : 'rgba(0,212,160,0.08)'; }}
                style={{
                  fontSize: 18,
                  color: '#00d4a0',
                  letterSpacing: "0.03em",
                  padding: "16px 42px",
                  cursor: "pointer",
                  fontFamily: "Chakra Petch, sans-serif",
                  borderRadius: 8,
                  fontWeight: 600,
                  background: isActive ? "rgba(0,212,160,0.2)" : "rgba(0,212,160,0.08)",
                  border: isActive ? '1px solid #00d4a0' : '1px solid rgba(0,212,160,0.6)',
                  flex: 1,
                  textAlign: "center",
                  lineHeight: 1.5,
                  boxShadow: t === 'Trader Profile' && profileTabGlow ? '0 0 15px rgba(0,212,160,0.4)' : 'none',
                  transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.3s ease',
                  animation: !isActive
                    ? `tabPulse 3s ease-in-out ${idx * 0.4}s infinite`
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
        `}</style>
      </nav>
    </>
  );
}




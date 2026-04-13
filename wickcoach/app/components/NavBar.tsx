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
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 56px", minHeight: 80, borderBottom: "1px solid #2A3143", overflow: "visible", position: 'relative', background: 'transparent' }}>
        <div onClick={view === 'app' ? onLogoClick : undefined} style={{ marginTop: 18, marginBottom: 18, cursor: view === 'app' ? 'pointer' : 'default' }}>
          <Logo size={32} showText />
        </div>
        <span style={{ position: 'absolute', top: 30, right: 56, color: '#00d4a0', fontFamily: fm, fontSize: 15, cursor: 'pointer', fontWeight: 500 }}>Login</span>
        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 1000, marginBottom: 12 }}>
          {tabs.map((t, idx) => {
            const isActive = view === 'app' && activeTab === t;
            return (
              <span
                ref={t === 'Trader Profile' ? traderProfileTabRef : undefined}
                key={t}
                onClick={() => onTabClick(t)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,160,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isActive ? '#00d4a0' : 'rgba(0,212,160,0.3)'; }}
                style={{
                  fontSize: 15,
                  color: isActive ? '#00d4a0' : teal,
                  letterSpacing: "0.02em",
                  padding: "12px 32px",
                  cursor: "pointer",
                  fontFamily: fm,
                  borderRadius: 8,
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? "rgba(0,212,160,0.15)" : "transparent",
                  border: isActive ? '1px solid #00d4a0' : '1px solid rgba(0,212,160,0.3)',
                  flex: 1,
                  textAlign: "center",
                  lineHeight: 1.5,
                  boxShadow: t === 'Trader Profile' && profileTabGlow ? '0 0 15px rgba(0,212,160,0.4)' : 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.3s ease',
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
            0%, 100% { border-color: rgba(0,212,160,0.25); }
            50% { border-color: rgba(0,212,160,0.5); }
          }
        `}</style>
      </nav>
    </>
  );
}


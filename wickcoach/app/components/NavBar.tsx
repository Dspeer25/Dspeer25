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
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 56px", minHeight: 85, borderBottom: "1px solid #1a1b22", overflow: "visible", position: 'relative' }}>
        <div onClick={view === 'app' ? onLogoClick : undefined} style={{ marginTop: 22, marginBottom: 22, cursor: view === 'app' ? 'pointer' : 'default' }}>
          <Logo size={32} showText />
        </div>
        <span style={{ position: 'absolute', top: 32, right: 56, color: teal, fontFamily: fm, fontSize: 16, cursor: 'pointer', fontWeight: 500 }}>Login</span>
        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 1000, marginBottom: 12 }}>
          {tabs.map((t, idx) => (
            <span
              ref={t === 'Trader Profile' ? traderProfileTabRef : undefined}
              key={t}
              onClick={() => onTabClick(t)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,160,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = view === 'app' && activeTab === t ? 'rgba(0,212,160,0.6)' : 'rgba(0,212,160,0.3)'; }}
              style={{
                fontSize: 15, color: teal, letterSpacing: "0.04em", padding: "14px 36px", cursor: "pointer", fontFamily: fm, borderRadius: 8, fontWeight: 600,
                background: view === 'app' && activeTab === t ? "rgba(0,212,160,0.18)" : "rgba(0,212,160,0.05)",
                border: view === 'app' && activeTab === t ? '1px solid rgba(0,212,160,0.6)' : '1px solid rgba(0,212,160,0.3)',
                flex: 1, textAlign: "center", lineHeight: 1.5,
                boxShadow: t === 'Trader Profile' && profileTabGlow ? '0 0 15px rgba(0,212,160,0.4)' : 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.3s ease',
                animation: view === 'home'
                  ? `tabPulse 3s ease-in-out ${idx * 0.4}s infinite`
                  : 'none',
              }}
            >{t}</span>
          ))}
        </div>
        <style>{`
          @keyframes tabPulse {
            0%, 100% { border-color: rgba(0,212,160,0.25); box-shadow: 0 0 0 0 rgba(0,212,160,0); }
            50% { border-color: rgba(0,212,160,0.5); box-shadow: 0 0 8px rgba(0,212,160,0.15); }
          }
        `}</style>
      </nav>
    </>
  );
}


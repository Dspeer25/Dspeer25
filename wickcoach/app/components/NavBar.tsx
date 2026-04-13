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
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 48px", minHeight: 72, borderBottom: "1px solid #1a1b22", overflow: "visible", position: 'relative' }}>
        <div onClick={view === 'app' ? onLogoClick : undefined} style={{ marginTop: 20, marginBottom: 20, cursor: view === 'app' ? 'pointer' : 'default' }}>
          <Logo size={28} showText />
        </div>
        <span style={{ position: 'absolute', top: 28, right: 48, color: teal, fontFamily: fm, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Login</span>
        <div style={{ display: "flex", gap: 5, width: "100%", maxWidth: 920 }}>
          {tabs.map(t => (
            <span
              ref={t === 'Trader Profile' ? traderProfileTabRef : undefined}
              key={t}
              onClick={() => onTabClick(t)}
              style={{
                fontSize: 14, color: teal, letterSpacing: "0.04em", padding: "12px 28px", cursor: "pointer", fontFamily: fm, borderRadius: "8px 8px 0 0", fontWeight: 600,
                background: view === 'app' && activeTab === t ? "rgba(0,212,160,0.18)" : "rgba(0,212,160,0.05)",
                borderTop: view === 'app' && activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.3)",
                borderRight: view === 'app' && activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.3)",
                borderBottom: "none",
                borderLeft: view === 'app' && activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.3)",
                flex: 1, textAlign: "center", lineHeight: 1.5,
                boxShadow: t === 'Trader Profile' && profileTabGlow ? '0 0 15px rgba(0,212,160,0.4)' : 'none',
                transition: 'box-shadow 0.3s ease',
                animation: view === 'home' && showClickHint ? "iconGlowPulse 1s ease-in-out 3" : view === 'home' && tabGlow ? "tabPulse 1.4s ease infinite" : "none",
              }}
            >{t}</span>
          ))}
        </div>
        {view === 'home' && (
          <div style={{ textAlign: 'center', marginTop: 8, height: 16 }}>
            <span style={{ fontFamily: fm, fontSize: 11, color: '#9ca3af', opacity: showClickHint ? 1 : 0, transition: 'opacity 0.5s ease' }}>click these ↑</span>
          </div>
        )}
        <style>{`@keyframes iconGlowPulse { 0%,100% { box-shadow: 0 0 0px rgba(0,212,160,0); } 50% { box-shadow: 0 0 12px rgba(0,212,160,0.4); } }`}</style>
      </nav>
    </>
  );
}

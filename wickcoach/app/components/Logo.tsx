'use client';
import React from "react";
import { fd, teal } from "./shared";

const Logo = ({ size = 16, showText = false }: { size?: number; showText?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.5 }}>
    <svg width={size} height={size * 1.2} viewBox="0 0 20 24" fill="none">
      <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
      <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
      <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
    </svg>
    {showText && (
      <span style={{ fontSize: size * 0.8, letterSpacing: "0.12em", fontWeight: 700, fontFamily: fd }}>
        <span style={{ color: "#d0d0d8" }}>WICK</span>
        <span style={{ color: teal }}>COACH</span>
      </span>
    )}
  </div>
);

export const MiniStickFigure = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 20 24" fill="none">
    <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
    <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="15.5" y1="2" x2="15.5" y2="12" stroke="#00d4a0" strokeWidth="0.8" />
    <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill="#00d4a0" opacity="0.9" />
  </svg>
);

export default Logo;

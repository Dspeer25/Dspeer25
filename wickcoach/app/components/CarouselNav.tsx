'use client';
import React from "react";
import { fm, fd, teal } from "./shared";

const categories = [
  { label: "Trading Goals", d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
  { label: "Log a Trade", d: "M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" },
  { label: "Past Trades", d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2" },
  { label: "Analysis", d: "M18 20V10M12 20V4M6 20v-6" },
  { label: "Trader Profile", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
  { label: "Position Sizer", d: "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h8M8 10h8M8 14h4" },
  { label: "Growth Simulator", d: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
  { label: "Trade Timeline", d: "M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M1 10h22" },
];

interface CarouselNavProps {
  activeCategory: number;
  onCategoryClick: (index: number) => void;
  textVisible: boolean;
}

export default function CarouselNav({ activeCategory, onCategoryClick, textVisible }: CarouselNavProps) {
  return (
    <>
      <style>{`
        @keyframes carouselIconPulse { 0%,100% { box-shadow: 0 0 0px rgba(0,212,160,0); border-color: rgba(255,255,255,0.06); } 50% { box-shadow: 0 0 15px rgba(0,212,160,0.4); border-color: rgba(0,212,160,0.4); } }
        @keyframes exploreSlideIn { 0% { opacity: 0; transform: translateX(-40px) translateY(-50%); } 100% { opacity: 1; transform: translateX(0) translateY(-50%); } }
        @keyframes exploreArrowBounce { 0%,100% { transform: translateX(0); } 50% { transform: translateX(8px); } }
      `}</style>
      <div style={{ position: 'relative' }}>
        {textVisible && (
          <div style={{ position: 'absolute', left: 20, top: '35%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 2, animation: 'exploreSlideIn 0.8s ease-out 1.5s both' }}>
            <span style={{ fontFamily: fd, fontSize: 16, color: '#00d4a0', fontWeight: 700, letterSpacing: '0.05em', textShadow: '0 0 20px rgba(0,212,160,0.4)' }}>Explore</span>
            <svg width="36" height="18" viewBox="0 0 36 18" fill="none" style={{ animation: 'exploreArrowBounce 1s ease-in-out infinite 2.5s' }}>
              <path d="M0 9 L26 9" stroke="#00d4a0" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 3 L30 9 L22 15" stroke="#00d4a0" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 24 }}>
          {categories.map((cat, i) => {
            const isActive = activeCategory === i;
            return (
              <div key={i} onClick={() => onCategoryClick(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'linear-gradient(135deg, rgba(0,212,160,0.25), rgba(0,212,160,0.1))' : 'rgba(255,255,255,0.03)', border: isActive ? '1px solid rgba(0,212,160,0.5)' : '1px solid rgba(255,255,255,0.06)', boxShadow: isActive ? '0 0 20px rgba(0,212,160,0.4), 0 0 50px rgba(0,212,160,0.25), 0 0 100px rgba(0,212,160,0.18)' : 'none', transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.3s ease', animation: !isActive && textVisible ? 'carouselIconPulse 1.5s ease-in-out infinite' : 'none', }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? teal : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={cat.d} /></svg>
                </div>
                <span style={{ fontFamily: fm, fontSize: 13, color: isActive ? teal : '#6b7280', textAlign: 'center', whiteSpace: 'nowrap' as const, transition: 'color 0.3s ease' }}>{cat.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}


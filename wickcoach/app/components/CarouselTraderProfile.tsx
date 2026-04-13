'use client'
import React from "react"
import { fm, fd, teal } from "./shared"

export default function CarouselTraderProfile() {
  const cx2 = 120, cy2 = 110, mR2 = 80;
  const sc = [93, 85, 90, 91, 78];
  const ang2 = sc.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2);
  const pts = sc.map((s, i) => `${cx2 + mR2 * (s / 100) * Math.cos(ang2[i])},${cy2 + mR2 * (s / 100) * Math.sin(ang2[i])}`).join(" ");
  const ptsFull = [100,100,100,100,100].map((s, i) => `${cx2 + mR2 * (s / 100) * Math.cos(ang2[i])},${cy2 + mR2 * (s / 100) * Math.sin(ang2[i])}`).join(" ");
  return (<div style={{ textAlign: "center" }}>
    <svg width="240" height="240" viewBox="0 0 240 240"><polygon points={ptsFull} fill="none" stroke="#1a1b22" strokeWidth="1" /><polygon points={pts} fill="rgba(0,212,160,0.1)" stroke={teal} strokeWidth="2" /></svg>
    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>{[{ l: "142 trades", v: "logged" }, { l: "58%", v: "win rate" }, { l: "1.8", v: "avg R:R" }].map((s, i) => (<div key={i} style={{ background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 8, padding: "12px 20px", textAlign: "center" }}><div style={{ color: "#fff", fontFamily: fm, fontSize: 16, fontWeight: 700 }}>{s.l}</div><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11 }}>{s.v}</div></div>))}</div>
    <div style={{ color: "#6b7280", fontFamily: fm, fontSize: 12, marginTop: 14 }}>Trading since: Oct 2025</div>
  </div>);
}

export function MockPositionSizer() {
  const is = { background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 8, padding: "10px 12px", color: "#fff", fontFamily: fm, fontSize: 13, width: "100%" };
  return (<div>
    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Account Balance</div><div style={is}>$25,000</div></div><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Risk per Trade</div><div style={is}>2%</div></div></div>
    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Entry Price</div><div style={is}>$485.00</div></div><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Stop Loss</div><div style={is}>$480.00</div></div></div>
    <div style={{ background: "rgba(0,212,160,0.06)", border: "1px solid rgba(0,212,160,0.15)", borderRadius: 10, padding: "20px", textAlign: "center" }}><div style={{ color: teal, fontFamily: fm, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>RESULT</div><div style={{ color: "#fff", fontFamily: fd, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Position Size: 100 shares</div><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 14 }}>Risk Amount: $500</div></div>
  </div>);
}

export function MockGrowthSimulator() {
  return (<div>
    <svg viewBox="0 0 400 200" style={{ width: "100%", height: 200 }}>
      <line x1="40" y1="180" x2="380" y2="180" stroke="#1a1b22" strokeWidth="1" />
      <line x1="40" y1="10" x2="40" y2="180" stroke="#1a1b22" strokeWidth="1" />
      <polyline points="40,170 80,155 120,140 160,130 200,110 240,95 280,75 320,55 360,30" fill="none" stroke={teal} strokeWidth="2.5" />
      <polyline points="40,170 80,165 120,162 160,158 200,155 240,150 280,148 320,144 360,140" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 4" />
      {["1","3","6","9","12"].map((m, i) => <text key={i} x={40 + i * 80} y={196} fill="#6b7280" fontSize="10" fontFamily={fm} textAnchor="middle">Mo {m}</text>)}
    </svg>
    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>{[{ l: "$10,000", v: "Starting" }, { l: "$18,400", v: "Projected 12mo" }, { l: "5.2%", v: "Monthly Return" }].map((s, i) => (<div key={i} style={{ flex: 1, background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 8, padding: "12px", textAlign: "center" }}><div style={{ color: "#fff", fontFamily: fm, fontSize: 16, fontWeight: 700 }}>{s.l}</div><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11 }}>{s.v}</div></div>))}</div>
  </div>);
}

export function MockTradeTimeline() {
  const days = ["Mon","Tue","Wed","Thu","Fri"];
  const weeks = [["+$340","-$220","+$180","","+$290"],["-$150","+$410","","+$180","-$95"],["+$510","","+$245","-$130","+$195"],["+$380","-$180","+$445","","+$355"]];
  return (<div>
    <div style={{ color: "#fff", fontFamily: fd, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>March 2026 &mdash; 18 trades, 11 wins, $2,840 net</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
      {days.map(d => <div key={d} style={{ textAlign: "center", color: "#6b7280", fontFamily: fm, fontSize: 10, paddingBottom: 4 }}>{d}</div>)}
      {weeks.flat().map((v, i) => { const isW = v.startsWith("+"); return <div key={i} style={{ background: v ? (isW ? "rgba(0,212,160,0.1)" : "rgba(239,68,68,0.1)") : "#0e0f14", border: `1px solid ${v ? (isW ? "rgba(0,212,160,0.2)" : "rgba(239,68,68,0.2)") : "#1a1b22"}`, borderRadius: 6, padding: "10px 4px", textAlign: "center", fontFamily: fm, fontSize: 11, fontWeight: 700, color: v ? (isW ? teal : "#ef4444") : "#2a2b35", minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>{v || "\u2014"}</div>; })}
    </div>
  </div>);
}


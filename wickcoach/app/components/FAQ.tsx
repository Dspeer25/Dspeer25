'use client';
import React from "react";
import { fm, teal } from "./shared";

export default function FAQ({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ borderBottom: "1px solid #1a1a24", padding: "22px 0", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 16, color: "#d0d0d8", fontFamily: fm, fontWeight: 500 }}>{q}</span>
        <span style={{ fontSize: 20, color: teal, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none", lineHeight: 1 }}>+</span>
      </div>
      <div style={{ maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
        <div style={{ fontSize: 15, color: "#9a9da8", lineHeight: 1.75, paddingTop: 14, fontFamily: fm }}>{a}</div>
      </div>
    </div>
  );
}


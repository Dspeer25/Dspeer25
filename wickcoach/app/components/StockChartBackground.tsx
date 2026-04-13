'use client';
import React from "react";
import { fd } from "./shared";

export default function StockChartBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', opacity: 0.045 }}>
      <svg viewBox="0 0 1400 800" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <text x="700" y="450" textAnchor="middle" style={{ fontFamily: fd, fontSize: 140, fontWeight: 700, fill: 'rgba(255,255,255,0.4)' }} transform="rotate(-12, 700, 450)">WickCoach · 1D</text>
        {/* Consolidation (1-8) */}
        <line x1="80" y1="380" x2="80" y2="440" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="74" y="395" width="12" height="30" fill="rgba(255,255,255,0.4)"/>
        <line x1="128" y1="370" x2="128" y2="445" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="122" y="385" width="12" height="35" fill="rgba(0,255,136,0.3)"/>
        <line x1="176" y1="375" x2="176" y2="450" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="170" y="390" width="12" height="38" fill="rgba(255,255,255,0.4)"/>
        <line x1="224" y1="365" x2="224" y2="435" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="218" y="380" width="12" height="32" fill="rgba(0,255,136,0.3)"/>
        <line x1="272" y1="372" x2="272" y2="448" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="266" y="388" width="12" height="40" fill="rgba(255,255,255,0.4)"/>
        <line x1="320" y1="360" x2="320" y2="440" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="314" y="375" width="12" height="38" fill="rgba(0,255,136,0.3)"/>
        <line x1="368" y1="355" x2="368" y2="430" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="362" y="368" width="12" height="42" fill="rgba(255,255,255,0.4)"/>
        <line x1="416" y1="350" x2="416" y2="425" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="410" y="362" width="12" height="36" fill="rgba(0,255,136,0.3)"/>
        {/* Breakout (9-16) */}
        <line x1="468" y1="310" x2="468" y2="420" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="462" y="325" width="12" height="75" fill="rgba(0,255,136,0.3)"/>
        <line x1="516" y1="270" x2="516" y2="400" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="510" y="285" width="12" height="90" fill="rgba(0,255,136,0.3)"/>
        <line x1="564" y1="240" x2="564" y2="380" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="558" y="255" width="12" height="100" fill="rgba(0,255,136,0.3)"/>
        <line x1="612" y1="210" x2="612" y2="360" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="606" y="225" width="14" height="110" fill="rgba(0,255,136,0.3)"/>
        <line x1="660" y1="190" x2="660" y2="340" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="654" y="205" width="14" height="115" fill="rgba(0,255,136,0.3)"/>
        <line x1="708" y1="175" x2="708" y2="320" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="702" y="190" width="14" height="105" fill="rgba(0,255,136,0.3)"/>
        <line x1="756" y1="160" x2="756" y2="300" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="750" y="175" width="14" height="100" fill="rgba(0,255,136,0.3)"/>
        <line x1="804" y1="150" x2="804" y2="290" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="798" y="165" width="14" height="98" fill="rgba(0,255,136,0.3)"/>
        {/* Pullback (17-21) */}
        <line x1="852" y1="165" x2="852" y2="310" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="846" y="185" width="14" height="95" fill="rgba(255,255,255,0.4)"/>
        <line x1="900" y1="195" x2="900" y2="330" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="894" y="215" width="14" height="85" fill="rgba(255,255,255,0.4)"/>
        <line x1="948" y1="220" x2="948" y2="340" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="942" y="235" width="14" height="75" fill="rgba(255,255,255,0.4)"/>
        <line x1="996" y1="230" x2="996" y2="345" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="990" y="242" width="14" height="70" fill="rgba(255,255,255,0.4)"/>
        <line x1="1044" y1="240" x2="1044" y2="350" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1038" y="252" width="14" height="65" fill="rgba(0,255,136,0.3)"/>
        {/* Recovery (22-28) */}
        <line x1="1092" y1="210" x2="1092" y2="340" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1086" y="225" width="14" height="85" fill="rgba(0,255,136,0.3)"/>
        <line x1="1140" y1="185" x2="1140" y2="320" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1134" y="200" width="14" height="90" fill="rgba(0,255,136,0.3)"/>
        <line x1="1188" y1="165" x2="1188" y2="305" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1182" y="178" width="14" height="95" fill="rgba(0,255,136,0.3)"/>
        <line x1="1236" y1="148" x2="1236" y2="290" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1230" y="162" width="14" height="100" fill="rgba(0,255,136,0.3)"/>
        <line x1="1284" y1="135" x2="1284" y2="275" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1278" y="148" width="14" height="98" fill="rgba(0,255,136,0.3)"/>
        <line x1="1332" y1="120" x2="1332" y2="260" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1326" y="135" width="14" height="100" fill="rgba(0,255,136,0.3)"/>
        <line x1="1380" y1="105" x2="1380" y2="250" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1374" y="118" width="14" height="105" fill="rgba(0,255,136,0.3)"/>
        {/* 20 SMA */}
        <path d="M 80 410 C 150 405, 250 395, 350 385 C 420 378, 470 355, 540 320 C 600 290, 650 260, 720 235 C 780 215, 820 205, 860 230 C 900 250, 940 270, 980 280 C 1020 275, 1060 260, 1100 240 C 1150 220, 1200 195, 1260 175 C 1300 160, 1350 145, 1380 135" fill="none" stroke="rgba(0,212,160,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
        {/* 200 SMA */}
        <path d="M 80 430 C 200 425, 350 415, 500 395 C 600 380, 700 360, 800 340 C 900 325, 1000 315, 1100 300 C 1200 288, 1300 275, 1380 265" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}


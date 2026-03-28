'use client';

import { useState, useEffect } from 'react';

export interface WheelAttribute {
  name: string;
  value: number; // 0-99
  color: string;
}

interface AttributeWheelProps {
  attrs: WheelAttribute[];
  light: boolean;
}

export default function AttributeWheel({ attrs, light }: AttributeWheelProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const cx = 380;
  const cy = 380;
  const maxRadius = 240;
  const minRadius = 30;
  const spokeWidth = 10;
  const n = attrs.length;
  const angleStep = (2 * Math.PI) / n;
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 760 760" className="w-full max-w-[560px] mx-auto">
      <defs>
        {attrs.map((attr, i) => {
          const id = `spoke-grad-${i}`;
          return (
            <linearGradient key={id} id={id} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={attr.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={attr.color} stopOpacity="0.4" />
            </linearGradient>
          );
        })}
      </defs>

      {/* Concentric guide circles */}
      {rings.map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={minRadius + r * (maxRadius - minRadius)}
          fill="none"
          stroke={light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}
          strokeWidth="1"
        />
      ))}

      {/* Spoke lines (faint guides) */}
      {attrs.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x2 = cx + Math.cos(angle) * maxRadius;
        const y2 = cy + Math.sin(angle) * maxRadius;
        return (
          <line key={`guide-${i}`} x1={cx} y1={cy} x2={x2} y2={y2}
            stroke={light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}
            strokeWidth="1"
          />
        );
      })}

      {/* Attribute spokes (wedge shapes) */}
      {attrs.map((attr, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const length = animated ? minRadius + (attr.value / 99) * (maxRadius - minRadius) : minRadius;

        const tipWidthAngle = spokeWidth / length;
        const baseWidthAngle = 3 / minRadius;

        const baseLX = cx + Math.cos(angle - baseWidthAngle) * minRadius;
        const baseLY = cy + Math.sin(angle - baseWidthAngle) * minRadius;
        const baseRX = cx + Math.cos(angle + baseWidthAngle) * minRadius;
        const baseRY = cy + Math.sin(angle + baseWidthAngle) * minRadius;
        const tipLX = cx + Math.cos(angle - tipWidthAngle) * length;
        const tipLY = cy + Math.sin(angle - tipWidthAngle) * length;
        const tipRX = cx + Math.cos(angle + tipWidthAngle) * length;
        const tipRY = cy + Math.sin(angle + tipWidthAngle) * length;

        const path = `M ${baseLX} ${baseLY} L ${tipLX} ${tipLY} L ${tipRX} ${tipRY} L ${baseRX} ${baseRY} Z`;

        return (
          <path
            key={`spoke-${i}`}
            d={path}
            fill={`url(#spoke-grad-${i})`}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 4px ${attr.color}40)` }}
          />
        );
      })}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={minRadius - 4} fill={light ? '#f0f0eb' : '#1a1a1a'} />
      <circle cx={cx} cy={cy} r={minRadius - 4}
        fill="none"
        stroke={light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}
        strokeWidth="1.5"
      />
      <circle cx={cx} cy={cy} r={6} fill={light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)'} />

      {/* Labels */}
      {attrs.map((attr, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const labelR = maxRadius + 32;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;

        // Determine text-anchor based on position around the circle
        const degrees = ((angle + Math.PI / 2) * 180 / Math.PI + 360) % 360;
        let anchor: 'middle' | 'start' | 'end' = 'middle';
        if (degrees > 30 && degrees < 150) anchor = 'start';
        if (degrees > 210 && degrees < 330) anchor = 'end';

        return (
          <text key={`label-${i}`} x={lx} y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="text-[11px] font-bold uppercase"
            style={{
              fill: light ? '#888' : '#888',
              letterSpacing: '0.08em',
              fontSize: '11px',
            }}
          >
            {attr.name}
          </text>
        );
      })}
    </svg>
  );
}

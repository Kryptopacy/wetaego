"use client";

import React, { useMemo } from 'react';
import qrcode from 'qrcode';

interface DynamicQRProps {
  value: string;
  color?: string;
  logoUrl?: string;
  centerText?: string;
  size?: number;
}

export function DynamicQR({
  value,
  color = '#0f7b55',
  logoUrl,
  centerText = 'OM',
  size = 400
}: DynamicQRProps) {
  const qrData = useMemo(() => {
    try {
      return qrcode.create(value, { errorCorrectionLevel: 'H' });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [value]);

  if (!qrData) return null;

  const N = qrData.modules.size;
  const CANVAS = size;
  const M = CANVAS / N;
  const cx = CANVAS / 2;
  const cy = CANVAS / 2;

  // We cut out an 8x8 module area in the center
  const OM_HALF = 4;
  const centerStart = Math.floor(N / 2) - OM_HALF;
  const centerEnd = Math.floor(N / 2) + OM_HALF;

  const isFinder = (x: number, y: number) => {
    return (x < 7 && y < 7) || (x > N - 8 && y < 7) || (x < 7 && y > N - 8);
  };

  const isCenter = (x: number, y: number) => {
    return x >= centerStart && x < centerEnd && y >= centerStart && y < centerEnd;
  };

  // Generate paths for dots
  let dotsPath = "";
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (isFinder(x, y) || isCenter(x, y)) continue;
      if (qrData.modules.data[y * N + x]) {
        const px = x * M;
        const py = y * M;
        // rounded module
        const r = M * 0.4;
        dotsPath += ` M ${px + r} ${py} h ${M - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${M - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} h -${M - 2 * r} a ${r} ${r} 0 0 1 -${r} -${r} v -${M - 2 * r} a ${r} ${r} 0 0 1 ${r} -${r} Z`;
      }
    }
  }

  // Finder pattern
  const renderFinder = (offsetX: number, offsetY: number) => {
    const px = offsetX * M;
    const py = offsetY * M;
    const s = 7 * M;
    const outerR = s * 0.25;
    
    const iPx = px + 1.25 * M;
    const iPy = py + 1.25 * M;
    const iS = 4.5 * M;
    const innerR = iS * 0.25;

    return (
      <g key={`${offsetX}-${offsetY}`}>
        <rect x={px} y={py} width={s} height={s} rx={outerR} fill="none" stroke="#ffffff" strokeWidth={M} />
        <rect x={iPx} y={iPy} width={iS} height={iS} rx={innerR} fill="#ffffff" />
      </g>
    );
  };

  // Center box
  const boxSize = 8 * M;
  const boxR = boxSize * 0.22;

  const gradientId = `qr-grad-${value.substring(0, 10).replace(/[^a-z0-9]/gi,'')}`;

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={CANVAS} 
      height={CANVAS} 
      viewBox={`0 0 ${CANVAS} ${CANVAS}`}
      style={{ width: '100%', height: 'auto', maxWidth: size }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Background squircle */}
      <rect x={0} y={0} width={CANVAS} height={CANVAS} rx={CANVAS * 0.22} fill={`url(#${gradientId})`} />

      {/* QR Data modules */}
      <path d={dotsPath} fill="#ffffff" />

      {/* Finder Patterns */}
      {renderFinder(0, 0)}
      {renderFinder(N - 7, 0)}
      {renderFinder(0, N - 7)}

      {/* Center Box */}
      <rect 
        x={cx - boxSize / 2} 
        y={cy - boxSize / 2} 
        width={boxSize} 
        height={boxSize} 
        rx={boxR} 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth={M * 0.6} 
      />

      {/* Center Content: either Image or Text */}
      {logoUrl ? (
        <image 
          x={cx - boxSize / 2 + M} 
          y={cy - boxSize / 2 + M} 
          width={boxSize - 2*M} 
          height={boxSize - 2*M} 
          href={logoUrl} 
          preserveAspectRatio="xMidYMid meet" 
        />
      ) : (
        <text 
          x={cx} 
          y={cy + M * 0.2} 
          fontFamily="Inter, sans-serif" 
          fontWeight="900" 
          fontSize={Math.round(boxSize * 0.55)}
          fill="#ffffff" 
          textAnchor="middle" 
          dominantBaseline="central"
        >
          {centerText.substring(0, 2).toUpperCase()}
        </text>
      )}
    </svg>
  );
}

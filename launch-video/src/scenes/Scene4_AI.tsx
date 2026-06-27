import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene4_AI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Chat bubbles
  const b1 = spring({ frame: frame - 20, fps, config: { damping: 12 } });
  const b2 = spring({ frame: frame - 40, fps, config: { damping: 12 } });

  // Forecasting Graph (A simple rising SVG line)
  const graphWidth = interpolate(frame, [50, 100], [0, 300], { extrapolateRight: "clamp" });

  // Text Animations
  const t1 = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const t2 = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const t3 = spring({ frame: frame - 70, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Background Split Glow */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", left: -200, width: 800, height: 1000, backgroundColor: "rgba(59, 130, 246, 0.15)", filter: "blur(200px)" }} />
        <div style={{ position: "absolute", right: -200, width: 800, height: 1000, backgroundColor: "rgba(139, 92, 246, 0.15)", filter: "blur(200px)" }} />
      </AbsoluteFill>

      {/* Abstract CSS Chat Bubbles (Left Side) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", paddingLeft: 150, paddingTop: 100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ padding: "15px 30px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 30, color: "white", transform: `scale(${b1})`, border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            I want a spicy burger...
          </div>
          <div style={{ padding: "15px 30px", backgroundColor: "#3b82f6", borderRadius: 30, color: "white", transform: `scale(${b2})`, alignSelf: "flex-start", boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)" }}>
            Added to your cart! 🍔
          </div>
        </div>
      </AbsoluteFill>

      {/* Abstract Demand Graph (Right Side) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 150, paddingTop: 100 }}>
        <div style={{ width: 300, height: 200, position: "relative" }}>
          {/* X/Y Axis */}
          <div style={{ position: "absolute", left: 0, bottom: 0, width: 300, height: 2, backgroundColor: "rgba(255,255,255,0.2)" }} />
          <div style={{ position: "absolute", left: 0, bottom: 0, width: 2, height: 200, backgroundColor: "rgba(255,255,255,0.2)" }} />
          
          {/* Animated Line Graph (SVG) */}
          <svg style={{ position: "absolute", left: 0, bottom: 0, overflow: "visible" }} width={graphWidth} height="200">
             <path d="M 0 200 Q 50 150 100 120 T 200 50 T 300 0" fill="transparent" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round" style={{ filter: "drop-shadow(0px 10px 10px rgba(167, 139, 250, 0.5))" }} />
          </svg>
        </div>
      </AbsoluteFill>

      {/* Typography Overlay (Bottom Center) */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 100 }}>
         <div style={{ display: "flex", flexDirection: "column", gap: 15, alignItems: "center", textAlign: "center" }}>
           <h2 style={{ color: "white", fontSize: 50, fontWeight: 800, margin: 0, transform: `translateY(${interpolate(t1, [0, 1], [30, 0])}px)`, opacity: interpolate(t1, [0,1], [0,1]) }}>
             AI that actually drives revenue.
           </h2>
           <h3 style={{ color: "#9ca3af", fontSize: 35, fontWeight: 500, margin: 0, transform: `translateY(${interpolate(t2, [0, 1], [30, 0])}px)`, opacity: interpolate(t2, [0,1], [0,1]) }}>
             Conversational ordering. Instant copywriting.
           </h3>
           <h3 style={{ color: "#60a5fa", fontSize: 35, fontWeight: 700, margin: 0, transform: `translateY(${interpolate(t3, [0, 1], [30, 0])}px)`, opacity: interpolate(t3, [0,1], [0,1]), textShadow: "0 0 20px #60a5fa" }}>
             Smart Demand Forecasting.
           </h3>
         </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

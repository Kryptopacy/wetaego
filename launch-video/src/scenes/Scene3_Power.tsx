import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene3_Power: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Roulette Wheel Rotation
  const rouletteRotation = interpolate(frame, [0, 300], [0, 360]);

  // Data blocks flowing
  const blockY = interpolate(frame % 30, [0, 30], [-100, 400]);
  const blockOpacity = interpolate(frame % 30, [0, 15, 30], [0, 1, 0]);

  // Text Animations
  const t1 = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const t2 = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const t3 = spring({ frame: frame - 70, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Background Emerald/Purple Glow */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", left: -100, width: 600, height: 600, borderRadius: 300, backgroundColor: "rgba(16, 185, 129, 0.15)", filter: "blur(200px)" }} />
        <div style={{ position: "absolute", right: -100, width: 600, height: 600, borderRadius: 300, backgroundColor: "rgba(139, 92, 246, 0.15)", filter: "blur(200px)" }} />
      </AbsoluteFill>

      {/* Abstract CSS Roulette Wheel (Right side) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 200 }}>
        <div style={{
          width: 400, height: 400, borderRadius: "50%",
          background: "conic-gradient(from 0deg, #10b981, #3b82f6, #8b5cf6, #10b981)",
          transform: `rotate(${rouletteRotation}deg) perspective(500px) rotateX(20deg)`,
          boxShadow: "0 0 100px rgba(139, 92, 246, 0.4)",
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" })
        }}>
          {/* Inner dark circle */}
          <div style={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 20, backgroundColor: "#020202", borderRadius: "50%" }} />
        </div>
      </AbsoluteFill>

      {/* Abstract CSS Data Blocks (Left side) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", paddingLeft: 200 }}>
        <div style={{ width: 100, height: 400, borderLeft: "2px dashed rgba(255,255,255,0.2)", position: "relative" }}>
          <div style={{
            position: "absolute", left: -26, width: 50, height: 10, backgroundColor: "#4ade80",
            transform: `translateY(${blockY}px)`, opacity: blockOpacity,
            boxShadow: "0 0 20px #4ade80"
          }} />
        </div>
      </AbsoluteFill>

      {/* Typography Overlay */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
         <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", paddingLeft: 300 }}>
           <h2 style={{ color: "white", fontSize: 50, fontWeight: 800, margin: 0, transform: `translateY(${interpolate(t1, [0, 1], [30, 0])}px)`, opacity: interpolate(t1, [0,1], [0,1]) }}>
             Live Fulfillment.
           </h2>
           <h2 style={{ color: "white", fontSize: 50, fontWeight: 800, margin: 0, transform: `translateY(${interpolate(t2, [0, 1], [30, 0])}px)`, opacity: interpolate(t2, [0,1], [0,1]) }}>
             Automated Reconciliation.
           </h2>
           <h2 style={{ color: "#a78bfa", fontSize: 50, fontWeight: 800, margin: 0, transform: `translateY(${interpolate(t3, [0, 1], [30, 0])}px)`, opacity: interpolate(t3, [0,1], [0,1]), textShadow: "0 0 30px #a78bfa" }}>
             And Viral Payment Roulette.
           </h2>
         </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

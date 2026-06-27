import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene4_AI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Partner Program Badge Animation
  const badgeSpring = spring({ frame: frame - 10, fps, config: { damping: 12 } });

  // Text Animations
  const t1 = spring({ frame: frame - 25, fps, config: { damping: 12 } });
  const t2 = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const t3 = spring({ frame: frame - 60, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#09090f", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Deep Violet Glow */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", backgroundColor: "rgba(124, 58, 237, 0.15)", filter: "blur(200px)" }} />
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        
        {/* Affiliate Badge */}
        <div style={{
          display: "flex", gap: 10, alignItems: "center", padding: "8px 16px", borderRadius: 100,
          backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#34d399",
          fontSize: 18, fontWeight: 600, transform: `scale(${badgeSpring})`, marginBottom: 30
        }}>
          ★ Partner Program
        </div>
        
        {/* Typography */}
        <h2 style={{ color: "white", fontSize: 60, fontWeight: 900, margin: 0, transform: `translateY(${interpolate(t1, [0, 1], [30, 0])}px)`, opacity: interpolate(t1, [0,1], [0,1]) }}>
          Grow with us.
        </h2>
        <h3 style={{ fontSize: 50, fontWeight: 800, margin: "10px 0", transform: `translateY(${interpolate(t2, [0, 1], [30, 0])}px)`, opacity: interpolate(t2, [0,1], [0,1]), background: "linear-gradient(to right, #c4b5fd, #ffffff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Built-in Affiliate Rev-Share.
        </h3>
        <h4 style={{ color: "#a1a1aa", fontSize: 35, fontWeight: 400, margin: "20px 0 0 0", transform: `translateY(${interpolate(t3, [0, 1], [30, 0])}px)`, opacity: interpolate(t3, [0,1], [0,1]) }}>
          Earn recurring revenue for every venue you refer.
        </h4>
        
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

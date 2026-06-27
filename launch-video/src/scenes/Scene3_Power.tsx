import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene3_Power: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Glass Panel Animations
  const p1 = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const p2 = spring({ frame: frame - 25, fps, config: { damping: 12 } });

  // Text Animations
  const t1 = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const t2 = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const t3 = spring({ frame: frame - 70, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#09090f", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Background Glow */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", left: -100, width: 600, height: 600, borderRadius: 300, backgroundColor: "rgba(124, 58, 237, 0.1)", filter: "blur(150px)" }} />
      </AbsoluteFill>

      {/* Actual UI Annotations from page.tsx (Right Side) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 150 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          
          {/* Order Received */}
          <div style={{
            padding: "15px 25px", backgroundColor: "rgba(0,0,0,0.8)", borderRadius: 20, color: "white",
            transform: `scale(${p1}) translateX(${interpolate(p1, [0,1], [100, 0])}px)`, 
            border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)", fontSize: 24, fontWeight: 500, display: "flex", gap: 10, alignItems: "center"
          }}>
            <span style={{ color: "#34d399", fontWeight: 800 }}>✓</span> Order received
          </div>

          {/* AI Ready to order */}
          <div style={{
            padding: "15px 25px", backgroundColor: "rgba(0,0,0,0.8)", borderRadius: 20, color: "white",
            transform: `scale(${p2}) translateX(${interpolate(p2, [0,1], [100, 0])}px)`, alignSelf: "flex-start",
            border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)", fontSize: 24, fontWeight: 500, display: "flex", gap: 10, alignItems: "center"
          }}>
            <span style={{ color: "#60a5fa", fontWeight: 800 }}>AI</span> Table 7 ready to order
          </div>

        </div>
      </AbsoluteFill>

      {/* Typography (Left Side) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", paddingLeft: 100 }}>
         <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
           <h2 style={{ color: "white", fontSize: 50, fontWeight: 800, margin: 0, transform: `translateY(${interpolate(t1, [0, 1], [30, 0])}px)`, opacity: interpolate(t1, [0,1], [0,1]) }}>
             Live Fulfillment Dashboards.
           </h2>
           <h2 style={{ color: "white", fontSize: 50, fontWeight: 800, margin: 0, transform: `translateY(${interpolate(t2, [0, 1], [30, 0])}px)`, opacity: interpolate(t2, [0,1], [0,1]) }}>
             Dynamic Branch Switching.
           </h2>
           <h2 style={{ fontSize: 50, fontWeight: 800, margin: 0, transform: `translateY(${interpolate(t3, [0, 1], [30, 0])}px)`, opacity: interpolate(t3, [0,1], [0,1]), background: "linear-gradient(to right, #c4b5fd, #ffffff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
             AI Demand Forecasting.
           </h2>
         </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

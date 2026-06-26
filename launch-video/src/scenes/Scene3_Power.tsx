import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene3_Power: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Three vertical panels sliding in
  const panel1Y = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const panel2Y = spring({ frame: frame - 25, fps, config: { damping: 12 } });
  const panel3Y = spring({ frame: frame - 40, fps, config: { damping: 12 } });

  const textOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", width: "100%", height: "100%", padding: 40, gap: 40 }}>
        {/* Panel 1: Billing & Ledgers */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#111",
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.1)",
            transform: `translateY(${interpolate(panel1Y, [0, 1], [1000, 0])}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 40,
            overflow: "hidden",
          }}
        >
          <div style={{ width: "100%", height: 200, backgroundColor: "#1e1e1e", borderRadius: 20, marginBottom: 40 }} />
          <h2 style={{ color: "white", fontSize: 36, fontWeight: 800 }}>Automated Billing</h2>
          <p style={{ color: "#aaa", fontSize: 24, textAlign: "center", marginTop: 20 }}>
            Zero reconciliation nightmares. Instant split payments.
          </p>
        </div>

        {/* Panel 2: CRM & Gamification */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#111",
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.1)",
            transform: `translateY(${interpolate(panel2Y, [0, 1], [1000, 0])}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 40,
            position: "relative",
          }}
        >
          {/* Mock Roulette Wheel */}
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: "8px solid #4ade80",
              borderTopColor: "#3b82f6",
              borderRightColor: "#ef4444",
              marginBottom: 40,
              transform: `rotate(${frame * 5}deg)`,
            }}
          />
          <h2 style={{ color: "white", fontSize: 36, fontWeight: 800 }}>Payment Roulette</h2>
          <p style={{ color: "#aaa", fontSize: 24, textAlign: "center", marginTop: 20 }}>
            Deeply wired CRM with gamified promotions.
          </p>
        </div>

        {/* Panel 3: Staff & Ops */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#111",
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.1)",
            transform: `translateY(${interpolate(panel3Y, [0, 1], [1000, 0])}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 40,
          }}
        >
          {/* Mock Staff Dashboard List */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 15, marginBottom: 40 }}>
            <div style={{ height: 40, backgroundColor: "#3b82f6", borderRadius: 10, width: "80%" }} />
            <div style={{ height: 40, backgroundColor: "#4ade80", borderRadius: 10, width: "100%" }} />
            <div style={{ height: 40, backgroundColor: "#ef4444", borderRadius: 10, width: "60%" }} />
          </div>
          <h2 style={{ color: "white", fontSize: 36, fontWeight: 800 }}>Staff Management</h2>
          <p style={{ color: "#aaa", fontSize: 24, textAlign: "center", marginTop: 20 }}>
            Live fulfillment triaging across your entire team.
          </p>
        </div>
      </div>
      
      {/* Overlay Text */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
        <h1
          style={{
            color: "white",
            fontSize: 90,
            fontWeight: 900,
            opacity: textOpacity,
            textShadow: "0px 20px 50px rgba(0,0,0,0.8)",
            textAlign: "center",
            background: "rgba(0,0,0,0.4)",
            padding: "20px 60px",
            borderRadius: 40,
            backdropFilter: "blur(10px)",
          }}
        >
          ONE UNIFIED ENGINE
        </h1>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

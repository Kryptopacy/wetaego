import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import React from "react";

export const Scene5_Barrage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flash bang effect on every beat (every 30 frames = 1 second)
  const flash = interpolate(frame % 30, [0, 5, 30], [1, 0, 0], { extrapolateRight: "clamp" });

  // Scaling effect for each feature text
  const featureScale = spring({
    frame: frame % 30,
    fps,
    config: { damping: 10, mass: 0.5 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: "'Inter', sans-serif" }}>
      
      {/* 0-30: Web Push Notifications */}
      <Sequence durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#3b82f6" }}>
          <h1 style={{ color: "white", fontSize: 100, fontWeight: 900, transform: `scale(${featureScale})`, textAlign: "center" }}>
            NATIVE<br/>WEB PUSH
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 30-60: Edge Translations */}
      <Sequence from={30} durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#10b981" }}>
          <h1 style={{ color: "white", fontSize: 100, fontWeight: 900, transform: `scale(${featureScale})`, textAlign: "center" }}>
            REAL-TIME<br/>TRANSLATION
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 60-90: Hardware Provisioning */}
      <Sequence from={60} durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#f59e0b" }}>
          <h1 style={{ color: "white", fontSize: 100, fontWeight: 900, transform: `scale(${featureScale})`, textAlign: "center" }}>
            FLEET<br/>HARDWARE
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 90-120: Affiliate Network */}
      <Sequence from={90} durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#8b5cf6" }}>
          <h1 style={{ color: "white", fontSize: 100, fontWeight: 900, transform: `scale(${featureScale})`, textAlign: "center" }}>
            B2B<br/>AFFILIATES
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 120-210: And so much more... */}
      <Sequence from={120}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#111" }}>
          <h1
            style={{
              color: "white",
              fontSize: 120,
              fontWeight: 900,
              transform: `scale(${spring({ frame: frame - 120, fps, config: { damping: 12 } })})`,
              textAlign: "center",
              letterSpacing: "-2px",
            }}
          >
            AND <span style={{ color: "#ef4444" }}>EVERYTHING</span><br/>ELSE.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Global Flash effect over everything */}
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash, pointerEvents: "none" }} />
      
    </AbsoluteFill>
  );
};

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import React from "react";

export const Scene5_Barrage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Rapid Beat Flash (every 30 frames there is a flash impact)
  const flashOpacity = spring({ frame: frame % 30, fps, config: { damping: 10, stiffness: 200 } });
  const featureScale = interpolate(flashOpacity, [0, 1], [0.8, 1.1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Background Strobe/Beat Flash Effect */}
      <AbsoluteFill style={{ backgroundColor: "rgba(255,255,255,0.05)", opacity: interpolate(frame % 30, [0, 5, 30], [1, 0, 0]) }} />

      {/* 0-30: Web Push Notifications */}
      <Sequence durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "radial-gradient(circle, #1e3a8a 0%, #000 80%)" }}>
          <h1 style={{ color: "white", fontSize: 100, fontWeight: 900, transform: `scale(${featureScale})`, textAlign: "center", textShadow: "0 0 40px #3b82f6" }}>
            NATIVE<br/>WEB PUSH
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 30-60: Real-Time Translation */}
      <Sequence from={30} durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "radial-gradient(circle, #064e3b 0%, #000 80%)" }}>
          <h1 style={{ color: "white", fontSize: 100, fontWeight: 900, transform: `scale(${featureScale})`, textAlign: "center", textShadow: "0 0 40px #10b981" }}>
            REAL-TIME<br/>TRANSLATION
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 60-90: Hardware Fleet */}
      <Sequence from={60} durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "radial-gradient(circle, #4c1d95 0%, #000 80%)" }}>
          <h1 style={{ color: "white", fontSize: 100, fontWeight: 900, transform: `scale(${featureScale})`, textAlign: "center", textShadow: "0 0 40px #8b5cf6" }}>
            HARDWARE<br/>FLEET
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 90-120: B2B Affiliates */}
      <Sequence from={90} durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "radial-gradient(circle, #7f1d1d 0%, #000 80%)" }}>
          <h1 style={{ color: "white", fontSize: 100, fontWeight: 900, transform: `scale(${featureScale})`, textAlign: "center", textShadow: "0 0 40px #ef4444" }}>
            B2B AFFILIATE<br/>NETWORK
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 120-210: Scale / Acceleration transition into the end */}
      <Sequence from={120} durationInFrames={90}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#020202" }}>
          <h1
            style={{
               color: "white",
               fontSize: 120,
               fontWeight: 900,
               letterSpacing: "-4px",
               transform: `scale(${interpolate(frame, [120, 210], [1, 5])})`,
               opacity: interpolate(frame, [180, 210], [1, 0]),
            }}
          >
            INFINITY.
          </h1>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import React from "react";

export const Scene5_Barrage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Beat flash (0 to 1 back to 0 every 30 frames)
  const flash = interpolate(frame % 30, [0, 5, 30], [1, 0, 0]);
  const scale = spring({ frame: frame % 30, fps, config: { damping: 10, stiffness: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#09090f", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Universal Flash */}
      <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flash * 0.1})`, zIndex: 10 }} />

      {/* 0-30: PWA Native Feel */}
      <Sequence durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, #09090f 80%)" }}>
          <h1 style={{ color: "white", fontSize: 110, fontWeight: 900, transform: `scale(${interpolate(scale, [0,1], [0.9, 1.05])})`, textAlign: "center", letterSpacing: "-3px" }}>
            PWA<br/>NATIVE FEEL.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 30-60: Web Push Alerts */}
      <Sequence from={30} durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, #09090f 80%)" }}>
          <h1 style={{ color: "white", fontSize: 110, fontWeight: 900, transform: `scale(${interpolate(scale, [0,1], [0.9, 1.05])})`, textAlign: "center", letterSpacing: "-3px" }}>
            WEB PUSH<br/>ALERTS.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 60-90: Edge Translation */}
      <Sequence from={60} durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, #09090f 80%)" }}>
          <h1 style={{ color: "white", fontSize: 100, fontWeight: 900, transform: `scale(${interpolate(scale, [0,1], [0.9, 1.05])})`, textAlign: "center", letterSpacing: "-3px" }}>
            EDGE<br/>TRANSLATION.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 90-120: Payment Roulette */}
      <Sequence from={90} durationInFrames={30}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, #09090f 80%)" }}>
          <h1 style={{ color: "white", fontSize: 90, fontWeight: 900, transform: `scale(${interpolate(scale, [0,1], [0.9, 1.05])})`, textAlign: "center", letterSpacing: "-2px" }}>
            PAYMENT<br/>ROULETTE.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* 120-210: Scale transition */}
      <Sequence from={120} durationInFrames={90}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <h1
            style={{
               fontSize: 150,
               fontWeight: 900,
               letterSpacing: "-6px",
               transform: `scale(${interpolate(frame, [120, 210], [1, 5])})`,
               opacity: interpolate(frame, [180, 210], [1, 0]),
               background: "linear-gradient(to right, #c4b5fd, #ffffff)",
               WebkitBackgroundClip: "text",
               WebkitTextFillColor: "transparent"
            }}
          >
            WETAEGO.
          </h1>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};

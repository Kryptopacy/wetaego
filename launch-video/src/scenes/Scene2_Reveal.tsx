import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import React from "react";

export const Scene2_Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The QR Code scanner frame shrinks out
  const scanScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, mass: 0.5 },
  });

  const scanOpacity = interpolate(frame, [40, 60], [1, 0], {
    extrapolateRight: "clamp",
  });

  // OS morphing container expands from the center
  const osContainerScale = spring({
    frame: frame - 50,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  // Text entrance
  const titleSpring = spring({
    frame: frame - 70,
    fps,
    config: { damping: 10 },
  });

  // We rotate between 3 templates using interpolate
  const templateY = interpolate(frame, [120, 140, 190, 210, 260, 280], [0, -400, -400, -800, -800, -1200], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <Sequence durationInFrames={60}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: scanOpacity }}>
          <div
            style={{
              width: 300,
              height: 300,
              border: "4px solid #4ade80",
              borderRadius: 40,
              transform: `scale(${scanScale})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 0 40px rgba(74, 222, 128, 0.4)",
            }}
          >
            <h1 style={{ color: "#4ade80", fontSize: 40, fontWeight: 800 }}>SCAN</h1>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={50}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              width: 1000,
              height: 600,
              backgroundColor: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              borderRadius: 32,
              border: "1px solid rgba(255,255,255,0.1)",
              transform: `scale(${osContainerScale})`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "row",
            }}
          >
            {/* Left side text */}
            <div style={{ flex: 1, padding: 60, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h1
                style={{
                  color: "white",
                  fontSize: 64,
                  fontWeight: 800,
                  transform: `translateY(${interpolate(titleSpring, [0, 1], [50, 0])}px)`,
                  opacity: titleSpring,
                  lineHeight: 1.1,
                }}
              >
                Meet<br />
                <span style={{ color: "#4ade80" }}>OurMenu OS</span>
              </h1>
              <p
                style={{
                  color: "#aaa",
                  fontSize: 32,
                  marginTop: 20,
                  transform: `translateY(${interpolate(titleSpring, [0, 1], [50, 0])}px)`,
                  opacity: titleSpring,
                }}
              >
                The universal digital<br />operating layer.
              </p>
            </div>

            {/* Right side morphing templates */}
            <div style={{ flex: 1, backgroundColor: "#111", position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${templateY}px)`,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ height: 400, display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <h2 style={{ color: "white", fontSize: 40 }}>Hospitality Menu</h2>
                </div>
                <div style={{ height: 400, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a1a" }}>
                  <h2 style={{ color: "white", fontSize: 40 }}>Retail Catalog</h2>
                </div>
                <div style={{ height: 400, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#222" }}>
                  <h2 style={{ color: "white", fontSize: 40 }}>Service Booking</h2>
                </div>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

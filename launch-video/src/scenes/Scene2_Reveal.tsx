import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene2_Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // QR Code morphs into a massive light ray
  const qrScale = interpolate(frame, [0, 15, 30], [0, 1, 30], { extrapolateRight: "clamp" });
  const qrOpacity = interpolate(frame, [0, 5, 20], [0, 1, 0], { extrapolateRight: "clamp" });

  const rayOpacity = interpolate(frame, [15, 25], [0, 0.3], { extrapolateRight: "clamp" });

  // Text animations
  const text1Opacity = interpolate(frame, [20, 30], [0, 1], { extrapolateRight: "clamp" });
  const text1Y = spring({ frame: frame - 20, fps, config: { damping: 12 } });

  const text2Opacity = interpolate(frame, [40, 50], [0, 1], { extrapolateRight: "clamp" });
  const text2Y = spring({ frame: frame - 40, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Morphing QR / Light Ray */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{
          width: 100, height: 100, border: "4px solid white", borderRadius: 20,
          transform: `scale(${qrScale})`, opacity: qrOpacity,
          boxShadow: "0 0 40px rgba(255,255,255,0.8)"
        }} />
      </AbsoluteFill>

      {/* Massive Glowing Ray */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: rayOpacity }}>
        <div style={{ width: "100%", height: 300, background: "linear-gradient(90deg, transparent, rgba(255,255,255,1), transparent)", filter: "blur(50px)", transform: "rotate(-10deg)" }} />
      </AbsoluteFill>

      {/* Typography */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        
        <h1 style={{ color: "white", fontSize: 70, fontWeight: 900, opacity: text1Opacity, transform: `translateY(${interpolate(text1Y, [0, 1], [30, 0])}px)`, margin: 0, letterSpacing: "-2px" }}>
          Meet OurMenu OS.
        </h1>
        
        <h2 style={{ color: "#a1a1aa", fontSize: 40, fontWeight: 500, opacity: text2Opacity, transform: `translateY(${interpolate(text2Y, [0, 1], [30, 0])}px)`, marginTop: 20, textAlign: "center" }}>
          The true operating layer for physical spaces.<br/>
          <span style={{ color: "#fff", fontWeight: 700 }}>Hospitality. Retail. Services. Unified.</span>
        </h2>

      </AbsoluteFill>

    </AbsoluteFill>
  );
};

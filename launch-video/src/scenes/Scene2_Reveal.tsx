import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img, staticFile } from "remotion";
import React from "react";

export const Scene2_Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // QR Icon Animation
  const qrScale = interpolate(frame, [0, 15, 30], [0, 1, 40], { extrapolateRight: "clamp" });
  const qrOpacity = interpolate(frame, [0, 5, 20], [0, 1, 0], { extrapolateRight: "clamp" });

  // Floating Phone Frame Animation
  const phoneSpring = spring({ frame: frame - 25, fps, config: { damping: 14 } });
  const phoneScale = interpolate(phoneSpring, [0, 1], [0.8, 1]);
  const phoneOpacity = interpolate(phoneSpring, [0, 1], [0, 1]);
  const phoneFloat = Math.sin(frame / 15) * 10;

  // Typography
  const t1 = spring({ frame: frame - 35, fps, config: { damping: 12 } });
  const t2 = spring({ frame: frame - 45, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#09090f", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Violet-600 Glowing Orb */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", backgroundColor: "rgba(124, 58, 237, 0.15)", filter: "blur(120px)" }} />
      </AbsoluteFill>

      {/* QR Morph */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", zIndex: 10 }}>
        <Img src={staticFile("ourmenu-qr-icon.svg")} style={{ width: 100, height: 100, transform: `scale(${qrScale})`, opacity: qrOpacity, filter: "brightness(0) invert(1)" }} />
      </AbsoluteFill>

      {/* iPhone Reveal (Matching actual page.tsx) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingLeft: 400, opacity: phoneOpacity, transform: `scale(${phoneScale}) translateY(${phoneFloat}px) rotate(-4deg)` }}>
        <div style={{
          position: "relative", width: 300, backgroundColor: "#18181b", borderRadius: 48, padding: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05), 0 60px 80px rgba(0,0,0,0.8)"
        }}>
          {/* Dynamic Island */}
          <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", width: 80, height: 20, backgroundColor: "black", borderRadius: 20, zIndex: 20 }} />
          {/* Screen */}
          <div style={{ borderRadius: 38, overflow: "hidden", backgroundColor: "#f5f7f5", aspectRatio: "9/19.5", position: "relative" }}>
            <Img src={staticFile("guest_menu_screen.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>
      </AbsoluteFill>

      {/* Typography */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", paddingLeft: 100 }}>
        <h1 style={{ color: "white", fontSize: 80, fontWeight: 900, opacity: interpolate(t1, [0,1], [0,1]), transform: `translateY(${interpolate(t1, [0,1], [30,0])}px)`, margin: 0, letterSpacing: "-2px" }}>
          Meet OurMenu OS.
        </h1>
        <h2 style={{ color: "#a1a1aa", fontSize: 40, fontWeight: 500, opacity: interpolate(t2, [0,1], [0,1]), transform: `translateY(${interpolate(t2, [0,1], [30,0])}px)`, marginTop: 20 }}>
          Not just features.<br/>
          <span style={{ color: "#fff", fontWeight: 700 }}>A complete business suite.</span>
        </h2>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

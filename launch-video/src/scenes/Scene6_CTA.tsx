import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene6_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Main CTA text fades in and floats up
  const ctaSpring = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const ctaY = interpolate(ctaSpring, [0, 1], [50, 0]);
  const ctaOpacity = interpolate(ctaSpring, [0, 1], [0, 1]);

  // URL Glass Pill entrance
  const urlSpring = spring({ frame: frame - 50, fps, config: { damping: 12 } });
  const urlScale = interpolate(urlSpring, [0, 1], [0.8, 1]);
  const urlOpacity = interpolate(urlSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#09090f", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Massive Violet Blur (600x600) per the real page.tsx */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", backgroundColor: "rgba(124, 58, 237, 0.1)", filter: "blur(120px)" }} />
      </AbsoluteFill>

      {/* Main CTA Text */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 150, opacity: ctaOpacity, transform: `translateY(${ctaY}px)` }}>
         <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 100, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#d4d4d8", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 30 }}>
           Get Started Today
         </span>
         <h1 style={{ fontSize: 70, fontWeight: 900, textAlign: "center", margin: 0, letterSpacing: "-2px", color: "white" }}>
           Your venue deserves<br/>
           <span style={{ background: "linear-gradient(135deg, #c4b5fd, #ffffff, #a1a1aa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
             better infrastructure.
           </span>
         </h1>
      </AbsoluteFill>

      {/* Final CTA Button (Matches "Get Started Free" from page.tsx) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 180, opacity: urlOpacity, transform: `scale(${urlScale})` }}>
         <div
           style={{
             display: "flex",
             flexDirection: "column",
             alignItems: "center",
             gap: 20
           }}
         >
           {/* White Button */}
           <div style={{ padding: "16px 40px", borderRadius: 100, backgroundColor: "white", color: "black", fontSize: 20, fontWeight: 700, boxShadow: "0 0 40px rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
             ourmenuos.online
             <span style={{ fontSize: 24 }}>→</span>
           </div>
         </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

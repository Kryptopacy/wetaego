import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene6_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Infinite Grid Animation (Moving towards the viewer)
  const gridY = (frame * 5) % 100;

  // Main CTA text fades in and floats up
  const ctaSpring = spring({ frame: frame - 60, fps, config: { damping: 14 } });
  const ctaY = interpolate(ctaSpring, [0, 1], [50, 0]);
  const ctaOpacity = interpolate(ctaSpring, [0, 1], [0, 1]);

  // URL Glass Pill entrance
  const urlSpring = spring({ frame: frame - 90, fps, config: { damping: 12 } });
  const urlScale = interpolate(urlSpring, [0, 1], [0.8, 1]);
  const urlOpacity = interpolate(urlSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      
      {/* Abstract Infinite Grid */}
      <AbsoluteFill style={{ perspective: 1000, justifyContent: "center", alignItems: "center" }}>
        <div style={{
          position: "absolute",
          top: "50%",
          width: "200%",
          height: "200%",
          backgroundSize: "100px 100px",
          backgroundImage: "linear-gradient(rgba(16, 185, 129, 0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(16, 185, 129, 0.2) 2px, transparent 2px)",
          transform: `rotateX(75deg) translateY(${gridY}px)`,
          transformOrigin: "top center"
        }} />
      </AbsoluteFill>

      {/* Cinematic Dark Gradient Overlay (Fades out the grid in the distance) */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at center, transparent 0%, #020202 70%)" }} />

      {/* Main CTA Text */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 150, opacity: ctaOpacity, transform: `translateY(${ctaY}px)` }}>
         <h1 style={{ color: "white", fontSize: 80, fontWeight: 900, textAlign: "center", margin: 0, letterSpacing: "-2px", textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>
           Zero friction.<br/>
           <span style={{ color: "#4ade80" }}>Absolute scale.</span>
         </h1>
      </AbsoluteFill>

      {/* Final URL in a Glowing Glass Pill */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 150, opacity: urlOpacity, transform: `scale(${urlScale})` }}>
         <div
           style={{
             display: "flex",
             justifyContent: "center",
             alignItems: "center",
             padding: "20px 60px",
             backgroundColor: "rgba(255,255,255,0.05)",
             borderRadius: 100,
             backdropFilter: "blur(40px)",
             WebkitBackdropFilter: "blur(40px)",
             border: "1px solid rgba(255,255,255,0.2)",
             boxShadow: "0 20px 80px rgba(74, 222, 128, 0.2)",
             position: "relative",
             overflow: "hidden"
           }}
         >
           <h2 style={{ color: "#fff", fontSize: 50, fontWeight: 700, margin: 0, letterSpacing: "1px" }}>
             ourmenuos.online
           </h2>
         </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

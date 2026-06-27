import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import React from "react";

export const Scene3_Power: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Floating 3D CRM/Roulette Panel
  const panelScale = spring({ frame: frame - 10, fps, config: { damping: 14, mass: 1 } });
  const panelRotateX = interpolate(panelScale, [0, 1], [40, 10]);
  const panelRotateY = interpolate(frame, [0, 300], [-10, 10]); // Continuous slow rotation

  // Text Entrance
  const textOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" });
  const textY = spring({ frame: frame - 30, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Deep Space Emerald Background Glow */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 1000, height: 1000, borderRadius: 500, backgroundColor: "rgba(16, 185, 129, 0.15)", filter: "blur(250px)" }} />
      </AbsoluteFill>

      <AbsoluteFill style={{ perspective: 1200, justifyContent: "center", alignItems: "center" }}>
        
        {/* Main Floating Mockup */}
        <div
          style={{
            position: "absolute",
            width: 800,
            height: 500,
            borderRadius: 30,
            overflow: "hidden",
            boxShadow: "0 50px 150px rgba(0,0,0,0.8), 0 0 80px rgba(16, 185, 129, 0.3)",
            border: "1px solid rgba(255,255,255,0.15)",
            transform: `scale(${panelScale}) rotateX(${panelRotateX}deg) rotateY(${panelRotateY}deg)`,
            transformStyle: "preserve-3d",
            backdropFilter: "blur(40px)",
            backgroundColor: "rgba(25,25,25,0.8)",
          }}
        >
          <Img src="/images/scene3_gamified_roulette_1782545544003.png" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
        </div>

      </AbsoluteFill>

      {/* Cinematic Text Overlay */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 80, opacity: textOpacity }}>
         <h2
           style={{
             color: "white",
             fontSize: 40,
             fontWeight: 600,
             letterSpacing: "-0.5px",
             transform: `translateY(${interpolate(textY, [0, 1], [30, 0])}px)`,
             textShadow: "0 10px 30px rgba(0,0,0,0.9)",
             textAlign: "center"
           }}
         >
           Automated Ledgers.<br/>
           <span style={{ color: "#4ade80", fontWeight: 800 }}>Wired into Gamified Promos.</span>
         </h2>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

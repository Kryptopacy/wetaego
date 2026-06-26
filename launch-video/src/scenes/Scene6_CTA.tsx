import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene6_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for the isometric "devices"
  const devicesScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, mass: 1 },
  });

  const urlOpacity = interpolate(frame, [150, 180], [0, 1], { extrapolateRight: "clamp" });
  const urlY = spring({ frame: frame - 150, fps, config: { damping: 12 } });

  const ctaOpacity = interpolate(frame, [90, 120], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", fontFamily: "'Inter', sans-serif", justifyContent: "center", alignItems: "center" }}>
      
      {/* 3D Isometric Device Mockups (Represented by rotated divs) */}
      <div
        style={{
          display: "flex",
          gap: 40,
          transform: `scale(${devicesScale}) perspective(1000px) rotateX(20deg) rotateY(-20deg) rotateZ(10deg)`,
          transformStyle: "preserve-3d",
          marginTop: -100,
        }}
      >
        {[0, 1, 2].map((i) => {
          const delay = i * 15;
          const slideUp = spring({ frame: frame - 20 - delay, fps, config: { damping: 12 } });
          const yOffset = interpolate(slideUp, [0, 1], [500, 0]);

          return (
            <div
              key={i}
              style={{
                width: 250,
                height: 500,
                backgroundColor: i === 1 ? "#111" : "#1a1a1a",
                borderRadius: 40,
                border: i === 1 ? "4px solid #4ade80" : "2px solid rgba(255,255,255,0.2)",
                boxShadow: "20px 20px 60px rgba(0,0,0,0.8)",
                transform: `translateY(${yOffset}px)`,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Fake UI Header */}
              <div style={{ height: 60, borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", padding: "0 20px" }}>
                 <div style={{ width: 40, height: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 5 }} />
              </div>
              {/* Fake UI Body */}
              <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                 <div style={{ height: 100, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16 }} />
                 <div style={{ height: 40, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8, width: "80%" }} />
                 <div style={{ height: 40, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8, width: "60%" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main CTA Text */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150, opacity: ctaOpacity }}>
         <h1 style={{ color: "white", fontSize: 60, fontWeight: 800, textAlign: "center", margin: 0, letterSpacing: "-1px" }}>
           Don't just digitize your business.<br/>
           <span style={{ color: "#4ade80" }}>Upgrade its operating system.</span>
         </h1>
      </AbsoluteFill>

      {/* Final URL */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60, opacity: urlOpacity }}>
         <h2
           style={{
             color: "#fff",
             fontSize: 40,
             fontWeight: 600,
             margin: 0,
             transform: `translateY(${interpolate(urlY, [0, 1], [30, 0])}px)`,
             backgroundColor: "rgba(255,255,255,0.1)",
             padding: "15px 40px",
             borderRadius: 100,
             backdropFilter: "blur(20px)",
             WebkitBackdropFilter: "blur(20px)",
             border: "1px solid rgba(255,255,255,0.2)",
           }}
         >
           ourmenuos.online
         </h2>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import React from "react";

export const Scene2_Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // QR Shockwave Ring
  const ringScale = spring({ frame, fps, config: { damping: 10, mass: 1 } });
  const ringOpacity = interpolate(frame, [0, 20], [1, 0], { extrapolateRight: "clamp" });

  // Center QR/NFC Core fades out quickly
  const coreOpacity = interpolate(frame, [0, 15], [1, 0], { extrapolateRight: "clamp" });

  // 3D Mockups Entering (Hospitality & Retail)
  // They slide in from the sides and tilt slightly.
  const mockupSpring = spring({ frame: frame - 15, fps, config: { damping: 14, mass: 1 } });
  
  // Left Mockup (Hospitality)
  const leftX = interpolate(mockupSpring, [0, 1], [-800, -300]);
  const leftRotateY = interpolate(mockupSpring, [0, 1], [40, 15]);

  // Right Mockup (Retail)
  const rightX = interpolate(mockupSpring, [0, 1], [800, 300]);
  const rightRotateY = interpolate(mockupSpring, [0, 1], [-40, -15]);

  // Ambient Background Glow
  const glowOpacity = interpolate(frame, [15, 45], [0, 0.4], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Ambient Emerald Glow */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: glowOpacity }}>
        <div style={{ width: 800, height: 800, borderRadius: 400, backgroundColor: "#4ade80", filter: "blur(200px)" }} />
      </AbsoluteFill>

      {/* 3D Mockup Carousel */}
      <AbsoluteFill style={{ perspective: 1200, justifyContent: "center", alignItems: "center" }}>
        
        {/* Hospitality Mockup */}
        <div
          style={{
            position: "absolute",
            width: 450,
            height: 600,
            borderRadius: 30,
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(74, 222, 128, 0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
            transform: `translateX(${leftX}px) rotateY(${leftRotateY}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <Img src="/images/scene2_mockup_hospitality_1782545513406.png" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Retail Mockup */}
        <div
          style={{
            position: "absolute",
            width: 450,
            height: 600,
            borderRadius: 30,
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(59, 130, 246, 0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
            transform: `translateX(${rightX}px) rotateY(${rightRotateY}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <Img src="/images/scene2_mockup_retail_1782545524433.png" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

      </AbsoluteFill>

      {/* QR Shockwave */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: ringOpacity }}>
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: "4px solid #fff",
            transform: `scale(${ringScale * 4})`,
            position: "absolute",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: coreOpacity }}>
        <div style={{ width: 100, height: 100, backgroundColor: "#fff", borderRadius: 20 }} />
      </AbsoluteFill>

      {/* Cinematic Text Overlay */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 100 }}>
         <h2
           style={{
             color: "white",
             fontSize: 50,
             fontWeight: 800,
             letterSpacing: "-1px",
             opacity: interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" }),
             transform: `translateY(${interpolate(frame, [25, 45], [20, 0], { extrapolateRight: "clamp" })}px)`,
             textShadow: "0 4px 20px rgba(0,0,0,0.8)"
           }}
         >
           The Universal Operating Layer.
         </h2>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

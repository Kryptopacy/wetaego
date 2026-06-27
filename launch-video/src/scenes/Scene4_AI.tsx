import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import React from "react";

export const Scene4_AI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Sliding Mockups
  const mockupSpring = spring({ frame: frame - 15, fps, config: { damping: 14, mass: 1 } });
  
  // Left: AI Chat (Blue)
  const leftX = interpolate(mockupSpring, [0, 1], [-800, -250]);
  const leftRotateY = interpolate(mockupSpring, [0, 1], [30, 10]);

  // Right: Image Studio (Purple)
  const rightX = interpolate(mockupSpring, [0, 1], [800, 250]);
  const rightRotateY = interpolate(mockupSpring, [0, 1], [-30, -10]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Ambient Split Glow */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", left: -200, width: 800, height: 1000, backgroundColor: "rgba(59, 130, 246, 0.15)", filter: "blur(200px)" }} />
        <div style={{ position: "absolute", right: -200, width: 800, height: 1000, backgroundColor: "rgba(139, 92, 246, 0.15)", filter: "blur(200px)" }} />
      </AbsoluteFill>

      <AbsoluteFill style={{ perspective: 1200, justifyContent: "center", alignItems: "center" }}>
        
        {/* AI Chat Mobile Mockup */}
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 700,
            borderRadius: 40,
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(59, 130, 246, 0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
            transform: `translateX(${leftX}px) rotateY(${leftRotateY}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <Img src="/images/scene4_ai_chat_1782545554358.png" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* AI Studio Desktop Mockup */}
        <div
          style={{
            position: "absolute",
            width: 550,
            height: 400,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(139, 92, 246, 0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
            transform: `translateX(${rightX}px) rotateY(${rightRotateY}deg) translateY(50px)`,
            transformStyle: "preserve-3d",
          }}
        >
          <Img src="/images/scene4_ai_studio_1782545565424.png" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

      </AbsoluteFill>

      {/* Cinematic Text Overlay */}
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 80 }}>
         <h2
           style={{
             color: "white",
             fontSize: 40,
             fontWeight: 600,
             letterSpacing: "-0.5px",
             opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }),
             transform: `translateY(${interpolate(frame, [30, 50], [-20, 0], { extrapolateRight: "clamp" })}px)`,
             textShadow: "0 10px 30px rgba(0,0,0,0.9)",
             textAlign: "center"
           }}
         >
           Generative AI at every layer.<br/>
           <span style={{ color: "#a78bfa", fontWeight: 800 }}>From Customers to Workflows.</span>
         </h2>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

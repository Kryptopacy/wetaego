import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import React from "react";

export const Scene1_Frustration: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow, cinematic zoom on the background image
  const bgScale = interpolate(frame, [0, 450], [1, 1.15], { extrapolateRight: "clamp" });

  // Vignette/Overlay opacity
  const overlayOpacity = interpolate(frame, [0, 60], [1, 0.6], { extrapolateRight: "clamp" });

  // Kinetic typography animations
  const textScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, mass: 1 },
  });
  
  const textOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: "'Inter', sans-serif" }}>
      {/* Background Image with Parallax Zoom */}
      <AbsoluteFill style={{ transform: `scale(${bgScale})` }}>
        <Img src="/images/scene1_messy_menu_1782545503290.png" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>

      {/* Cinematic Dark Overlay */}
      <AbsoluteFill style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }} />

      {/* Kinetic Typography */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <h1
          style={{
            color: "#ff3333", // Aggressive Red
            fontSize: 100,
            fontWeight: 900,
            textTransform: "uppercase",
            textAlign: "center",
            letterSpacing: "-2px",
            lineHeight: 1.1,
            transform: `scale(${textScale})`,
            opacity: textOpacity,
            textShadow: "0px 10px 40px rgba(255, 0, 0, 0.4)",
          }}
        >
          STOP JUGGLING<br />APP AFTER APP.
        </h1>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

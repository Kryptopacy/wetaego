import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import React from "react";

export const Scene6_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Majestic slow zoom out of the hero image
  const bgScale = interpolate(frame, [0, 240], [1.3, 1], { extrapolateRight: "clamp" });

  // Main CTA text fades in and floats up
  const ctaSpring = spring({ frame: frame - 60, fps, config: { damping: 14 } });
  const ctaY = interpolate(ctaSpring, [0, 1], [50, 0]);
  const ctaOpacity = interpolate(ctaSpring, [0, 1], [0, 1]);

  // URL Glass Pill entrance
  const urlSpring = spring({ frame: frame - 90, fps, config: { damping: 12 } });
  const urlScale = interpolate(urlSpring, [0, 1], [0.8, 1]);
  const urlOpacity = interpolate(urlSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Deep Space Background with Parallax Zoom Hero Devices */}
      <AbsoluteFill style={{ transform: `scale(${bgScale})`, justifyContent: "center", alignItems: "center" }}>
        <Img src="/images/scene6_hero_devices_1782545574431.png" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
      </AbsoluteFill>

      {/* Cinematic Dark Gradient Overlay (Focusing attention on the center/bottom) */}
      <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 60%)" }} />

      {/* Main CTA Text */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 180, opacity: ctaOpacity, transform: `translateY(${ctaY}px)` }}>
         <h1 style={{ color: "white", fontSize: 60, fontWeight: 800, textAlign: "center", margin: 0, letterSpacing: "-1px", textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>
           Don't just digitize your business.<br/>
           <span style={{ color: "#4ade80" }}>Upgrade its operating system.</span>
         </h1>
      </AbsoluteFill>

      {/* Final URL in a Glowing Glass Pill */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 80, opacity: urlOpacity, transform: `scale(${urlScale})` }}>
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
           {/* Sweeping Light Reflection effect could be added here using a translated div, but for static code we use a subtle gradient */}
           <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)" }} />
           
           <h2 style={{ color: "#fff", fontSize: 45, fontWeight: 700, margin: 0, letterSpacing: "1px" }}>
             ourmenuos.online
           </h2>
         </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

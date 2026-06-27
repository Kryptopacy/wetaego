import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Sequence } from "remotion";
import React from "react";

export const Scene1_Frustration: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const createSlam = (delay: number) => spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 180, mass: 1 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#09090f", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Beat 1 */}
      <Sequence durationInFrames={20}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <h1 style={{ color: "#a1a1aa", fontSize: 60, fontWeight: 500, transform: `scale(${createSlam(0)})`, textAlign: "center", letterSpacing: "-1px" }}>
            Are you still piecing your business together?
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Beat 2 */}
      <Sequence from={20} durationInFrames={15}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <h1 style={{ color: "#ffffff", fontSize: 70, fontWeight: 700, transform: `scale(${createSlam(20)})`, textAlign: "center", letterSpacing: "-1px" }}>
            From the client's first scan...
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Beat 3 */}
      <Sequence from={35} durationInFrames={15}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <h1 style={{ color: "#ffffff", fontSize: 70, fontWeight: 700, transform: `scale(${createSlam(35)})`, textAlign: "center", letterSpacing: "-1px" }}>
            ...to the last Paystack payout.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Beat 4 */}
      <Sequence from={50}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <h1 style={{ 
            fontSize: 80, 
            fontWeight: 900, 
            transform: `scale(${createSlam(50)})`, 
            textAlign: "center", 
            letterSpacing: "-2px",
            background: "linear-gradient(135deg, #c4b5fd, #ffffff, #a1a1aa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Your venue deserves better infrastructure.
          </h1>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Sequence } from "remotion";
import React from "react";

export const Scene1_Frustration: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Create an aggressive "slam" effect for each text beat
  const createSlam = (delay: number) => spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 200, mass: 1 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Beat 1 */}
      <Sequence durationInFrames={15}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <h1 style={{ color: "#fff", fontSize: 80, fontWeight: 900, transform: `scale(${createSlam(0)})`, textAlign: "center", letterSpacing: "-2px" }}>
            7 APPS TO RUN<br/>1 BUSINESS.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Beat 2 */}
      <Sequence from={15} durationInFrames={15}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <h1 style={{ color: "#ff3333", fontSize: 100, fontWeight: 900, transform: `scale(${createSlam(15)})`, textAlign: "center", letterSpacing: "-2px" }}>
            LOST MARGINS.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Beat 3 */}
      <Sequence from={30} durationInFrames={15}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <h1 style={{ color: "#fff", fontSize: 100, fontWeight: 900, transform: `scale(${createSlam(30)})`, textAlign: "center", letterSpacing: "-2px" }}>
            OUTDATED MENUS.
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Beat 4 - Lingers longer */}
      <Sequence from={45}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <h1 style={{ color: "#ff3333", fontSize: 150, fontWeight: 900, transform: `scale(${createSlam(45)})`, textAlign: "center", letterSpacing: "-4px", textShadow: "0px 10px 40px rgba(255, 0, 0, 0.4)" }}>
            IT'S BROKEN.
          </h1>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};

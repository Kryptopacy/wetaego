import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import React from "react";

export const Scene1_Frustration: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for the paper menu text
  const text1Scale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  // Fade out text 1
  const text1Opacity = interpolate(frame, [100, 115], [1, 0], {
    extrapolateRight: "clamp",
  });

  // Entrance spring for the juggling apps text
  const text2Scale = spring({
    frame: frame - 130,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  // Background pulse to simulate tension
  const bgRed = interpolate(frame, [0, 200, 400], [20, 40, 20], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: `rgb(${bgRed}, 20, 20)`, fontFamily: "'Inter', sans-serif" }}>
      <Sequence durationInFrames={120}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: text1Opacity }}>
          <h1
            style={{
              fontSize: 80,
              color: "white",
              fontWeight: 800,
              transform: `scale(${text1Scale})`,
              textAlign: "center",
              width: "80%",
              textShadow: "0px 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            Paper menus with crossed-out prices.
          </h1>
          <h2
            style={{
              fontSize: 50,
              color: "#ffaaaa",
              marginTop: 40,
              opacity: interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateY(${interpolate(frame, [45, 60], [20, 0], { extrapolateRight: "clamp" })}px)`,
            }}
          >
            "Sorry, we're sold out."
          </h2>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={120}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: `scale(${text2Scale})`,
            }}
          >
            <h1
              style={{
                fontSize: 70,
                color: "white",
                fontWeight: 800,
                textAlign: "center",
                width: "90%",
                lineHeight: 1.2,
              }}
            >
              Juggling 5 different apps<br />just to survive.
            </h1>
            
            {/* Visual representation of app juggling - Frosted glass cards */}
            <div style={{ display: "flex", gap: 30, marginTop: 60 }}>
              {[0, 1, 2].map((i) => {
                const cardSpring = spring({
                  frame: frame - 160 - i * 15,
                  fps,
                  config: { damping: 10, mass: 0.8 },
                });
                return (
                  <div
                    key={i}
                    style={{
                      width: 200,
                      height: 300,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      borderRadius: 24,
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      transform: `scale(${cardSpring}) translateY(${interpolate(frame, [160 + i * 15, 300], [0, (i % 2 === 0 ? -20 : 20)])}px)`,
                      boxShadow: "0px 20px 40px rgba(0,0,0,0.4)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

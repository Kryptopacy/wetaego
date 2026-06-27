import { Series, AbsoluteFill } from "remotion";
import { Scene1_Frustration } from "./scenes/Scene1_Frustration";
import { Scene2_Reveal } from "./scenes/Scene2_Reveal";
import { Scene3_Power } from "./scenes/Scene3_Power";
import { Scene4_AI } from "./scenes/Scene4_AI";
import { Scene5_Barrage } from "./scenes/Scene5_Barrage";
import { Scene6_CTA } from "./scenes/Scene6_CTA";

export const MyComposition = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Series>
        {/* 0-15s (450 frames) */}
        <Series.Sequence durationInFrames={450}>
          <Scene1_Frustration />
        </Series.Sequence>
        
        {/* 15-25s (300 frames) */}
        <Series.Sequence durationInFrames={300}>
          <Scene2_Reveal />
        </Series.Sequence>
        
        {/* 25-35s (300 frames) */}
        <Series.Sequence durationInFrames={300}>
          <Scene3_Power />
        </Series.Sequence>

        {/* 35-45s (300 frames) */}
        <Series.Sequence durationInFrames={300}>
          <Scene4_AI />
        </Series.Sequence>

        {/* 45-52s (210 frames) */}
        <Series.Sequence durationInFrames={210}>
          <Scene5_Barrage />
        </Series.Sequence>

        {/* 52-60s (240 frames) */}
        <Series.Sequence durationInFrames={240}>
          <Scene6_CTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

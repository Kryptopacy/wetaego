import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React from "react";

export const Scene4_AI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Split screen animation
  const splitScale = spring({ frame: frame - 15, fps, config: { damping: 12 } });

  // Chatbot messages appearing
  const msg1Opacity = interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp" });
  const msg2Opacity = interpolate(frame, [60, 70], [0, 1], { extrapolateRight: "clamp" });

  // AI Generation on the right
  const genOpacity = interpolate(frame, [100, 110], [0, 1], { extrapolateRight: "clamp" });
  const genScale = spring({ frame: frame - 100, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", width: "100%", height: "100%", transform: `scale(${splitScale})` }}>
        
        {/* Left Side: Public-Facing AI Chatbot */}
        <div style={{ flex: 1, borderRight: "2px solid rgba(255,255,255,0.1)", padding: 60, display: "flex", flexDirection: "column" }}>
          <h2 style={{ color: "white", fontSize: 40, fontWeight: 800, marginBottom: 40 }}>Conversational Assistant</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* User Message */}
            <div style={{ alignSelf: "flex-end", backgroundColor: "#3b82f6", padding: 20, borderRadius: 20, opacity: msg1Opacity }}>
              <p style={{ color: "white", fontSize: 24, margin: 0 }}>What's the best vegan option?</p>
            </div>
            
            {/* AI Reply */}
            <div style={{ alignSelf: "flex-start", backgroundColor: "#1e1e1e", padding: 20, borderRadius: 20, opacity: msg2Opacity }}>
              <p style={{ color: "white", fontSize: 24, margin: 0 }}>Our spicy tofu bowl is a crowd favorite! Would you like to add it to your cart?</p>
            </div>
          </div>
        </div>

        {/* Right Side: Business Workflow AI */}
        <div style={{ flex: 1, padding: 60, display: "flex", flexDirection: "column" }}>
          <h2 style={{ color: "white", fontSize: 40, fontWeight: 800, marginBottom: 40 }}>AI Workflow Studio</h2>
          
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              opacity: genOpacity,
              transform: `scale(${genScale})`,
            }}
          >
            {/* Mock Image Generation */}
            <div style={{ width: 300, height: 200, backgroundColor: "#333", borderRadius: 16, marginBottom: 20, overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
               <h3 style={{ color: "#4ade80", fontSize: 24 }}>Generating Image...</h3>
            </div>
            
            {/* Mock Copywriting */}
            <div style={{ width: "80%", backgroundColor: "#1a1a1a", padding: 20, borderRadius: 12 }}>
               <p style={{ color: "#aaa", fontSize: 18, margin: 0 }}>
                 "Experience the perfect crunch with our organic tofu..." 
                 <span style={{ color: "#3b82f6", fontWeight: "bold" }}> ✨ Auto-generated</span>
               </p>
            </div>

            {/* Demand Forecasting Alert */}
            <div style={{ width: "80%", backgroundColor: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", padding: 20, borderRadius: 12, marginTop: 20 }}>
               <p style={{ color: "#ef4444", fontSize: 18, margin: 0, fontWeight: "bold" }}>
                 📈 Demand Forecast: Tofu orders will spike 40% tomorrow. Order inventory.
               </p>
            </div>
          </div>
        </div>

      </div>
    </AbsoluteFill>
  );
};

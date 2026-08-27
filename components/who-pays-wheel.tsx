"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, RotateCw, Share2, Sparkles, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const DEFAULT_NAMES = ["Alex", "Jordan", "Sam", "Taylor", "Morgan"];

const COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
];

export function WhoPaysWheel() {
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  const [inputName, setInputName] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [selectedPayer, setSelectedPayer] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);

  const addName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    if (names.length >= 12) return;
    setNames([...names, inputName.trim()]);
    setInputName("");
    setSelectedPayer(null);
  };

  const removeName = (indexToRemove: number) => {
    if (names.length <= 2) return;
    setNames(names.filter((_, i) => i !== indexToRemove));
    setSelectedPayer(null);
  };

  const spinWheel = () => {
    if (spinning || names.length < 2) return;

    setSpinning(true);
    setSelectedPayer(null);

    // Pick random index
    const selectedIndex = Math.floor(Math.random() * names.length);
    const sliceAngle = 360 / names.length;
    
    // Calculate target angle to stop at the chosen index at top pointer (270 deg / top)
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full rotations
    const stopAngle = 360 - (selectedIndex * sliceAngle + sliceAngle / 2);
    const newRotation = rotation + extraSpins * 360 + (stopAngle - (rotation % 360));

    setRotation(newRotation);

    // Haptic vibration if supported
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([50, 50, 50]);
    }

    setTimeout(() => {
      setSpinning(false);
      setSelectedPayer(names[selectedIndex]);

      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 200]);
      }
    }, 4500);
  };

  const shareToWhatsApp = () => {
    if (!selectedPayer) return;
    const text = encodeURIComponent(
      `🎲 The Payment Roulette has spoken! ${selectedPayer} is paying the bill tonight! 💸 Spin the wheel yourself: https://ourmenuos.online/tools/who-pays-the-bill`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareToTwitter = () => {
    if (!selectedPayer) return;
    const text = encodeURIComponent(
      `🎲 The Payment Roulette decided: @${selectedPayer} is paying the bill tonight! 💸 Test your luck: https://ourmenuos.online/tools/who-pays-the-bill via @ourmenuos`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sliceAngle = 360 / names.length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Wheel */}
        <div className="lg:col-span-7 flex flex-col items-center bg-zinc-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Pointer */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            <div className="w-6 h-8 bg-amber-400 border-2 border-white rounded-b-full shadow-lg animate-bounce" />
          </div>

          {/* Wheel Container */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 my-6 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]" />

            {/* Rotating SVG Wheel */}
            <div
              ref={wheelRef}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? "transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)" : "none",
              }}
              className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {names.map((name, i) => {
                  const startAngle = i * sliceAngle;
                  const endAngle = (i + 1) * sliceAngle;
                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
                  const color = COLORS[i % COLORS.length];

                  // Text rotation
                  const midAngle = startAngle + sliceAngle / 2;
                  const textRad = (Math.PI * midAngle) / 180;
                  const textX = 50 + 32 * Math.cos(textRad);
                  const textY = 50 + 32 * Math.sin(textRad);

                  return (
                    <g key={i}>
                      <path d={pathData} fill={color} stroke="#09090b" strokeWidth="0.8" />
                      <text
                        x={textX}
                        y={textY}
                        fill="#ffffff"
                        fontSize="3.8"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                      >
                        {name.length > 9 ? name.slice(0, 8) + "…" : name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Center Cap */}
            <div className="absolute w-16 h-16 bg-zinc-950 border-4 border-emerald-400 rounded-full flex items-center justify-center shadow-2xl z-20">
              <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Spin CTA Button */}
          <button
            onClick={spinWheel}
            disabled={spinning || names.length < 2}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-wide uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-3 ${
              spinning
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 text-zinc-950 hover:scale-[1.02] shadow-emerald-500/25 hover:shadow-emerald-500/40"
            }`}
          >
            <RotateCw className={`w-5 h-5 ${spinning ? "animate-spin" : ""}`} />
            {spinning ? "Deciding Destiny..." : "Spin To Pick Payer 🎲"}
          </button>

          {/* Winner Result Modal / Callout */}
          {selectedPayer && !spinning && (
            <div className="mt-6 w-full p-6 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-zinc-900 border border-emerald-500/40 text-center animate-in fade-in zoom-in duration-300">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">The Verdict Is In</span>
              <h3 className="text-3xl font-black text-white mt-1 mb-2">
                🎉 {selectedPayer} is paying the bill!
              </h3>
              <p className="text-sm text-zinc-400 mb-5">
                No arguments. The roulette wheel has decided. Hand over the card or split the rest!
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={shareToWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp
                </button>
                <button
                  onClick={shareToTwitter}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors flex items-center gap-2"
                >
                  Post on X
                </button>
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                  {copied ? "Link Copied!" : "Copy Game Link"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Participant Manager & Venue Integration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Participants Form */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-2">Dining Party ({names.length}/12)</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Add the names of everyone at the table, bar, or dinner party.
            </p>

            <form onSubmit={addName} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter person's name..."
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                maxLength={20}
                disabled={names.length >= 12}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputName.trim() || names.length >= 12}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold rounded-xl text-sm transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {names.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/5 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-zinc-200">{name}</span>
                  </div>
                  {names.length > 2 && (
                    <button
                      onClick={() => removeName(index)}
                      className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                      aria-label={`Remove ${name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Venue Promotion Callout Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-emerald-950/40 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl pointer-events-none rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              For Restaurant & Bar Owners
            </span>
            <h4 className="text-lg font-bold text-white mt-3 mb-2">
              Want Payment Roulette on your tables?
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              WETAEGO embeds this gamified roulette directly into your smart QR digital menus, driving viral social shares and boosting average check sizes.
            </p>
            <Link
              href="/features/restaurant-qr-menu"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Explore Restaurant QR Menus <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

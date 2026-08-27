import type { Metadata } from "next";
import { LandingNavbar } from "@/components/LandingNavbar";
import Link from "next/link";
import {
  Bot,
  Mic,
  Camera,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Headphones,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tego AI: Multimodal Voice, Vision & Frontline Concierge | WETAEGO",
  description: "Experience the dual-layer AI engine with ultra-low latency real-time voice dialogue, camera menu parsing, zero-hallucination dining concierge, and staff handoff.",
  keywords: [
    "tego ai",
    "multimodal restaurant ai",
    "voice ai ordering",
    "camera menu ocr parser",
    "zero hallucination dining ai",
    "real-time multimodal voice vision",
    "ai copilot physical business",
    "ai concierge hospitality"
  ],
  alternates: {
    canonical: "https://ourmenuos.online/features/ai-copilot-tego-multimodal",
  },
  openGraph: {
    title: "Tego AI: Multimodal Voice & Vision Operating System | WETAEGO",
    description: "Real-time multimodal voice/vision dialogue, smartphone camera menu OCR parsing, zero-hallucination public concierge, and staff handoff.",
    url: "https://ourmenuos.online/features/ai-copilot-tego-multimodal",
    type: "website",
    images: ["/hero_emerald_gemstone.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tego AI: Multimodal Voice & Vision Operating System | WETAEGO",
    description: "Real-time multimodal voice/vision dialogue, smartphone camera menu OCR parsing, zero-hallucination public concierge, and staff handoff.",
    images: ["/hero_emerald_gemstone.png"],
  },
};

export default function TegoAiFeaturePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://ourmenuos.online/features/ai-copilot-tego-multimodal#software",
        "name": "Tego Multimodal Autonomous AI Engine",
        "applicationCategory": "BusinessApplication, ArtificialIntelligenceApplication",
        "operatingSystem": "Web, iOS, Android, PWA",
        "description": "Dual-layer business AI system featuring real-time bidirectional voice streaming, 1 FPS camera video ingestion, and zero-hallucination customer concierges.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://ourmenuos.online/features/ai-copilot-tego-multimodal#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does Tego AI achieve zero hallucinations on customer storefronts?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tego Frontline Concierge is strictly grounded in verified database tables (menu items, prices, ingredients, allergen tags, operating hours). If a customer asks an unlisted question, Tego refuses to invent answers and immediately creates an escalation ticket for floor staff."
            }
          },
          {
            "@type": "Question",
            "name": "What AI architecture powers Tego Live?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tego Live uses a state-of-the-art real-time multimodal live architecture via secure server-minted ephemeral tokens, supporting 16kHz microphone audio streaming, 24kHz audio playback with instant barge-in interruption, and 1 FPS camera video ingestion."
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://ourmenuos.online/features/ai-copilot-tego-multimodal#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://ourmenuos.online"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Features",
            "item": "https://ourmenuos.online/features"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Tego Multimodal AI",
            "item": "https://ourmenuos.online/features/ai-copilot-tego-multimodal"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-emerald-500/30 selection:text-white">
        <LandingNavbar />

        <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
          {/* Hero */}
          <div className="max-w-4xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Bot className="w-3.5 h-3.5" /> Next-Gen Multimodal AI
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Talk to your business. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                Automate your frontline.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-8">
              Tego AI brings bidirectional voice and camera vision to store operations, alongside a zero-hallucination public concierge that answers dietary questions, modifies carts, and escalates to human staff.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Experience Tego AI Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Voice Dialogue</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Natural conversations with instant barge-in interruption. Ask Tego to modify design tokens, pull sales reports, or check low stock.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Camera Vision OCR</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Point your phone camera at physical paper menus or price lists. Tego extracts all items, descriptions, and prices in seconds.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Zero Hallucinations</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Strict database grounding ensures Tego never invents ingredients or prices. Unresolved queries escalate directly to the floor staff dashboard.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/60 border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-4xl font-black text-white mb-4">
              Equip your venue with autonomous intelligence
            </h3>
            <p className="text-zinc-300 text-base max-w-2xl mx-auto mb-8 font-light">
              Get started with Tego AI on WETAEGO in under 10 minutes.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-bold text-sm hover:scale-105 transition-transform shadow-xl"
            >
              Start Free Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}

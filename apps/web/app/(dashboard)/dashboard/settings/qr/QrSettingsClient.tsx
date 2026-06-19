"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { DynamicQR } from "@/components/qr/DynamicQR";
import { updateQrConfig } from "./actions";
import { Download, Loader2, Save } from "lucide-react";
import { Database } from "@/lib/supabase/types";

type Location = Database["public"]["Tables"]["locations"]["Row"] & {
  qr_color?: string | null;
  qr_text?: string | null;
  logo_url?: string | null;
};

export function QrSettingsClient({ location }: { location: Location }) {
  const [color, setColor] = useState(location.qr_color || location.theme_color || "#0f7b55");
  const [text, setText] = useState(location.qr_text || location.name.substring(0, 2).toUpperCase());
  const [logoUrl, setLogoUrl] = useState(location.logo_url || "");
  const [isSaving, setIsSaving] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  // In a real app we'd fetch location_pages and let them select a page.
  // For now, we assume the QR links to their portal.
  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/m/${location.slug}` : `https://ourmenuos.online/m/${location.slug}`;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateQrConfig(location.id, {
        qr_text: text,
        qr_color: color,
        logo_url: logoUrl,
      });
      toast.success("QR settings saved.");
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPNG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    // Generate 4K (2048x2048)
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, 2048, 2048);
      URL.revokeObjectURL(url);
      
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${location.slug}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = url;
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${location.slug}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="p-6 border-b border-zinc-800/50">
            <h3 className="text-lg font-semibold text-white">Configuration</h3>
            <p className="text-sm text-zinc-400">Customize the look of your ecosystem QR.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="color" className="text-sm font-medium text-zinc-300">Theme Color</label>
              <div className="flex gap-2">
                <input 
                  id="color" 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="w-16 p-1 h-10 rounded border border-zinc-700 bg-zinc-800"
                />
                <input 
                  type="text" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="text" className="text-sm font-medium text-zinc-300">Center Text (Max 2 chars)</label>
              <input 
                id="text" 
                maxLength={2} 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder="OM"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500">Used if no logo URL is provided.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="logo" className="text-sm font-medium text-zinc-300">Center Logo URL (Optional)</label>
              <input 
                id="logo" 
                type="url" 
                value={logoUrl} 
                onChange={(e) => setLogoUrl(e.target.value)} 
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500">Overrides center text if provided.</p>
            </div>

            <button onClick={handleSave} disabled={isSaving} className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col items-center p-8 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <div ref={svgRef} className="bg-white p-4 rounded-xl shadow-sm border" style={{ width: 340, height: 340 }}>
            <DynamicQR 
              value={portalUrl} 
              color={color} 
              centerText={text} 
              logoUrl={logoUrl || undefined} 
              size={1024} // Internal render size, scaled by CSS
            />
          </div>
          <p className="text-sm font-medium text-zinc-400 mt-6 mb-4">
            Destination: <span className="text-white">{portalUrl}</span>
          </p>
          <div className="flex gap-4 w-full mt-4">
            <button className="flex-1 flex justify-center py-2 px-4 border border-zinc-700 rounded-lg shadow-sm text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700" onClick={handleDownloadSVG}>
              <Download className="w-4 h-4 mr-2" />
              SVG
            </button>
            <button className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-100" onClick={handleDownloadPNG}>
              <Download className="w-4 h-4 mr-2" />
              High-Res PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from 'next/link';
import { QrCode, MapPinOff } from 'lucide-react';

export default function VenueNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7f5] dark:bg-zinc-950 p-6 text-[#17201b] dark:text-white text-center transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <MapPinOff className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-3xl font-black mb-3 tracking-tight">Venue Not Found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
          We couldn't find this menu or venue. The location may have changed its link, or the QR code you scanned might be expired.
        </p>

        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Try Scanning Again
          </button>

          <Link 
            href="/"
            className="w-full py-3 px-4 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-all border border-transparent dark:border-white/10 flex items-center justify-center gap-2"
          >
            Go to OurMenu Directory
          </Link>
        </div>
      </div>
    </div>
  );
}

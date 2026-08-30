import Link from 'next/link';
import { DirectorySearch } from './components/directory-search';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | WETAEGO',
  description: 'The requested page does not exist on WETAEGO. Find platform resources, site map links, and directory search.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 text-white text-center">
      <div className="max-w-xl w-full bg-zinc-900/90 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col items-center">
        <h1 className="text-6xl font-black mb-3 tracking-tighter text-emerald-400">404</h1>
        <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-md leading-relaxed">
          The link you clicked might be broken, or the page may have moved. Use our directory search or visit one of the recovery links below.
        </p>

        <div className="w-full max-w-sm mb-8 relative z-20">
          <DirectorySearch />
        </div>

        <div className="w-full border-t border-white/10 pt-6 mb-6 text-left">
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-3 text-center">
            Where to Look Next
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors"
            >
              🏠 Platform Home
            </Link>
            <Link
              href="/features"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors"
            >
              ⚡ All Features
            </Link>
            <Link
              href="/docs"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors"
            >
              📚 Developer Docs
            </Link>
            <Link
              href="/llms.txt"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors"
            >
              🤖 LLMs & Agent Index
            </Link>
            <Link
              href="/sitemap.xml"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors"
            >
              🗺️ XML Sitemap
            </Link>
            <Link
              href="/contact"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-colors"
            >
              💬 Contact Support
            </Link>
          </div>
        </div>

        <Link 
          href="/"
          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}

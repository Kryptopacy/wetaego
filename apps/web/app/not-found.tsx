import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 text-white text-center">
      <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <h1 className="text-6xl font-black mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
        <p className="text-zinc-400 text-sm mb-8">
          The menu or page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link 
          href="/"
          className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

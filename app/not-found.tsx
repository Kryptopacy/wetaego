import Link from 'next/link';
import { DirectorySearch } from './components/directory-search';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 text-white text-center">
      <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <h1 className="text-6xl font-black mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
        <p className="text-zinc-400 text-sm mb-8">
          The link you clicked might be broken, or the page may have been removed. You can search for the business below.
        </p>

        <div className="w-full max-w-sm mb-8 relative z-20">
          <DirectorySearch />
        </div>

        <Link 
          href="/"
          className="w-full py-3 px-4 bg-white/5 text-zinc-300 font-bold rounded-xl hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

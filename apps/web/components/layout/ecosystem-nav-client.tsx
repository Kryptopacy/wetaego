"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, X, Utensils, Calendar, Info, FileText, LayoutList } from "lucide-react";

interface EcosystemNavClientProps {
  slug: string;
  pages: { id: string; slug: string; template_type: string; title: string }[];
  currentPath: string; // e.g., 'menu' or 'booking'
}

export function EcosystemNavClient({ slug, pages, currentPath }: EcosystemNavClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (templateType: string) => {
    switch (templateType) {
      case 'booking': return <Calendar className="w-4 h-4" />;
      case 'catalog': return <Utensils className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      case 'rate_card': return <FileText className="w-4 h-4" />;
      default: return <LayoutList className="w-4 h-4" />;
    }
  };

  const portalHref = `/m/${slug}`;
  const menuHref = `/m/${slug}?view=menu`;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 left-6 z-50 flex flex-col items-start">
        <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-4 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-2xl p-2 w-64 origin-bottom-left"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Ecosystem Navigation
            </div>
            <div className="flex flex-col gap-1 mt-1 max-h-[60vh] overflow-y-auto">
              {/* Portal Link */}
              <Link
                href={portalHref}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-100 hover:bg-zinc-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Compass className="w-4 h-4 text-zinc-400" />
                <span className="font-medium text-sm">Ecosystem Portal</span>
              </Link>

              {/* Main Menu Link */}
              {currentPath !== 'menu' && (
                <Link
                  href={menuHref}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-100 hover:bg-zinc-800 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Utensils className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium text-sm">Main Menu</span>
                </Link>
              )}

              {/* Custom Pages */}
              {pages.map((page) => {
                if (currentPath === page.slug) return null; // don't show current page
                return (
                  <Link
                    key={page.id}
                    href={`/m/${slug}/p/${page.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-100 hover:bg-zinc-800 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="text-zinc-400">
                      {getIcon(page.template_type)}
                    </div>
                    <span className="font-medium text-sm">{page.title}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-zinc-900 border border-zinc-700 rounded-full shadow-2xl flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          aria-label="Toggle Navigation Menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
        </motion.button>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ActionForm } from "./ActionForm";
import { startInteractiveDemo } from "../app/login/actions";
import { DemoSubmitButton } from "./DemoSubmitButton";
import { AnimatePresence, motion } from "framer-motion";
import { PaymentRouletteModal } from "./payment-roulette-modal";

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Solutions", href: "/#features" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Affiliates", href: "/affiliates" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-12 h-16 bg-black/40 backdrop-blur-xl border-b border-white/[0.04]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/ourmenu-qr-icon.svg"
            alt="OurMenu Logo"
            width={28}
            height={28}
            className="object-contain"
          />
          <Link href="/" className="font-semibold text-white tracking-tight">
            OurMenu OS
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop & Mobile Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden lg:block"
            href="/login"
          >
            Log in
          </Link>
          <ActionForm action={startInteractiveDemo} className="hidden sm:block">
            <DemoSubmitButton
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-4 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
              pendingText="Building..."
            >
              Try Demo
            </DemoSubmitButton>
          </ActionForm>
          <button
            onClick={() => setIsRouletteOpen(true)}
            aria-label="Who's paying? Free randomizer for who pays the restaurant bill"
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/10 transition-colors"
          >
            Who's paying? 🎲
          </button>
          <Link
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            href="/login"
          >
            Get Started
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden ml-2 text-white p-1"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-3xl flex flex-col px-6 py-4"
          >
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-3">
                <Image
                  src="/ourmenu-qr-icon.svg"
                  alt="OurMenu Logo"
                  width={28}
                  height={28}
                  className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                />
                <span className="font-semibold text-white tracking-tight">
                  OurMenu OS
                </span>
              </div>
              <button
                className="text-white p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                onClick={() => setIsOpen(false)}
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <motion.div 
              className="flex flex-col gap-6 mt-16 px-2"
              initial="closed"
              animate="open"
              variants={{
                open: {
                  transition: { staggerChildren: 0.1, delayChildren: 0.1 }
                },
                closed: {
                  transition: { staggerChildren: 0.05, staggerDirection: -1 }
                }
              }}
            >
              {navLinks.map((link) => (
                <motion.div
                  key={link.name}
                  variants={{
                    open: { opacity: 1, y: 0 },
                    closed: { opacity: 0, y: 20 }
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-3xl font-light text-zinc-400 hover:text-white transition-colors block"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: 20 }
                }}
                className="mt-4 pt-8 border-t border-white/10"
              >
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-2xl font-light text-zinc-300 hover:text-white transition-colors block mb-8"
                >
                  Log in
                </Link>
                
                <ActionForm action={startInteractiveDemo} className="w-full">
                  <DemoSubmitButton
                    className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-gradient-to-r from-zinc-800 to-zinc-900 border border-white/10 text-white hover:border-white/30 transition-all shadow-xl"
                    pendingText="Building your workspace..."
                  >
                    <span className="font-medium text-lg">Try Demo Mode</span>
                    <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                  </DemoSubmitButton>
                </ActionForm>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsRouletteOpen(true);
                  }}
                  className="w-full mt-4 flex items-center justify-between px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-xl"
                >
                  <span className="font-medium text-lg">Who's paying? 🎲</span>
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentRouletteModal 
        isOpen={isRouletteOpen} 
        onClose={() => setIsRouletteOpen(false)} 
      />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ActionForm } from "./ActionForm";
import { startInteractiveDemo } from "../app/login/actions";
import { DemoSubmitButton } from "./DemoSubmitButton";
import { AnimatePresence, motion } from "framer-motion";

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

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
    { name: "Platform", href: "/#features" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Customers", href: "/#testimonials" },
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
            href="/dashboard"
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
          <Link
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            href="/dashboard"
          >
            Get Started
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden ml-2 text-white p-1"
            onClick={() => setIsOpen(true)}
            aria-label="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] bg-[#050505] flex flex-col px-6 py-4"
          >
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-3">
                <Image
                  src="/ourmenu-qr-icon.svg"
                  alt="OurMenu Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
                <span className="font-semibold text-white tracking-tight">
                  OurMenu OS
                </span>
              </div>
              <button
                className="text-white p-2"
                onClick={() => setIsOpen(false)}
                aria-label="Close Menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-6 mt-12 text-2xl font-semibold">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-300 hover:text-white border-b border-white/10 pb-4"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="text-zinc-300 hover:text-white border-b border-white/10 pb-4"
              >
                Log in
              </Link>
              <ActionForm action={startInteractiveDemo} className="w-full mt-4">
                <DemoSubmitButton
                  className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                  pendingText="Building..."
                >
                  Try Demo Mode
                  <ArrowRight className="w-5 h-5 text-zinc-400" />
                </DemoSubmitButton>
              </ActionForm>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

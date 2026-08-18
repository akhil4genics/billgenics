'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { AuthVisualPanel } from './AuthVisualPanel';

export function AuthLayout({
  children,
  panelHeading,
  panelSubtext,
  preview,
}: {
  children: ReactNode;
  panelHeading: string;
  panelSubtext: string;
  preview?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const reduce = useReducedMotion();
  const mobileLogo = theme === 'dark' ? '/images/billgenics.png' : '/images/billgenics_coloured.png';

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.15fr_1fr]">
      {/* Left visual panel (desktop only) */}
      <AuthVisualPanel heading={panelHeading} subtext={panelSubtext} preview={preview} />

      {/* Right form column */}
      <div className="flex min-h-screen flex-col bg-[#f8faff] dark:bg-background">
        {/* Top bar: mobile logo + theme toggle */}
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="lg:invisible" aria-label="BillGenics home">
            <Image src={mobileLogo} alt="BillGenics" width={440} height={130} className="h-11 w-auto" priority />
          </Link>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>

        {/* Centered form card */}
        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-2 sm:px-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[440px] rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_rgba(59,78,248,0.25)] sm:p-9"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

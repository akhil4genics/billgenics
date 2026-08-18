'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { BellRing, Repeat, ScanLine, Users, type LucideIcon } from 'lucide-react';

type FloatCard = { icon: LucideIcon; title: string; sub: string; className: string; delay: number };

const CARDS: FloatCard[] = [
  { icon: ScanLine, title: 'AI Receipt Scan', sub: 'Woolworths · $84.20', className: '-left-4 top-6 sm:-left-8', delay: 0.3 },
  { icon: BellRing, title: 'Bill Reminder', sub: 'Origin Energy · in 2 days', className: '-right-3 top-1/3 sm:-right-8', delay: 0.45 },
  { icon: Repeat, title: 'Recurring Bill', sub: 'Rent · every month', className: 'left-0 bottom-24 sm:-left-6', delay: 0.6 },
  { icon: Users, title: 'Expense Split', sub: 'Byron trip · 4 friends', className: '-right-2 bottom-12 sm:-right-6', delay: 0.75 },
];

export function AuthVisualPanel({
  heading,
  subtext,
  preview = '/images/invoice_analytics.png',
}: {
  heading: string;
  subtext: string;
  preview?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-accent lg:flex lg:flex-col">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:26px_26px]" />

      <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
        {/* Logo (existing white asset) */}
        <div>
          <Image
            src="/images/billgenics.png"
            alt="BillGenics"
            width={480}
            height={140}
            priority
            className="h-14 w-auto"
          />
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-10 max-w-md font-display text-3xl font-bold leading-[1.15] tracking-tight text-white xl:text-4xl"
          >
            {heading}
          </motion.h2>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-4 max-w-md text-base leading-relaxed text-white/80"
          >
            {subtext}
          </motion.p>
        </div>

        {/* App preview + floating cards */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto my-8 w-full max-w-sm"
        >
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-sm">
            <div className="overflow-hidden rounded-xl">
              <Image
                src={preview}
                alt="BillGenics dashboard preview"
                width={720}
                height={900}
                className="h-auto w-full"
              />
            </div>
          </div>

          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: c.delay, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute z-10 ${c.className} ${reduce ? '' : 'animate-float'}`}
              >
                <div className="glass-strong flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 shadow-xl">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-semibold leading-tight text-foreground">{c.title}</p>
                    <p className="text-[11px] leading-tight text-muted">{c.sub}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust statement */}
        <p className="max-w-md text-sm font-medium text-white/85">
          Track bills, plan ahead and split with ease.
        </p>
      </div>
    </div>
  );
}

'use client';

import {
  Sparkles, ScanLine, ScanText, Tags, CopyCheck, TrendingUp, BellRing, type LucideIcon,
} from 'lucide-react';
import { MotionChild, MotionReveal, MotionStagger } from './motion';

const CAPABILITIES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: ScanLine, title: 'Receipt scanning', desc: 'Reads any receipt from a single photo.' },
  { icon: ScanText, title: 'OCR extraction', desc: 'Pulls line items, totals and tax precisely.' },
  { icon: Tags, title: 'Auto categorisation', desc: 'Sorts every bill into the right category.' },
  { icon: CopyCheck, title: 'Duplicate detection', desc: 'Flags bills you may have already added.' },
  { icon: TrendingUp, title: 'Bill prediction', desc: 'Spots recurring patterns to suggest schedules.' },
  { icon: BellRing, title: 'Smart reminders', desc: 'Nudges you before a payment is due.' },
];

export function AiSection() {
  return (
    <section id="ai" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionReveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-accent px-6 py-16 sm:px-14 sm:py-20">
            {/* glow decor */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:28px_28px]" />

            <div className="relative mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Powered by GPT-4o Vision</span>
              </span>
              <h2 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
                Meet your AI Finance Assistant
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/85">
                BillGenics does the reading, sorting and predicting so you don’t have to. Point your camera
                at a receipt — the rest is automatic.
              </p>
            </div>

            <MotionStagger className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon;
                return (
                  <MotionChild
                    key={c.title}
                    className="group rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md transition-colors hover:bg-white/15"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold text-white">{c.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/75">{c.desc}</p>
                  </MotionChild>
                );
              })}
            </MotionStagger>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

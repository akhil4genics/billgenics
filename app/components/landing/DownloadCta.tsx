'use client';

import Image from 'next/image';
import { QrCode } from 'lucide-react';
import { MotionReveal } from './motion';
import { StoreBadges } from './ui';

/* Decorative QR-style block (not a scannable code) */
function QrDecor() {
  const cells = Array.from({ length: 49 });
  // deterministic pseudo-pattern so SSR/CSR match
  const filled = (i: number) => (i * 7 + ((i / 7) | 0) * 3) % 5 < 2;
  return (
    <div className="grid grid-cols-7 gap-1 rounded-xl bg-white p-3" aria-hidden>
      {cells.map((_, i) => (
        <span
          key={i}
          className={`aspect-square rounded-[3px] ${filled(i) ? 'bg-[#0f172a]' : 'bg-transparent'}`}
        />
      ))}
    </div>
  );
}

export function DownloadCta() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionReveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-secondary/40 px-6 py-14 sm:px-14 sm:py-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

            <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                  Your bills, in your <span className="text-gradient">pocket</span>
                </h2>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
                  Install BillGenics on any device and start scanning, tracking and splitting in minutes.
                  It’s free to get started.
                </p>

                <StoreBadges className="mt-8" />

                <div className="mt-8 flex items-center gap-4">
                  <QrDecor />
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <QrCode className="h-5 w-5 text-primary" />
                    <span>Scan to open on your phone</span>
                  </div>
                </div>
              </div>

              {/* Phone mockup */}
              <div className="relative mx-auto w-[240px] sm:w-[270px]">
                <div className="animate-float relative rounded-[2.5rem] border border-border bg-card p-2.5 shadow-[0_40px_80px_-30px_rgba(59,78,248,0.4)]">
                  <div className="absolute left-1/2 top-2.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-foreground/90" />
                  <div className="overflow-hidden rounded-[2rem] ring-1 ring-border">
                    <Image
                      src="/images/expenses_tracker.png"
                      alt="BillGenics expense tracker on mobile"
                      width={540}
                      height={1100}
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

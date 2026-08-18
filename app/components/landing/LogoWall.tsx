'use client';

import {
  Home, Zap, Tv, ShieldCheck, ShoppingCart, Baby, Smartphone, Dumbbell, Car, Wifi,
  type LucideIcon,
} from 'lucide-react';

/* Honest framing: rather than fabricated company logos, this band shows the
 * kinds of bills BillGenics manages — the same visual rhythm as a logo wall,
 * without implying customers or press we don't have. */
const CATEGORIES: { label: string; icon: LucideIcon }[] = [
  { label: 'Rent & Mortgage', icon: Home },
  { label: 'Energy', icon: Zap },
  { label: 'Streaming', icon: Tv },
  { label: 'Insurance', icon: ShieldCheck },
  { label: 'Groceries', icon: ShoppingCart },
  { label: 'Daycare', icon: Baby },
  { label: 'Phone Plan', icon: Smartphone },
  { label: 'Gym', icon: Dumbbell },
  { label: 'Car & Transport', icon: Car },
  { label: 'Internet', icon: Wifi },
];

export function LogoWall() {
  const row = [...CATEGORIES, ...CATEGORIES];
  return (
    <section className="border-y border-border/60 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          One place for every kind of bill
        </p>
      </div>
      <div className="relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-10">
          {row.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={`${c.label}-${i}`} className="flex shrink-0 items-center gap-2.5 text-muted">
                <Icon className="h-5 w-5" />
                <span className="text-base font-semibold tracking-tight">{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

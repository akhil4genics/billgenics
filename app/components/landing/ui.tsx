'use client';

import Link from 'next/link';
import { ArrowUpRight, Play, Star, type LucideIcon } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/* ─── Eyebrow pill ────────────────────────────────────────────────────────── */
export function Eyebrow({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 backdrop-blur-sm">
      {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{children}</span>
    </span>
  );
}

/* ─── Buttons ─────────────────────────────────────────────────────────────── */
export function PrimaryCTA({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-primary)] transition-all duration-300 hover:bg-primary-hover hover:shadow-[var(--shadow-primary-hover)] ${className}`}
    >
      <span>{children}</span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:rotate-45">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export function GhostCTA({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card ${className}`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Play className="h-3 w-3 fill-current" />
      </span>
      <span>{children}</span>
    </Link>
  );
}

/* ─── Star rating ─────────────────────────────────────────────────────────── */
export function StarRating({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
      ))}
    </div>
  );
}

/* ─── Avatar stack ────────────────────────────────────────────────────────── */
const AVATARS = [
  { initials: 'AM', from: 'from-primary', to: 'to-accent' },
  { initials: 'JT', from: 'from-accent', to: 'to-primary' },
  { initials: 'SK', from: 'from-sky-400', to: 'to-primary' },
  { initials: 'RD', from: 'from-violet-400', to: 'to-accent' },
];
export function AvatarStack() {
  return (
    <div className="flex -space-x-2.5">
      {AVATARS.map((a) => (
        <span
          key={a.initials}
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${a.from} ${a.to} text-[11px] font-bold text-white ring-2 ring-background`}
        >
          {a.initials}
        </span>
      ))}
    </div>
  );
}

/* ─── Store badges (honest framing) ───────────────────────────────────────── */
export function StoreBadges({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <span className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5">
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-foreground" aria-hidden>
          <path d="M17.05 12.5c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.4-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.35 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.44-3.69zM14.8 5.56c.64-.78 1.07-1.86.95-2.94-.92.04-2.03.61-2.69 1.38-.59.69-1.11 1.79-.97 2.85 1.02.08 2.07-.52 2.71-1.29z" />
        </svg>
        <span className="text-left">
          <span className="block text-[10px] leading-none text-muted">Coming soon</span>
          <span className="block text-sm font-semibold text-foreground">App Store</span>
        </span>
      </span>
      <span className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5">
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path d="M3.6 2.3 13 11.7 3.6 21.1c-.35-.24-.6-.66-.6-1.2V3.5c0-.54.25-.96.6-1.2z" fill="#34d399" />
          <path d="M16.5 8.2 13 11.7l3.5 3.5 3.9-2.2c.8-.46.8-1.6 0-2.06l-3.9-2.24z" fill="#fbbf24" />
          <path d="M13 11.7 3.6 2.3c.14-.1.3-.16.48-.18L16.5 8.2 13 11.7z" fill="#3b4ef8" />
          <path d="M13 11.7l3.5 3.5-12.42 6.08c-.18-.02-.34-.08-.48-.18L13 11.7z" fill="#ef4444" />
        </svg>
        <span className="text-left">
          <span className="block text-[10px] leading-none text-muted">Install as</span>
          <span className="block text-sm font-semibold text-foreground">Web App (PWA)</span>
        </span>
      </span>
    </div>
  );
}

/* ─── Animated counter ────────────────────────────────────────────────────── */
export function Counter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1600,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/* ─── Section heading block ───────────────────────────────────────────────── */
export function SectionHeading({
  eyebrow,
  icon,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow: string;
  icon?: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
}) {
  const reduce = useReducedMotion();
  const Wrap = reduce ? 'div' : motion.div;
  const anim = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
      };
  return (
    <Wrap
      {...anim}
      className={`flex w-full max-w-2xl flex-col gap-5 ${align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left'}`}
    >
      <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
      <h2 className="w-full font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="w-full text-lg leading-relaxed text-muted">{subtitle}</p>}
    </Wrap>
  );
}

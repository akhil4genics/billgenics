'use client';

import Image from 'next/image';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Bell, CheckCircle2, ScanLine, Sparkles, Users, CalendarClock } from 'lucide-react';
import { AvatarStack, GhostCTA, PrimaryCTA, StarRating, StoreBadges } from './ui';

/* Floating card meta: position + parallax depth */
type FloatCard = {
  icon: typeof ScanLine;
  title: string;
  sub: string;
  accent: string;
  className: string;
  depth: number;
  delay: number;
};

const FLOAT_CARDS: FloatCard[] = [
  {
    icon: ScanLine,
    title: 'AI Receipt Scan',
    sub: 'Woolworths · $84.20',
    accent: 'text-primary',
    className: '-left-6 top-10 sm:-left-12',
    depth: 26,
    delay: 0.5,
  },
  {
    icon: CalendarClock,
    title: 'Upcoming Bills',
    sub: '7 due this month',
    accent: 'text-accent',
    className: '-right-4 top-28 sm:-right-10',
    depth: -30,
    delay: 0.65,
  },
  {
    icon: Bell,
    title: 'Bill Reminder',
    sub: 'Origin Energy · in 2 days',
    accent: 'text-warning',
    className: 'left-2 bottom-28 sm:-left-8',
    depth: 20,
    delay: 0.8,
  },
  {
    icon: Users,
    title: 'Expense Split',
    sub: 'Trip to Byron · 4 friends',
    accent: 'text-accent',
    className: 'right-0 bottom-40 sm:-right-12',
    depth: -22,
    delay: 0.95,
  },
  {
    icon: CheckCircle2,
    title: 'Payment Success',
    sub: 'Rent · $2,150 paid',
    accent: 'text-success',
    className: 'left-1/2 -bottom-4 -translate-x-1/2',
    depth: 16,
    delay: 1.1,
  },
];

export function Hero() {
  const reduce = useReducedMotion();

  // Mouse parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      onMouseMove={onMouseMove}
      className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      {/* Background: mesh grid + glowing blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 mesh-grid opacity-70" />
        <ParallaxBlob sx={sx} sy={sy} depth={40} className="blob animate-blob -top-32 left-1/4 h-[520px] w-[520px] bg-gradient-to-br from-primary/50 to-accent/30" />
        <ParallaxBlob sx={sx} sy={sy} depth={-50} className="blob animate-blob right-0 top-20 h-[440px] w-[440px] bg-gradient-to-tr from-accent/40 to-primary/20" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-primary/[0.04] to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ─── Left: copy ─── */}
          <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  AI-powered bill management
                </span>
              </span>
            </motion.div>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-6 w-full font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              Track bills,
              <br />
              <span className="text-gradient-animated">plan ahead,</span>
              <br />
              split with ease.
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 w-full max-w-xl text-lg leading-relaxed text-muted"
            >
              Scan receipts with AI, schedule every recurring bill once and let BillGenics automatically
              add it to your monthly calendar, remind you before bills are due, and split shared expenses
              with friends — all in one beautiful app.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
            >
              <PrimaryCTA href="/signup">Get Started Free</PrimaryCTA>
              <GhostCTA href="/#how-it-works">Watch Demo</GhostCTA>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start"
            >
              <div className="flex items-center gap-3">
                <AvatarStack />
                <div className="text-left">
                  <StarRating />
                  <p className="mt-0.5 text-xs text-muted">Loved by early users</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              <StoreBadges className="mt-8 justify-center lg:justify-start" />
            </motion.div>
          </div>

          {/* ─── Right: device mockup + floating cards ─── */}
          <div className="relative mx-auto w-full min-w-0 max-w-md lg:max-w-none">
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-[280px] sm:w-[320px]"
            >
              <ParallaxLayer sx={sx} sy={sy} depth={12}>
                {/* Phone frame */}
                <div className="relative rounded-[2.75rem] border border-border bg-card p-3 shadow-[0_40px_80px_-30px_rgba(59,78,248,0.45)]">
                  <div className="absolute left-1/2 top-3 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-foreground/90" />
                  <div className="overflow-hidden rounded-[2.1rem] ring-1 ring-border">
                    <Image
                      src="/images/scan_bill.png"
                      alt="Scanning a receipt with BillGenics"
                      width={640}
                      height={1200}
                      priority
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              </ParallaxLayer>
            </motion.div>

            {/* Floating glass cards */}
            {FLOAT_CARDS.map((card) => (
              <FloatingCard key={card.title} card={card} sx={sx} sy={sy} reduce={!!reduce} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Parallax helpers ────────────────────────────────────────────────────── */
function ParallaxBlob({
  sx,
  sy,
  depth,
  className,
  style,
}: {
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  depth: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);
  return <motion.div style={{ x, y, ...style }} className={className} />;
}

function ParallaxLayer({
  sx,
  sy,
  depth,
  children,
}: {
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  depth: number;
  children: React.ReactNode;
}) {
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);
  return <motion.div style={{ x, y }}>{children}</motion.div>;
}

function FloatingCard({
  card,
  sx,
  sy,
  reduce,
}: {
  card: FloatCard;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  reduce: boolean;
}) {
  const { icon: Icon } = card;
  const x = useTransform(sx, (v) => v * card.depth);
  const y = useTransform(sy, (v) => v * card.depth);
  return (
    <motion.div
      style={reduce ? undefined : { x, y }}
      initial={reduce ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: card.delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute z-20 hidden sm:block ${card.className}`}
    >
      <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)]">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-secondary ${card.accent}`}>
          <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
        </span>
        <div className="text-left">
          <p className="text-sm font-semibold leading-tight text-foreground">{card.title}</p>
          <p className="text-xs leading-tight text-muted">{card.sub}</p>
        </div>
      </div>
    </motion.div>
  );
}

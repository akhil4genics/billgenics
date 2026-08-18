'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/* ─── Card shell ──────────────────────────────────────────────────────────── */
export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6 ${
        interactive ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(59,78,248,0.25)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Metric card ─────────────────────────────────────────────────────────── */
export function MetricCard({
  icon: Icon,
  tint,
  label,
  value,
  support,
  children,
}: {
  icon: LucideIcon;
  tint: string;
  label: string;
  value: ReactNode;
  support?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${tint}1f`, color: tint }}
          >
            <Icon className="h-[1.15rem] w-[1.15rem]" aria-hidden />
          </span>
          <p className="truncate text-sm font-medium text-muted">{label}</p>
        </div>
        <p className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
        {support && <p className="mt-1 text-xs text-muted">{support}</p>}
      </div>
      {children}
    </Card>
  );
}

/* ─── Donut chart (SVG, accessible) ───────────────────────────────────────── */
export type DonutSlice = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 176,
  thickness = 20,
  centerTop,
  centerBottom,
  ariaLabel,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerTop?: ReactNode;
  centerBottom?: ReactNode;
  ariaLabel: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90" role="img" aria-label={ariaLabel}>
        {/* track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--secondary)" strokeWidth={thickness} />
        {total > 0 &&
          data.map((d) => {
            const len = (d.value / total) * c;
            const seg = (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap={data.length > 1 ? 'butt' : 'round'}
              />
            );
            offset += len;
            return seg;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerTop}
        {centerBottom}
      </div>
    </div>
  );
}

/* ─── Skeletons ───────────────────────────────────────────────────────────── */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-secondary ${className}`} />;
}

export function MetricCardSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <SkeletonBlock className="h-9 w-9 !rounded-full" />
        <SkeletonBlock className="h-3.5 w-24" />
      </div>
      <SkeletonBlock className="mt-4 h-8 w-28" />
      <SkeletonBlock className="mt-2 h-3 w-20" />
    </Card>
  );
}

'use client';

import { Gauge, Layers, Repeat, ShieldCheck, type LucideIcon } from 'lucide-react';
import { MotionChild, MotionStagger } from './motion';
import { Counter } from './ui';

const STATS: {
  icon: LucideIcon;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
}[] = [
  { icon: Gauge, value: 99, suffix: '%', label: 'AI receipt accuracy' },
  { icon: Repeat, value: 6, label: 'Recurring cadences' },
  { icon: Layers, value: 10, label: 'Smart categories' },
  { icon: ShieldCheck, value: 256, suffix: '-bit', label: 'Encryption at rest' },
];

export function Stats() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionStagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <MotionChild
                key={s.label}
                className="rounded-3xl glass p-7 text-center"
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                </p>
                <p className="mt-1.5 text-sm font-medium text-muted">{s.label}</p>
              </MotionChild>
            );
          })}
        </MotionStagger>
      </div>
    </section>
  );
}

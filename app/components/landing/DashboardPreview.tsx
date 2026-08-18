'use client';

import { ArrowUpRight, Sparkles, TrendingUp } from 'lucide-react';
import { MotionReveal, scaleIn } from './motion';
import { SectionHeading } from './ui';

/* Donut segments — category breakdown */
const DONUT = [
  { label: 'Groceries', value: 34, color: '#3b4ef8' },
  { label: 'Utilities', value: 24, color: '#6c63ff' },
  { label: 'Dining', value: 18, color: '#38bdf8' },
  { label: 'Transport', value: 14, color: '#10b981' },
  { label: 'Other', value: 10, color: '#f59e0b' },
];

/* Monthly trend points (normalized 0-100) */
const TREND = [30, 42, 38, 55, 48, 62, 58, 72, 66, 80];

const UPCOMING = [
  { name: 'Origin Energy', when: 'in 2 days', amount: '$320.40', dot: 'bg-warning' },
  { name: 'Daycare', when: 'in 5 days', amount: '$680.00', dot: 'bg-primary' },
  { name: 'Netflix', when: 'in 9 days', amount: '$22.99', dot: 'bg-accent' },
];

function Donut() {
  const total = DONUT.reduce((s, d) => s + d.value, 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
      {DONUT.map((d) => {
        const len = (d.value / total) * c;
        const seg = (
          <circle
            key={d.label}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth="14"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        );
        offset += len;
        return seg;
      })}
    </svg>
  );
}

function TrendChart() {
  const w = 320;
  const h = 120;
  const step = w / (TREND.length - 1);
  const pts = TREND.map((v, i) => [i * step, h - (v / 100) * (h - 16) - 8]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b4ef8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#3b4ef8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b4ef8" />
          <stop offset="100%" stopColor="#6c63ff" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendFill)" />
      <path d={line} fill="none" stroke="url(#trendLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke="#3b4ef8" strokeWidth="2" />
      ))}
    </svg>
  );
}

export function DashboardPreview() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10">
        <div className="blob absolute left-1/2 top-1/3 h-[420px] w-[600px] -translate-x-1/2 bg-gradient-to-r from-primary/25 to-accent/20" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Your dashboard"
          icon={TrendingUp}
          title={<>Your whole month, <span className="text-gradient">at a glance</span></>}
          subtitle="Spending trends, category breakdowns, upcoming bills and AI suggestions — the numbers you need to answer “will next month feel tight?”"
        />

        <MotionReveal variants={scaleIn} className="mt-16">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-[0_50px_100px_-40px_rgba(59,78,248,0.4)]">
            {/* browser chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-5 py-3.5">
              <span className="h-3 w-3 rounded-full bg-danger/70" />
              <span className="h-3 w-3 rounded-full bg-warning/70" />
              <span className="h-3 w-3 rounded-full bg-success/70" />
              <div className="ml-4 hidden rounded-md bg-background px-3 py-1 text-xs text-muted sm:block">
                app.billgenics.com/account
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-3">
              {/* KPI + trend */}
              <div className="flex flex-col gap-5 lg:col-span-2">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Spent this month', value: '$3,248', delta: '+8%', up: true },
                    { label: 'Bills tracked', value: '42', delta: '+5', up: true },
                    { label: 'Due next 14d', value: '$1,204', delta: '7 bills', up: false },
                  ].map((k) => (
                    <div key={k.label} className="rounded-2xl border border-border bg-background/60 p-4">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{k.label}</p>
                      <p className="mt-1.5 font-display text-xl font-bold text-foreground sm:text-2xl">{k.value}</p>
                      <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${k.up ? 'text-success' : 'text-muted'}`}>
                        {k.up && <ArrowUpRight className="h-3 w-3" />} {k.delta}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Monthly spending trend</p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Last 10 months</span>
                  </div>
                  <div className="mt-4 h-32">
                    <TrendChart />
                  </div>
                </div>
              </div>

              {/* Donut + upcoming + AI */}
              <div className="flex flex-col gap-5">
                <div className="rounded-2xl border border-border bg-background/60 p-5">
                  <p className="text-sm font-semibold text-foreground">By category</p>
                  <div className="mt-3 flex items-center gap-4">
                    <Donut />
                    <ul className="flex-1 space-y-1.5">
                      {DONUT.map((d) => (
                        <li key={d.label} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-muted">
                            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                            {d.label}
                          </span>
                          <span className="font-semibold text-foreground">{d.value}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-5">
                  <p className="text-sm font-semibold text-foreground">Upcoming bills</p>
                  <ul className="mt-3 space-y-3">
                    {UPCOMING.map((b) => (
                      <li key={b.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2.5">
                          <span className={`h-2 w-2 rounded-full ${b.dot}`} />
                          <span>
                            <span className="block font-medium text-foreground">{b.name}</span>
                            <span className="block text-xs text-muted">{b.when}</span>
                          </span>
                        </span>
                        <span className="font-semibold text-foreground">{b.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="gradient-ring rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm font-semibold">AI suggestion</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    “Spotify” looks like a monthly bill. Track it as recurring?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

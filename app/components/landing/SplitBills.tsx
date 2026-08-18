'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Users, Check } from 'lucide-react';
import { MotionReveal } from './motion';
import { Eyebrow, PrimaryCTA } from './ui';

const MEMBERS = [
  { initials: 'AM', name: 'Alex', from: 'from-primary', to: 'to-accent', status: 'gets back', amount: '+$142.50', tone: 'text-success' },
  { initials: 'JT', name: 'Jordan', from: 'from-accent', to: 'to-primary', status: 'owes', amount: '−$68.00', tone: 'text-danger' },
  { initials: 'SK', name: 'Sam', from: 'from-sky-400', to: 'to-primary', status: 'owes', amount: '−$74.50', tone: 'text-danger' },
];

const SETTLEMENTS = [
  { from: 'Jordan', to: 'Alex', amount: '$68.00' },
  { from: 'Sam', to: 'Alex', amount: '$74.50' },
];

export function SplitBills() {
  const reduce = useReducedMotion();
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Copy */}
          <MotionReveal className="flex w-full flex-col items-start gap-5">
            <Eyebrow icon={Users}>Split with friends</Eyebrow>
            <h2 className="w-full font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              Shared costs, <span className="text-gradient">settled fairly</span>
            </h2>
            <p className="w-full text-lg leading-relaxed text-muted">
              Create an event, add everyone’s expenses, and BillGenics works out exactly who owes whom —
              minimising the number of transactions so settling up takes seconds, not spreadsheets.
            </p>
            <ul className="mt-2 space-y-3">
              {['Add shared expenses in seconds', 'Automatic, minimised settlements', 'Everyone stays in sync'].map((t) => (
                <li key={t} className="flex items-center gap-3 text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm font-medium">{t}</span>
                </li>
              ))}
            </ul>
            <PrimaryCTA href="/signup" className="mt-4">Start splitting</PrimaryCTA>
          </MotionReveal>

          {/* Visual */}
          <MotionReveal delay={0.1}>
            <div className="glass-strong relative rounded-3xl p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">Event</p>
                  <p className="font-display text-lg font-bold text-foreground">Trip to Byron Bay</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">$285 total</span>
              </div>

              <div className="mt-6 space-y-3">
                {MEMBERS.map((m) => (
                  <div key={m.name} className="flex items-center justify-between rounded-2xl border border-border bg-background/50 px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${m.from} ${m.to} text-xs font-bold text-white`}>
                        {m.initials}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{m.name}</span>
                        <span className="block text-xs text-muted">{m.status}</span>
                      </span>
                    </span>
                    <span className={`text-sm font-bold ${m.tone}`}>{m.amount}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Suggested settlements</p>
                <div className="mt-3 space-y-2.5">
                  {SETTLEMENTS.map((s, i) => (
                    <motion.div
                      key={`${s.from}-${s.to}`}
                      initial={reduce ? false : { opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {s.from}
                        <ArrowRight className="h-4 w-4 text-primary" />
                        {s.to}
                      </span>
                      <span className="font-bold text-foreground">{s.amount}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}

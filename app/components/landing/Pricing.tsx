'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { MotionChild, MotionStagger } from './motion';
import { SectionHeading } from './ui';

type Plan = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    tagline: 'Everything you need to get started.',
    features: ['AI receipt scanning', 'Track unlimited bills', 'Monthly analytics', 'Dark mode'],
    cta: 'Get Started',
  },
  {
    name: 'Premium',
    price: '$6',
    cadence: 'per month',
    tagline: 'For getting fully ahead of your money.',
    features: ['Everything in Free', 'Recurring bills & forecast', 'Smart reminders', 'Export reports', 'Priority AI processing'],
    cta: 'Start free trial',
    featured: true,
  },
  {
    name: 'Family',
    price: '$12',
    cadence: 'per month',
    tagline: 'Shared finances, sorted together.',
    features: ['Everything in Premium', 'Up to 5 members', 'Shared events & splitting', 'Household forecast'],
    cta: 'Choose Family',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          icon={Sparkles}
          title={<>Simple pricing, <span className="text-gradient">no surprises</span></>}
          subtitle="Start free and upgrade whenever you’re ready. Cancel anytime."
        />

        <MotionStagger className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <MotionChild
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-8 ${
                plan.featured
                  ? 'gradient-ring bg-card shadow-[var(--shadow-card-hover)] lg:-translate-y-3'
                  : 'glass'
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="mt-1.5 text-sm text-muted">{plan.tagline}</p>
              <div className="mt-6 flex items-end gap-1.5">
                <span className="font-display text-5xl font-extrabold tracking-tight text-foreground">{plan.price}</span>
                <span className="mb-1.5 text-sm text-muted">/ {plan.cadence}</span>
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition-all ${
                  plan.featured
                    ? 'bg-primary text-white shadow-[var(--shadow-primary)] hover:bg-primary-hover hover:shadow-[var(--shadow-primary-hover)]'
                    : 'border border-border text-foreground hover:bg-secondary'
                }`}
              >
                {plan.cta}
              </Link>
            </MotionChild>
          ))}
        </MotionStagger>

        <p className="mt-8 text-center text-xs text-muted">Indicative pricing — plans and prices are illustrative.</p>
      </div>
    </section>
  );
}

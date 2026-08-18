'use client';

import { Quote } from 'lucide-react';
import { MotionChild, MotionStagger } from './motion';
import { SectionHeading, StarRating } from './ui';

const TESTIMONIALS = [
  {
    quote:
      'BillGenics made splitting our trip expenses effortless. The AI receipt scanner saved us hours of manual entry.',
    name: 'Sarah J.',
    role: 'Weekend traveller',
    initials: 'SJ',
    from: 'from-primary',
    to: 'to-accent',
  },
  {
    quote:
      'I finally know what’s hitting my account next month. The recurring-bill forecast is the feature I never knew I needed.',
    name: 'Marcus T.',
    role: 'Freelance designer',
    initials: 'MT',
    from: 'from-accent',
    to: 'to-primary',
  },
  {
    quote:
      'Snap, review, done. Categorisation is scarily accurate and my monthly totals just… stay right.',
    name: 'Priya R.',
    role: 'Small-business owner',
    initials: 'PR',
    from: 'from-sky-400',
    to: 'to-primary',
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Loved by users"
          icon={Quote}
          title={<>People who <span className="text-gradient">hate spreadsheets</span>, love this</>}
        />

        <MotionStagger className="mt-16 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <MotionChild
              key={t.name}
              className="flex flex-col rounded-3xl glass p-7"
            >
              <Quote className="h-8 w-8 text-primary/30" />
              <StarRating className="mt-4" />
              <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground">
                “{t.quote}”
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${t.from} ${t.to} text-sm font-bold text-white`}>
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
            </MotionChild>
          ))}
        </MotionStagger>

        <p className="mt-8 text-center text-xs text-muted">Illustrative examples of how people use BillGenics.</p>
      </div>
    </section>
  );
}

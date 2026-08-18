'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { ScanLine, Sparkles, Repeat, BellRing, CreditCard, Users, type LucideIcon } from 'lucide-react';
import { SectionHeading } from './ui';

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: ScanLine, title: 'Scan Receipt', desc: 'Snap a photo of any receipt or bill straight from your phone.' },
  { icon: Sparkles, title: 'AI Extracts Information', desc: 'GPT-4o Vision pulls the store, line items, totals, tax and date automatically.' },
  { icon: Repeat, title: 'Schedule Recurring Bill', desc: 'Turn it into a recurring schedule — weekly, monthly, quarterly, or custom.' },
  { icon: BellRing, title: 'Receive Reminder', desc: 'Get a heads-up before every due date, with your chosen lead time.' },
  { icon: CreditCard, title: 'Pay Bill', desc: 'It’s auto-logged to the right category, so your monthly totals stay accurate.' },
  { icon: Users, title: 'Split Expense', desc: 'Share the cost with friends and let BillGenics settle who owes whom.' },
];

export function HowItWorks() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 65%', 'end 55%'],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          icon={Sparkles}
          title={<>From receipt to <span className="text-gradient">settled</span>, in six steps</>}
          subtitle="A calm, guided flow — set it up once and BillGenics quietly does the busywork for you."
        />

        <div ref={ref} className="relative mx-auto mt-16 max-w-3xl">
          {/* Spine */}
          <div className="absolute left-6 top-2 bottom-2 w-px bg-border md:left-1/2 md:-translate-x-1/2" />
          {!reduce && (
            <motion.div
              style={{ scaleY, transformOrigin: 'top' }}
              className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-primary to-accent md:left-1/2 md:-translate-x-1/2"
            />
          )}

          <ul className="space-y-8 md:space-y-0">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const left = i % 2 === 0;
              return (
                <li key={step.title} className="relative md:grid md:min-h-[7rem] md:grid-cols-2 md:items-center md:gap-10">
                  {/* Node */}
                  <span className="absolute left-6 top-1 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-[var(--shadow-primary)] md:left-1/2">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>

                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className={`ml-16 md:ml-0 ${
                      left ? 'md:col-start-1 md:pr-6 md:text-right' : 'md:col-start-2 md:pl-6'
                    }`}
                  >
                    <div className="rounded-2xl glass p-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">
                        Step {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="mt-1.5 font-display text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.desc}</p>
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

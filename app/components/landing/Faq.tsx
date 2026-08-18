'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, Plus } from 'lucide-react';
import { SectionHeading } from './ui';

const FAQS = [
  {
    q: 'How does the AI receipt scanning work?',
    a: 'Snap a photo of any receipt and BillGenics sends it to GPT-4o Vision, which extracts the store name, line items, totals, tax and date. You review the parsed result, tweak anything if needed, and save — no manual typing.',
  },
  {
    q: 'What are recurring bills and how do they help?',
    a: 'Set up bills like rent, insurance or subscriptions once with a cadence (weekly, monthly, quarterly, yearly or custom). BillGenics auto-adds each cycle to your month on its due date and reminds you before it lands, so nothing sneaks up on you.',
  },
  {
    q: 'Can I split expenses with friends?',
    a: 'Yes. Create an event, invite friends by email, add shared expenses, and BillGenics calculates who owes whom using a greedy algorithm that minimises the number of transactions needed to settle up.',
  },
  {
    q: 'Is my financial data secure?',
    a: 'Your data is encrypted at rest, passwords are hashed with bcrypt, and accounts are protected with failed-attempt lockouts and new-device email verification. Receipt images are stored via secure presigned URLs.',
  },
  {
    q: 'Do I need to install an app?',
    a: 'BillGenics is a progressive web app — install it to your home screen on any device for an app-like experience. Native App Store and Google Play versions are on the roadmap.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Free plan includes AI receipt scanning, unlimited bill tracking, monthly analytics and dark mode. Upgrade to Premium or Family whenever you want recurring forecasts, reminders and expense splitting.',
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-display text-base font-semibold text-foreground sm:text-lg">{q}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          <Plus className="h-4 w-4" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          icon={HelpCircle}
          title={<>Questions? <span className="text-gradient">Answered.</span></>}
        />
        <div className="mt-14 space-y-3">
          {FAQS.map((f) => (
            <Item key={f.q} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

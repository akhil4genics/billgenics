'use client';

import {
  ScanLine, ScanText, Repeat, CalendarSync, BellRing, Users,
  PieChart, MoonStar, FileDown, Smartphone, type LucideIcon,
} from 'lucide-react';
import { MotionChild, MotionStagger } from './motion';
import { SectionHeading } from './ui';

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  span?: string;
  gradient: string;
};

const FEATURES: Feature[] = [
  {
    icon: ScanLine,
    title: 'AI Receipt Scan',
    desc: 'Snap any receipt and GPT-4o Vision reads the store, items, totals and date in seconds — no typing.',
    span: 'sm:col-span-2',
    gradient: 'from-primary to-accent',
  },
  {
    icon: ScanText,
    title: 'Auto OCR',
    desc: 'Line-item extraction with accurate totals and tax parsing.',
    gradient: 'from-sky-500 to-primary',
  },
  {
    icon: Repeat,
    title: 'Recurring Bills',
    desc: 'Set rent, insurance or subscriptions once — any cadence.',
    gradient: 'from-accent to-violet-500',
  },
  {
    icon: CalendarSync,
    title: 'Calendar Sync',
    desc: 'Every due bill auto-lands on your monthly calendar so nothing sneaks up.',
    span: 'sm:col-span-2',
    gradient: 'from-primary to-sky-500',
  },
  {
    icon: BellRing,
    title: 'Bill Reminders',
    desc: 'A heads-up before every payment is due — pick your lead time.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Expense Splitting',
    desc: 'Split trips and shared costs, auto-calculate who owes whom.',
    gradient: 'from-accent to-primary',
  },
  {
    icon: PieChart,
    title: 'Monthly Analytics',
    desc: 'Category breakdowns and spend trends at a glance.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: MoonStar,
    title: 'Dark Mode',
    desc: 'A gorgeous, low-glare theme for late-night budgeting.',
    gradient: 'from-slate-600 to-slate-800',
  },
  {
    icon: FileDown,
    title: 'Export Reports',
    desc: 'Take your data anywhere — clean, structured exports.',
    gradient: 'from-primary to-accent',
  },
  {
    icon: Smartphone,
    title: 'Unlimited Devices',
    desc: 'Install as a PWA and pick up right where you left off.',
    gradient: 'from-violet-500 to-accent',
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          icon={ScanLine}
          title={<>Everything you need to <span className="text-gradient">stay ahead</span> of your bills</>}
          subtitle="Powerful, thoughtfully-designed tools that turn scattered receipts and forgotten due dates into one calm, forward-looking picture."
        />

        <MotionStagger className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <MotionChild
                key={f.title}
                className={`group relative flex flex-col overflow-hidden rounded-3xl glass p-7 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow-card-hover)] ${f.span ?? ''}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h3 className="mt-6 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              </MotionChild>
            );
          })}
        </MotionStagger>
      </div>
    </section>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Header } from './components/Header';

// ─── Scroll-triggered fade-in wrapper ───────────────────────────────────────

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Icons ──────────────────────────────────────────────────────────────────

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z' />
      <path strokeLinecap='round' strokeLinejoin='round' d='M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z' />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z' />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z' />
      <path strokeLinecap='round' strokeLinejoin='round' d='M6 6h.008v.008H6V6Z' />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0' />
    </svg>
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M7 17L17 7M17 7H9M17 7V15' />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.7} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3' />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='currentColor' viewBox='0 0 24 24'>
      <path d='M12 2l1.9 5.7L20 9.5l-5.1 2.3L13 18l-1-5.9L6 10.5l5.1-1.4L12 2z' />
    </svg>
  );
}

// ─── Primary CTA button ─────────────────────────────────────────────────────

function PrimaryButton({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(5,85,241,0.6)] transition-all duration-300 hover:bg-primary-hover hover:shadow-[0_18px_40px_-10px_rgba(5,85,241,0.7)] ${className}`}
    >
      <span>{children}</span>
      <span className='flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:rotate-45'>
        <ArrowUpRightIcon className='h-4 w-4' />
      </span>
    </Link>
  );
}

function SecondaryButton({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full bg-secondary px-7 py-3.5 text-sm font-semibold text-foreground transition-all duration-300 hover:bg-secondary-hover ${className}`}
    >
      <span>{children}</span>
      <DownloadIcon className='h-4 w-4' />
    </Link>
  );
}

// ─── Section top label ──────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  children,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 ${className}`}>
      <Icon className='h-4 w-4 text-primary' />
      <span className='text-xs font-semibold uppercase tracking-[0.18em] text-muted'>{children}</span>
    </div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className='relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24'>
      <div className='absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl' />
        <div className='absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-primary/10 to-transparent blur-3xl' />
      </div>

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]'>
          <Reveal>
            <div className='text-center lg:text-left'>
              <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5'>
                <SparkleIcon className='h-4 w-4 text-primary' />
                <span className='text-sm font-semibold text-foreground'>
                  #1 <span className='text-muted'>EXPENSE PLATFORM</span>
                </span>
              </div>
              <h1 className='text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl'>
                Track bills <span className='design-text'>and</span> split
                <br className='hidden sm:block' /> expenses <span className='design-text'>with</span> ease.
              </h1>
              <p className='mt-6 max-w-xl text-base leading-relaxed text-muted lg:text-lg'>
                Scan receipts with AI, keep your spending organized by category, view monthly analytics, and split shared expenses with friends — all in one place.
              </p>
              <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'>
                <PrimaryButton href='/signup'>Get Started</PrimaryButton>
                <SecondaryButton href='/signin'>Sign In</SecondaryButton>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className='relative'>
              <div className='relative mx-auto max-w-lg'>
                <div className='absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/15 via-accent/10 to-primary/10 blur-2xl' />
                <div className='relative overflow-hidden rounded-[2rem] bg-card shadow-[0_25px_60px_-15px_rgba(5,85,241,0.25)] ring-1 ring-border'>
                  <Image
                    src='/images/scan_bill.png'
                    alt='Scan your bills with AI'
                    width={800}
                    height={600}
                    className='rounded-[2rem]'
                    priority
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Ticker / stats strip */}
        <div className='mt-20 rounded-3xl border border-border bg-card/50 p-8 backdrop-blur-sm'>
          <div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
            <h2 className='text-xl font-semibold text-foreground md:text-2xl'>
              Over <span className='text-primary'>10K+</span> receipts scanned with us!
            </h2>
            <div className='grid w-full grid-cols-3 gap-6 md:w-auto md:gap-12'>
              <div className='text-center md:text-left'>
                <div className='text-2xl font-bold text-foreground md:text-3xl'>50K+</div>
                <div className='mt-1 text-xs uppercase tracking-wider text-muted'>Bills tracked</div>
              </div>
              <div className='text-center md:text-left'>
                <div className='text-2xl font-bold text-foreground md:text-3xl'>99%</div>
                <div className='mt-1 text-xs uppercase tracking-wider text-muted'>AI accuracy</div>
              </div>
              <div className='text-center md:text-left'>
                <div className='text-2xl font-bold text-foreground md:text-3xl'>4M+</div>
                <div className='mt-1 text-xs uppercase tracking-wider text-muted'>Saved smartly</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ───────────────────────────────────────────────────────────────

type Feature = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  image: string;
  span?: 'wide' | 'normal';
};

const features: Feature[] = [
  {
    icon: ScanIcon,
    title: 'AI Receipt Scanning',
    description: 'Snap a photo of any receipt. Our AI extracts store name, items, totals, and date automatically.',
    image: '/images/scan_bill.png',
    span: 'wide',
  },
  {
    icon: ChartIcon,
    title: 'Smart Analytics',
    description: 'See monthly breakdowns, category insights, and spending trends at a glance.',
    image: '/images/invoice_analytics.png',
  },
  {
    icon: UsersIcon,
    title: 'Split with Friends',
    description: 'Create events, add shared expenses, and auto-calculate who owes whom.',
    image: '/images/calculations.png',
  },
  {
    icon: ReceiptIcon,
    title: 'Track Expenses',
    description: 'Keep all your bills organized in one place. Search and filter effortlessly.',
    image: '/images/expenses_tracker.png',
  },
  {
    icon: TagIcon,
    title: 'Auto Categories',
    description: 'Bills are auto-categorized — grocery, dining, electronics, transport, and more.',
    image: '/images/invoice_search.png',
    span: 'wide',
  },
];

function FeatureCard({ feature, delay }: { feature: Feature; delay: number }) {
  const { icon: Icon } = feature;
  const wide = feature.span === 'wide';

  return (
    <Reveal
      delay={delay}
      className={wide ? 'md:col-span-2' : ''}
    >
      <div className='group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_25px_50px_-20px_rgba(5,85,241,0.25)]'>
        <div className='flex items-start gap-4 p-8'>
          <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <Icon className='h-5 w-5' />
          </div>
          <div>
            <h3 className='text-xl font-semibold text-foreground'>{feature.title}</h3>
            <p className='mt-2 text-sm leading-relaxed text-muted'>{feature.description}</p>
          </div>
        </div>
        <div className='relative mt-auto h-60 overflow-hidden bg-gradient-to-br from-secondary via-secondary/70 to-card'>
          <Image
            src={feature.image}
            alt={feature.title}
            fill
            className='object-contain p-6 transition-transform duration-700 group-hover:scale-105'
          />
        </div>
      </div>
    </Reveal>
  );
}

function Features() {
  return (
    <section id='features' className='relative py-20 sm:py-28'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col items-start justify-between gap-6 md:flex-row md:items-end'>
          <div>
            <Reveal>
              <SectionLabel icon={SparkleIcon}>Features</SectionLabel>
              <h2 className='mt-5 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl'>
                Take <span className='design-text'>control</span> of your finances
              </h2>
            </Reveal>
          </div>
          <Reveal delay={100}>
            <p className='max-w-md text-base leading-relaxed text-muted'>
              Powerful tools designed to help you track every expense, split bills fairly, and make smarter money decisions.
            </p>
          </Reveal>
        </div>

        <div className='mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ───────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { title: 'Create an Account', description: 'Sign up for free and verify your email. Get started in seconds.' },
    { title: 'Scan or Enter Bills', description: 'Take a photo of your receipt or enter details manually — AI does the rest.' },
    { title: 'View Your Analytics', description: 'See monthly spending summaries, category breakdowns, and trends.' },
    { title: 'Split Expenses', description: 'Create events, invite friends, add shared expenses, and settle up.' },
  ];

  return (
    <section id='how-it-works' className='relative overflow-hidden py-20 sm:py-28'>
      <div className='absolute inset-0 -z-10 bg-gradient-to-b from-background via-secondary/40 to-background' />

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Reveal>
          <div className='flex flex-col items-center text-center'>
            <SectionLabel icon={ChartIcon}>Process</SectionLabel>
            <h2 className='mt-5 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl'>
              From receipt <span className='design-text'>to</span> insight in seconds
            </h2>
            <p className='mt-5 max-w-xl text-base leading-relaxed text-muted'>
              Managing expenses has never been easier. Get up and running in just a few simple steps.
            </p>
          </div>
        </Reveal>

        <div className='mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {steps.map((item, index) => (
            <Reveal key={item.title} delay={index * 120}>
              <div className='group relative h-full rounded-3xl border border-border bg-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_40px_-20px_rgba(5,85,241,0.3)]'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <span className='text-lg font-bold'>0{index + 1}</span>
                </div>
                <h3 className='mt-6 text-lg font-semibold text-foreground'>{item.title}</h3>
                <p className='mt-2 text-sm leading-relaxed text-muted'>{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonial strip ──────────────────────────────────────────────────────

function TestimonialBand() {
  return (
    <section className='py-16'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Reveal>
          <div className='rounded-3xl border border-border bg-card p-10 text-center sm:p-16'>
            <BellIcon className='mx-auto h-8 w-8 text-primary' />
            <blockquote className='mt-6 text-2xl font-medium leading-relaxed tracking-tight text-foreground sm:text-3xl'>
              &ldquo;BillGenics made splitting our trip expenses effortless. The AI receipt scanner saved us hours of manual entry.&rdquo;
            </blockquote>
            <div className='mt-8 flex items-center justify-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary'>
                SJ
              </div>
              <div className='text-left'>
                <div className='text-sm font-semibold text-foreground'>Sarah Jones</div>
                <div className='text-xs text-muted'>Weekend traveler</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── CTA ────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className='py-20 sm:py-28'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Reveal>
          <div className='relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-16 sm:px-16 sm:py-20'>
            <div className='absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl' />
            <div className='absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl' />

            <div className='relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]'>
              <div>
                <h2 className='text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl'>
                  Ready to take <span className='italic text-white/80'>control</span> of your expenses?
                </h2>
                <p className='mt-5 max-w-xl text-base leading-relaxed text-white/80'>
                  Join BillGenics and start tracking spending, scanning receipts, and splitting bills with friends. Free to get started.
                </p>
              </div>
              <div className='flex flex-col items-start gap-4 sm:flex-row lg:flex-col lg:items-stretch'>
                <Link
                  href='/signup'
                  className='group inline-flex items-center justify-between gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-primary shadow-lg transition-all duration-300 hover:bg-white/95'
                >
                  <span>Sign Up Free</span>
                  <span className='flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 transition-transform duration-300 group-hover:rotate-45'>
                    <ArrowUpRightIcon className='h-4 w-4' />
                  </span>
                </Link>
                <Link
                  href='/signin'
                  className='inline-flex items-center justify-between gap-3 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-white/60 hover:bg-white/10'
                >
                  <span>Sign In</span>
                  <ArrowUpRightIcon className='h-4 w-4' />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/account');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background font-sans'>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TestimonialBand />
        <CTA />
      </main>
    </div>
  );
}

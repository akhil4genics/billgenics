'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Header } from './components/Header';
import { useTheme } from './components/ThemeProvider';

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

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className='relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-32'>
      <div className='absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl' />
        <div className='absolute -bottom-32 -right-32 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-tl from-accent/25 via-primary/15 to-transparent blur-3xl [animation-delay:1s]' />
        <div className='absolute top-1/2 -left-32 h-[400px] w-[400px] animate-pulse rounded-full bg-gradient-to-r from-primary/15 to-accent/10 blur-3xl [animation-delay:2s]' />
      </div>

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid items-center gap-12 lg:grid-cols-2'>
          <Reveal>
            <div className='text-center lg:text-left'>
              <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm'>
                <span className='relative flex h-2 w-2'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75'></span>
                  <span className='relative inline-flex h-2 w-2 rounded-full bg-primary'></span>
                </span>
                AI-powered receipt scanning
              </div>
              <h1 className='text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl'>
                Track Your Expenses,{' '}
                <span className='bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient_3s_linear_infinite]'>
                  Smartly
                </span>
              </h1>
              <p className='mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted lg:mx-0'>
                Scan receipts, track spending by category, view monthly analytics, and split expenses with friends. All in one place.
              </p>
              <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'>
                <Link
                  href='/signin'
                  className='group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110'
                >
                  <ScanIcon className='h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5' />
                  Get Started
                </Link>
                <a
                  href='#features'
                  className='rounded-full border border-border px-8 py-3.5 text-base font-medium text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/5'
                >
                  Learn More
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className='relative'>
              <div className='relative mx-auto max-w-lg'>
                <div className='absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-2xl' />
                <div className='relative overflow-hidden rounded-2xl shadow-2xl shadow-primary/10 ring-1 ring-white/10'>
                  <Image
                    src='/images/scan_bill.png'
                    alt='Scan your bills'
                    width={800}
                    height={400}
                    className='rounded-2xl'
                    priority
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Features ───────────────────────────────────────────────────────────────

const features = [
  {
    icon: ScanIcon,
    title: 'Scan Receipts',
    description: 'Snap a photo of your receipt and our AI automatically extracts store name, items, totals, and more.',
    image: '/images/scan_bill.png',
  },
  {
    icon: ReceiptIcon,
    title: 'Track Expenses',
    description: 'Keep all your bills organized in one place. Search, filter, and view your spending history effortlessly.',
    image: '/images/expenses_tracker.png',
  },
  {
    icon: ChartIcon,
    title: 'Smart Analytics',
    description: 'See where your money goes with monthly breakdowns, category insights, and spending trends.',
    image: '/images/invoice_analytics.png',
  },
  {
    icon: UsersIcon,
    title: 'Split with Friends',
    description: 'Create events, add shared expenses, and automatically calculate who owes whom. Settle up easily.',
    image: '/images/calculations.png',
  },
  {
    icon: TagIcon,
    title: 'Auto Categories',
    description: 'Bills are automatically categorized — grocery, dining, electronics, transport, and more.',
    image: '/images/invoice_search.png',
  },
  {
    icon: BellIcon,
    title: 'Notifications',
    description: 'Get notified when expenses are added, settlements are made, or you\'re invited to a group.',
    image: '/images/invoice_manage_transparent.png',
  },
];

function Features() {
  return (
    <section id='features' className='relative py-20 sm:py-32'>
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent' />

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Reveal>
          <div className='text-center'>
            <span className='inline-block rounded-full bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-1.5 text-sm font-medium text-primary'>
              Features
            </span>
            <h2 className='mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl'>
              Everything you need to manage expenses
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-muted'>
              Powerful tools to help you track, categorize, and share your expenses.
            </p>
          </div>
        </Reveal>

        <div className='mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 100}>
              <div className='group h-full overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'>
                <div className='relative h-48 overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5'>
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className='object-contain p-4 transition-transform duration-700 group-hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100' />
                </div>
                <div className='p-6'>
                  <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 transition-all duration-300 group-hover:from-primary/20 group-hover:to-accent/20'>
                    <feature.icon className='h-6 w-6 text-primary' />
                  </div>
                  <h3 className='text-xl font-semibold text-foreground'>{feature.title}</h3>
                  <p className='mt-2 leading-relaxed text-muted'>{feature.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ───────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { step: '01', title: 'Create an Account', description: 'Sign up for free and verify your email. Get started in seconds.' },
    { step: '02', title: 'Scan or Enter Bills', description: 'Take a photo of your receipt or enter details manually. AI does the rest.' },
    { step: '03', title: 'View Your Analytics', description: 'See monthly spending summaries, category breakdowns, and trends.' },
    { step: '04', title: 'Split Expenses', description: 'Create events, invite friends, add shared expenses, and settle up.' },
  ];

  return (
    <section id='how-it-works' className='relative overflow-hidden py-20 sm:py-32'>
      <div className='absolute inset-0 -z-10 bg-gradient-to-b from-background via-secondary/30 to-background' />
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent' />

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Reveal>
          <div className='text-center'>
            <span className='inline-block rounded-full bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-1.5 text-sm font-medium text-primary'>
              Simple Process
            </span>
            <h2 className='mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl'>
              How It Works
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-muted'>
              Get started in just a few simple steps. Managing expenses has never been easier.
            </p>
          </div>
        </Reveal>

        <div className='relative mt-20'>
          <div className='absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block' />

          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
            {steps.map((item, index) => (
              <Reveal key={item.step} delay={index * 150}>
                <div className='group relative h-full'>
                  <div className='relative h-full rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5'>
                    <div className='absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-lg shadow-primary/30'>
                      {index + 1}
                    </div>

                    <div className='mt-4'>
                      <h3 className='text-lg font-semibold text-foreground'>{item.title}</h3>
                      <p className='mt-2 text-sm leading-relaxed text-muted'>{item.description}</p>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className='absolute -right-4 top-12 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 text-primary lg:flex'>
                      <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14 5l7 7m0 0l-7 7m7-7H3' />
                      </svg>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className='py-20 sm:py-32'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Reveal>
          <div className='relative overflow-hidden rounded-3xl'>
            <div className='absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary' />
            <div className='absolute -top-20 -right-20 h-60 w-60 animate-pulse rounded-full bg-white/10 blur-3xl' />
            <div className='absolute -bottom-20 -left-20 h-60 w-60 animate-pulse rounded-full bg-white/10 blur-3xl [animation-delay:1.5s]' />

            <div className='relative p-8 sm:p-16'>
              <div className='text-center'>
                <h2 className='text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl'>
                  Ready to take control of your expenses?
                </h2>
                <p className='mx-auto mt-4 max-w-2xl text-lg text-white/80'>
                  Join BillGenics and start tracking your spending, scanning receipts, and splitting bills with friends. Free to get started.
                </p>
                <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
                  <Link
                    href='/signup'
                    className='rounded-full bg-white px-8 py-3.5 text-base font-medium text-primary shadow-lg transition-all duration-300 hover:bg-white/90 hover:shadow-xl'
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    href='/signin'
                    className='rounded-full border border-white/30 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10'
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer() {
  const { theme } = useTheme();

  return (
    <footer className='border-t border-border bg-card'>
      <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <div className='grid gap-8 md:grid-cols-4'>
          <div className='md:col-span-1'>
            <Link href='/' className='inline-block'>
              <Image
                src={theme === 'dark' ? '/images/billgenics.png' : '/images/billgenics_coloured.png'}
                alt='BillGenics'
                width={560}
                height={160}
                className='h-40 w-auto'
              />
            </Link>
            <p className='mt-4 text-sm text-muted'>
              Smart expense tracking, receipt scanning, and bill splitting — all in one app.
            </p>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-foreground'>Product</h3>
            <ul className='mt-4 space-y-2'>
              <li><a href='#features' className='text-sm text-muted transition-colors hover:text-foreground'>Features</a></li>
              <li><a href='#how-it-works' className='text-sm text-muted transition-colors hover:text-foreground'>How It Works</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Security</a></li>
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-foreground'>Company</h3>
            <ul className='mt-4 space-y-2'>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>About</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-foreground'>Legal</h3>
            <ul className='mt-4 space-y-2'>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Privacy Policy</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className='mt-12 border-t border-border pt-8'>
          <p className='text-center text-sm text-muted'>
            &copy; {new Date().getFullYear()} BillGenics. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
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
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

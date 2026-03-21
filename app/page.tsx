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

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5' />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z' />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z' />
    </svg>
  );
}

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z' />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z' />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z' />
      <path strokeLinecap='round' strokeLinejoin='round' d='M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z' />
    </svg>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className='relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-32'>
      {/* Animated gradient orbs */}
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
                Now with smart albums
              </div>
              <h1 className='text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl'>
                Your Memories,{' '}
                <span className='bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient_3s_linear_infinite]'>
                  Beautifully Organized
                </span>
              </h1>
              <p className='mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted lg:mx-0'>
                Upload your photos, create stunning albums, and share your precious moments with friends and family. All
                securely stored in the cloud.
              </p>
              <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'>
                <Link
                  href='/signin'
                  className='group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110'
                >
                  <UploadIcon className='h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5' />
                  Start Uploading
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
                {/* Glow behind the image */}
                <div className='absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-2xl' />
                <div className='relative overflow-hidden rounded-2xl shadow-2xl shadow-primary/10 ring-1 ring-white/10'>
                  <Image
                    src='/images/hero.png'
                    alt='Hero Image'
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
    icon: UploadIcon,
    title: 'Easy Upload',
    description: 'Drag and drop your photos or select from your device. Bulk upload thousands of photos at once with ease.',
    image: '/images/feature-upload.jpg',
  },
  {
    icon: FolderIcon,
    title: 'Smart Albums',
    description: 'Organize your photos into beautiful albums. Auto-categorize by date, location, or create custom collections.',
    image: '/images/feature-albums.jpg',
  },
  {
    icon: ShareIcon,
    title: 'Share with Friends',
    description: 'Share albums with a simple link. Control who can view, comment, or download your precious memories.',
    image: '/images/feature-share.jpg',
  },
  {
    icon: CloudIcon,
    title: 'Cloud Storage',
    description: 'Your photos are safely stored in the cloud. Access them from any device, anywhere in the world.',
    image: '/images/feature-cloud.jpg',
  },
  {
    icon: ShieldIcon,
    title: 'Privacy First',
    description: 'End-to-end encryption keeps your photos private. You decide who sees what, always.',
    image: '/images/feature-privacy.jpg',
  },
  {
    icon: CameraIcon,
    title: 'Original Quality',
    description: 'We preserve your photos in their original quality. No compression, no quality loss.',
    image: '/images/feature-quality.jpg',
  },
];

function Features() {
  return (
    <section id='features' className='relative py-20 sm:py-32'>
      {/* Subtle gradient divider */}
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent' />

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Reveal>
          <div className='text-center'>
            <span className='inline-block rounded-full bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-1.5 text-sm font-medium text-primary'>
              Features
            </span>
            <h2 className='mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl'>
              Everything you need for your photos
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-muted'>
              Powerful features to help you organize, share, and preserve your memories.
            </p>
          </div>
        </Reveal>

        <div className='mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 100}>
              <div className='group h-full overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'>
                <div className='relative h-48 overflow-hidden'>
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className='object-cover transition-transform duration-700 group-hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent' />
                  {/* Gradient overlay on hover */}
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
    { step: '01', title: 'Create an Account', description: 'Sign up for free and get started in seconds. No credit card required.', image: '/images/step-1.jpg' },
    { step: '02', title: 'Upload Your Photos', description: 'Drag and drop or select photos from your device. We support all formats.', image: '/images/step-2.jpg' },
    { step: '03', title: 'Organize into Albums', description: 'Create albums and organize your photos effortlessly with smart tools.', image: '/images/step-3.jpg' },
    { step: '04', title: 'Share with Anyone', description: 'Generate a link and share with friends and family instantly.', image: '/images/step-4.jpg' },
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
              Get started in just a few simple steps. Your memories deserve the best.
            </p>
          </div>
        </Reveal>

        <div className='relative mt-20'>
          {/* Timeline connector */}
          <div className='absolute left-0 right-0 top-24 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block' />

          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
            {steps.map((item, index) => (
              <Reveal key={item.step} delay={index * 150}>
                <div className='group relative h-full'>
                  <div className='relative h-full rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5'>
                    {/* Step badge with gradient */}
                    <div className='absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-lg shadow-primary/30'>
                      {index + 1}
                    </div>

                    <div className='relative mb-4 mt-2 aspect-video overflow-hidden rounded-xl'>
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className='object-cover transition-transform duration-700 group-hover:scale-105'
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                    </div>

                    <h3 className='text-lg font-semibold text-foreground'>{item.title}</h3>
                    <p className='mt-2 text-sm leading-relaxed text-muted'>{item.description}</p>
                  </div>

                  {/* Desktop connector arrow */}
                  {index < steps.length - 1 && (
                    <div className='absolute -right-4 top-24 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 text-primary lg:flex'>
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

// ─── Gallery (rebuilt) ──────────────────────────────────────────────────────

function Gallery() {
  const galleryImages = [
    { src: '/images/gallery/gallery-1.jpg', span: 'col-span-2 row-span-2' },
    { src: '/images/gallery/gallery-2.jpg', span: '' },
    { src: '/images/gallery/gallery-3.jpg', span: '' },
    { src: '/images/gallery/gallery-4.jpg', span: '' },
    { src: '/images/gallery/gallery-5.jpg', span: '' },
    { src: '/images/gallery/gallery-6.jpg', span: 'col-span-2' },
    { src: '/images/gallery/gallery-7.jpg', span: '' },
    { src: '/images/gallery/gallery-8.jpg', span: '' },
    { src: '/images/gallery/gallery-9.jpg', span: '' },
    { src: '/images/gallery/gallery-10.jpg', span: '' },
    { src: '/images/gallery/gallery-11.jpg', span: 'col-span-2' },
  ];

  return (
    <section className='relative py-20 sm:py-32'>
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent' />

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Reveal>
          <div className='text-center'>
            <span className='inline-block rounded-full bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-1.5 text-sm font-medium text-primary'>
              Gallery
            </span>
            <h2 className='mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl'>
              Beautiful memories,{' '}
              <span className='bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'>
                beautifully displayed
              </span>
            </h2>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-muted'>
              Create stunning galleries that showcase your photos at their best.
            </p>
          </div>
        </Reveal>

        <div className='mt-16 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4'>
          {galleryImages.map((image, i) => (
            <Reveal key={i} delay={i * 60}>
              <div
                className={`group relative overflow-hidden rounded-2xl ${image.span}`}
              >
                <Image
                  src={image.src}
                  alt={`Gallery image ${i + 1}`}
                  width={600}
                  height={400}
                  className='h-full w-full object-cover transition-all duration-700 group-hover:scale-105'
                />
                {/* Gradient overlay on hover */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100' />
                {/* Subtle border glow on hover */}
                <div className='absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 transition-all duration-500 group-hover:ring-white/20' />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section id='pricing' className='py-20 sm:py-32'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Reveal>
          <div className='relative overflow-hidden rounded-3xl'>
            <div className='absolute inset-0'>
              <Image src='/images/cta-background.jpg' alt='Background' fill className='object-cover' />
              <div className='absolute inset-0 bg-gradient-to-br from-primary/90 via-accent/80 to-primary/90' />
            </div>
            {/* Floating orbs */}
            <div className='absolute -top-20 -right-20 h-60 w-60 animate-pulse rounded-full bg-white/10 blur-3xl' />
            <div className='absolute -bottom-20 -left-20 h-60 w-60 animate-pulse rounded-full bg-white/10 blur-3xl [animation-delay:1.5s]' />

            <div className='relative p-8 sm:p-16'>
              <div className='text-center'>
                <h2 className='text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl'>
                  Ready to preserve your memories?
                </h2>
                <p className='mx-auto mt-4 max-w-2xl text-lg text-white/80'>
                  Join thousands of users who trust PicsGenics with their precious photos. Start for free, upgrade when
                  you need more.
                </p>
                <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
                  <Link
                    href='/signin'
                    className='rounded-full bg-white px-8 py-3.5 text-base font-medium text-primary shadow-lg transition-all duration-300 hover:bg-white/90 hover:shadow-xl'
                  >
                    Get Started
                  </Link>
                  <a
                    href='#'
                    className='rounded-full border border-white/30 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10'
                  >
                    View Pricing
                  </a>
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
                src={theme === 'dark' ? '/images/PicsGenics.png' : '/images/PicsGenics_purple.png'}
                alt='PicsGenics'
                width={560}
                height={160}
                className='h-40 w-auto'
              />
            </Link>
            <p className='mt-4 text-sm text-muted'>
              Your memories, beautifully organized and safely stored in the cloud.
            </p>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-foreground'>Product</h3>
            <ul className='mt-4 space-y-2'>
              <li><a href='#features' className='text-sm text-muted transition-colors hover:text-foreground'>Features</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Pricing</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Security</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Updates</a></li>
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-foreground'>Company</h3>
            <ul className='mt-4 space-y-2'>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>About</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Blog</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Careers</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold text-foreground'>Legal</h3>
            <ul className='mt-4 space-y-2'>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Privacy Policy</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Terms of Service</a></li>
              <li><a href='#' className='text-sm text-muted transition-colors hover:text-foreground'>Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className='mt-12 border-t border-border pt-8'>
          <p className='text-center text-sm text-muted'>
            &copy; {new Date().getFullYear()} PicsGenics. All rights reserved.
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
        <Gallery />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

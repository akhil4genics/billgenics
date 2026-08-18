'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LandingNav } from './components/landing/LandingNav';
import { Hero } from './components/landing/Hero';
import { LogoWall } from './components/landing/LogoWall';
import { Features } from './components/landing/Features';
import { DashboardPreview } from './components/landing/DashboardPreview';
import { HowItWorks } from './components/landing/HowItWorks';
import { AiSection } from './components/landing/AiSection';
import { SplitBills } from './components/landing/SplitBills';
import { Stats } from './components/landing/Stats';
import { Testimonials } from './components/landing/Testimonials';
import { Faq } from './components/landing/Faq';
import { DownloadCta } from './components/landing/DownloadCta';
import { LandingFooter } from './components/landing/LandingFooter';

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
    <div className='min-h-screen overflow-x-clip bg-background font-sans'>
      <LandingNav />
      <main>
        <Hero />
        <LogoWall />
        <Features />
        <DashboardPreview />
        <HowItWorks />
        <AiSection />
        <SplitBills />
        <Stats />
        <Testimonials />
        <Faq />
        <DownloadCta />
      </main>
      <LandingFooter />
    </div>
  );
}

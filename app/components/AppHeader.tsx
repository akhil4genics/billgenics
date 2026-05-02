'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from './ThemeProvider';

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z' />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z' />
    </svg>
  );
}

const NAV = [
  { href: '/account', label: 'Dashboard', match: (p: string) => p === '/account' },
  { href: '/bills', label: 'Bills', match: (p: string) => p.startsWith('/bills') },
  { href: '/events', label: 'Events', match: (p: string) => p.startsWith('/events') },
];

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const pathname = usePathname() || '';

  return (
    <>
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <Link href='/account' className='flex items-center gap-2'>
            <Image
              src={theme === 'dark' ? '/images/billgenics.png' : '/images/billgenics_coloured.png'}
              alt='BillGenics'
              width={560}
              height={160}
              className='h-10 w-auto'
            />
          </Link>

          <nav className='hidden items-center gap-6 md:flex'>
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-sm font-medium transition-colors ${
                    active ? 'text-primary' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className='absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary' />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className='flex items-center gap-3'>
            <button
              onClick={toggleTheme}
              className='rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground'
              aria-label='Toggle theme'
            >
              {theme === 'light' ? <MoonIcon className='h-5 w-5' /> : <SunIcon className='h-5 w-5' />}
            </button>
            {session?.user?.name && (
              <span className='hidden text-sm text-muted sm:block'>{session.user.name}</span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className='rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/20'
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden'>
        <div className='flex items-center justify-around py-2'>
          <Link
            href='/account'
            className={`flex flex-col items-center gap-1 px-3 py-1 ${
              NAV[0].match(pathname) ? 'text-primary' : 'text-muted'
            }`}
          >
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' d='m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' />
            </svg>
            <span className='text-xs'>Dashboard</span>
          </Link>
          <Link
            href='/bills'
            className={`flex flex-col items-center gap-1 px-3 py-1 ${
              NAV[1].match(pathname) ? 'text-primary' : 'text-muted'
            }`}
          >
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' />
            </svg>
            <span className='text-xs'>Bills</span>
          </Link>
          <Link href='/bills/scan' className='flex flex-col items-center gap-1 px-3 py-1 text-muted'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-[0_10px_30px_-10px_rgba(5,85,241,0.6)]'>
              <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
              </svg>
            </div>
          </Link>
          <Link
            href='/events'
            className={`flex flex-col items-center gap-1 px-3 py-1 ${
              NAV[2].match(pathname) ? 'text-primary' : 'text-muted'
            }`}
          >
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' />
            </svg>
            <span className='text-xs'>Events</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarClock,
  LayoutDashboard,
  ReceiptText,
  ScanLine,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';

type NavItem = { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean };

const NAV: NavItem[] = [
  { href: '/account', label: 'Dashboard', icon: LayoutDashboard, match: (p) => p === '/account' },
  {
    href: '/bills',
    label: 'Bills',
    icon: ReceiptText,
    match: (p) => p.startsWith('/bills') && !p.startsWith('/bills/recurring'),
  },
  { href: '/bills/recurring', label: 'Recurring', icon: CalendarClock, match: (p) => p.startsWith('/bills/recurring') },
  { href: '/events', label: 'Events', icon: Users, match: (p) => p.startsWith('/events') },
];

export function AccountSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { theme } = useTheme();
  const pathname = usePathname() || '';
  const logoSrc = theme === 'dark' ? '/images/billgenics.png' : '/images/billgenics_coloured.png';
  const year = new Date().getFullYear();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link href="/account" onClick={onNavigate} className="inline-flex items-center" aria-label="BillGenics home">
          <Image src={logoSrc} alt="BillGenics" width={520} height={150} priority className="h-9 w-auto" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary' : ''}`} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Scan promo */}
      <div className="px-4 pb-4">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/8 to-accent/8 p-4">
          <div className="mb-3 flex h-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <ScanLine className="h-7 w-7 text-white" strokeWidth={1.8} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-foreground">Scan bills in seconds</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">Let AI read your receipts and add bills instantly.</p>
          <Link
            href="/bills/scan"
            onClick={onNavigate}
            className="mt-3 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-primary)] transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ScanLine className="h-4 w-4" aria-hidden />
            Scan Now
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4 text-xs text-muted">
        <p>&copy; {year} BillGenics</p>
        <p className="mt-0.5">All rights reserved</p>
      </div>
    </div>
  );
}

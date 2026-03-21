'use client';

import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../components/ThemeProvider';
import { apiUrl, authHeaders } from '@/lib/api';
import { EBillCategory } from '@backend/shared/types';

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

const CATEGORY_COLORS: Record<string, string> = {
  grocery: 'bg-green-500',
  electronics: 'bg-blue-500',
  telephone: 'bg-purple-500',
  dining: 'bg-orange-500',
  transport: 'bg-yellow-500',
  health: 'bg-red-500',
  utilities: 'bg-cyan-500',
  entertainment: 'bg-pink-500',
  clothing: 'bg-indigo-500',
  other: 'bg-gray-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  grocery: 'Grocery',
  electronics: 'Electronics',
  telephone: 'Telephone',
  dining: 'Dining',
  transport: 'Transport',
  health: 'Health',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  clothing: 'Clothing',
  other: 'Other',
};

interface BillStats {
  totalSpent: number;
  billCount: number;
  categoryBreakdown: { category: EBillCategory; total: number; count: number }[];
  topCategory?: EBillCategory;
  month: number;
  year: number;
}

interface Bill {
  _id: string;
  storeName: string;
  date: string;
  total: number;
  category: string;
  entryMethod: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<BillStats | null>(null);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, selectedMonth, selectedYear]);

  async function fetchData() {
    try {
      setLoading(true);
      const headers = await authHeaders();

      const [statsRes, billsRes] = await Promise.all([
        fetch(`${apiUrl()}/api/bills/stats?month=${selectedMonth}&year=${selectedYear}`, { headers }),
        fetch(`${apiUrl()}/api/bills?month=${selectedMonth}&year=${selectedYear}&limit=5`, { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (billsRes.ok) {
        const billsData = await billsRes.json();
        setRecentBills(billsData.data?.bills || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  function handlePrevMonth() {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }

  function handleNextMonth() {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
      </div>
    );
  }

  const maxCategoryTotal = stats?.categoryBreakdown?.length
    ? Math.max(...stats.categoryBreakdown.map((c) => c.total))
    : 0;

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <Link href='/' className='flex items-center gap-2'>
            <Image
              src={theme === 'dark' ? '/images/billgenics.png' : '/images/billgenics_coloured.png'}
              alt='BillGenics'
              width={560}
              height={160}
              className='h-28 w-auto'
            />
          </Link>

          <nav className='hidden items-center gap-6 md:flex'>
            <Link href='/account' className='text-sm font-medium text-primary'>Dashboard</Link>
            <Link href='/bills' className='text-sm font-medium text-muted hover:text-foreground'>Bills</Link>
            <Link href='/events' className='text-sm font-medium text-muted hover:text-foreground'>Events</Link>
          </nav>

          <div className='flex items-center gap-3'>
            <button onClick={toggleTheme} className='rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground' aria-label='Toggle theme'>
              {theme === 'light' ? <MoonIcon className='h-5 w-5' /> : <SunIcon className='h-5 w-5' />}
            </button>
            <span className='hidden text-sm text-muted sm:block'>{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className='rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/20'
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Welcome & Quick Actions */}
        <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>
              Welcome back, {session?.user?.name?.split(' ')[0]}
            </h1>
            <p className='text-muted'>Here&apos;s your spending summary</p>
          </div>
          <div className='flex gap-3'>
            <Link
              href='/bills/scan'
              className='flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-white shadow-md hover:brightness-110'
            >
              <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z' />
              </svg>
              Scan Bill
            </Link>
            <Link
              href='/bills/new'
              className='flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary'
            >
              <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
              </svg>
              Add Manually
            </Link>
          </div>
        </div>

        {/* Month Selector */}
        <div className='mb-6 flex items-center justify-center gap-4'>
          <button onClick={handlePrevMonth} className='rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground'>
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5 8.25 12l7.5-7.5' />
            </svg>
          </button>
          <h2 className='text-lg font-semibold text-foreground'>
            {months[selectedMonth - 1]} {selectedYear}
          </h2>
          <button onClick={handleNextMonth} className='rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground'>
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' d='m8.25 4.5 7.5 7.5-7.5 7.5' />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className='mb-8 grid gap-4 sm:grid-cols-3'>
              <div className='rounded-2xl border border-border bg-card p-6'>
                <p className='text-sm text-muted'>Total Spent</p>
                <p className='mt-1 text-3xl font-bold text-foreground'>
                  ${(stats?.totalSpent || 0).toFixed(2)}
                </p>
              </div>
              <div className='rounded-2xl border border-border bg-card p-6'>
                <p className='text-sm text-muted'>Bills This Month</p>
                <p className='mt-1 text-3xl font-bold text-foreground'>{stats?.billCount || 0}</p>
              </div>
              <div className='rounded-2xl border border-border bg-card p-6'>
                <p className='text-sm text-muted'>Top Category</p>
                <p className='mt-1 text-3xl font-bold text-foreground'>
                  {stats?.topCategory ? CATEGORY_LABELS[stats.topCategory] : 'N/A'}
                </p>
              </div>
            </div>

            <div className='grid gap-8 lg:grid-cols-2'>
              {/* Category Breakdown */}
              <div className='rounded-2xl border border-border bg-card p-6'>
                <h3 className='mb-4 text-lg font-semibold text-foreground'>Spending by Category</h3>
                {stats?.categoryBreakdown?.length ? (
                  <div className='space-y-3'>
                    {stats.categoryBreakdown
                      .sort((a, b) => b.total - a.total)
                      .map((cat) => (
                        <div key={cat.category}>
                          <div className='flex items-center justify-between text-sm'>
                            <div className='flex items-center gap-2'>
                              <div className={`h-3 w-3 rounded-full ${CATEGORY_COLORS[cat.category] || 'bg-gray-500'}`} />
                              <span className='text-foreground'>{CATEGORY_LABELS[cat.category] || cat.category}</span>
                            </div>
                            <span className='font-medium text-foreground'>${cat.total.toFixed(2)}</span>
                          </div>
                          <div className='mt-1 h-2 overflow-hidden rounded-full bg-secondary'>
                            <div
                              className={`h-full rounded-full ${CATEGORY_COLORS[cat.category] || 'bg-gray-500'} transition-all duration-500`}
                              style={{ width: `${maxCategoryTotal > 0 ? (cat.total / maxCategoryTotal) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className='text-center text-muted py-8'>No bills this month yet</p>
                )}
              </div>

              {/* Recent Bills */}
              <div className='rounded-2xl border border-border bg-card p-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-foreground'>Recent Bills</h3>
                  <Link href='/bills' className='text-sm font-medium text-primary hover:underline'>
                    View All
                  </Link>
                </div>
                {recentBills.length ? (
                  <div className='space-y-3'>
                    {recentBills.map((bill) => (
                      <Link
                        key={bill._id}
                        href={`/bills/${bill._id}`}
                        className='flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50'
                      >
                        <div className='flex items-center gap-3'>
                          <div className={`h-2.5 w-2.5 rounded-full ${CATEGORY_COLORS[bill.category] || 'bg-gray-500'}`} />
                          <div>
                            <p className='font-medium text-foreground'>{bill.storeName}</p>
                            <p className='text-xs text-muted'>
                              {new Date(bill.date).toLocaleDateString()} &middot; {CATEGORY_LABELS[bill.category] || bill.category}
                            </p>
                          </div>
                        </div>
                        <p className='font-semibold text-foreground'>${bill.total.toFixed(2)}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className='py-8 text-center'>
                    <p className='text-muted'>No bills yet</p>
                    <Link href='/bills/scan' className='mt-2 inline-block text-sm font-medium text-primary hover:underline'>
                      Scan your first receipt
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mobile Nav */}
        <nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden'>
          <div className='flex items-center justify-around py-2'>
            <Link href='/account' className='flex flex-col items-center gap-1 px-3 py-1 text-primary'>
              <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' d='m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' />
              </svg>
              <span className='text-xs'>Dashboard</span>
            </Link>
            <Link href='/bills' className='flex flex-col items-center gap-1 px-3 py-1 text-muted'>
              <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' />
              </svg>
              <span className='text-xs'>Bills</span>
            </Link>
            <Link href='/bills/scan' className='flex flex-col items-center gap-1 px-3 py-1 text-muted'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-lg'>
                <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
                </svg>
              </div>
            </Link>
            <Link href='/events' className='flex flex-col items-center gap-1 px-3 py-1 text-muted'>
              <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' />
              </svg>
              <span className='text-xs'>Events</span>
            </Link>
          </div>
        </nav>
      </main>
    </div>
  );
}

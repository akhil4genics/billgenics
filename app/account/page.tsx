'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppHeader } from '@/components/AppHeader';
import { apiUrl, authHeaders } from '@/lib/api';
import { EBillCategory } from '@backend/shared/types';

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

interface UpcomingItem {
  recurringBillId: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
}

interface UpcomingForecast {
  occurrences: UpcomingItem[];
  totalUpcoming: number;
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<BillStats | null>(null);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingForecast | null>(null);
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

      // Run the recurring sync first so any due cycles are materialised as Bills
      // before we read stats. Idempotent — safe to call on every dashboard mount.
      await fetch(`${apiUrl()}/api/recurring/sync`, { method: 'POST', headers }).catch(() => {});

      const [statsRes, billsRes, forecastRes] = await Promise.all([
        fetch(`${apiUrl()}/api/bills/stats?month=${selectedMonth}&year=${selectedYear}`, { headers }),
        fetch(`${apiUrl()}/api/bills?month=${selectedMonth}&year=${selectedYear}&limit=5`, { headers }),
        fetch(`${apiUrl()}/api/recurring/forecast?days=14`, { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (billsRes.ok) {
        const billsData = await billsRes.json();
        setRecentBills(billsData.data?.bills || []);
      }

      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        setUpcoming(forecastData.data || null);
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
      <AppHeader />

      <main className='mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8 md:pb-8'>
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
              className='btn-primary'
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
            {/* Upcoming bills (next 14 days) */}
            <div className='mb-6 rounded-2xl border border-border bg-card p-6'>
              <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <p className='text-sm text-muted'>Upcoming bills · next 14 days</p>
                  <p className='mt-1 text-3xl font-bold text-foreground'>
                    ${(upcoming?.totalUpcoming || 0).toFixed(2)}
                  </p>
                </div>
                <Link href='/bills/recurring' className='text-sm font-medium text-primary hover:underline'>
                  Manage recurring bills
                </Link>
              </div>
              {upcoming && upcoming.occurrences.length > 0 ? (
                <div className='space-y-2'>
                  {upcoming.occurrences.slice(0, 6).map((o, i) => {
                    const due = daysUntil(o.dueDate);
                    return (
                      <div
                        key={`${o.recurringBillId}-${i}`}
                        className='flex items-center justify-between rounded-lg border border-border p-3'
                      >
                        <div className='flex items-center gap-3'>
                          <div className={`h-2.5 w-2.5 rounded-full ${CATEGORY_COLORS[o.category] || 'bg-gray-500'}`} />
                          <div>
                            <p className='font-medium text-foreground'>{o.name}</p>
                            <p className='text-xs text-muted'>
                              {due <= 0 ? 'Today' : due === 1 ? 'Tomorrow' : `In ${due} days`} ·{' '}
                              {new Date(o.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <p className='font-semibold text-foreground'>${o.amount.toFixed(2)}</p>
                      </div>
                    );
                  })}
                  {upcoming.occurrences.length > 6 && (
                    <p className='pt-1 text-center text-xs text-muted'>
                      +{upcoming.occurrences.length - 6} more in the next 14 days
                    </p>
                  )}
                </div>
              ) : (
                <div className='rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted'>
                  Nothing scheduled in the next 14 days.{' '}
                  <Link href='/bills/recurring' className='text-primary hover:underline'>
                    Add a recurring bill
                  </Link>{' '}
                  to forecast cash flow.
                </div>
              )}
            </div>

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

      </main>
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightSm,
  CircleDollarSign,
  Plus,
  ReceiptText,
  Repeat,
  ScanLine,
  Sparkles,
  Tags,
  TrendingUp,
} from 'lucide-react';
import { AccountShell } from '@/components/account/AccountShell';
import {
  Card,
  DonutChart,
  MetricCard,
  MetricCardSkeleton,
  SkeletonBlock,
  type DonutSlice,
} from '@/components/account/cards';
import { categoryMeta } from '@/components/account/categories';
import { apiUrl, authHeaders } from '@/lib/api';
import { EBillCategory } from '@backend/shared/types';

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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const fmt = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 });

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<BillStats | null>(null);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingForecast | null>(null);
  const [activeRecurring, setActiveRecurring] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedMonth, selectedYear]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(false);
      const headers = await authHeaders();

      // Run the recurring sync first so any due cycles are materialised as Bills
      // before we read stats. Idempotent — safe to call on every dashboard mount.
      await fetch(`${apiUrl()}/api/recurring/sync`, { method: 'POST', headers }).catch(() => {});

      const [statsRes, billsRes, forecastRes, recurringRes] = await Promise.all([
        fetch(`${apiUrl()}/api/bills/stats?month=${selectedMonth}&year=${selectedYear}`, { headers }),
        fetch(`${apiUrl()}/api/bills?month=${selectedMonth}&year=${selectedYear}&limit=5`, { headers }),
        fetch(`${apiUrl()}/api/recurring/forecast?days=14`, { headers }),
        fetch(`${apiUrl()}/api/recurring`, { headers }),
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

      if (recurringRes.ok) {
        const recurringData = await recurringRes.json();
        const items: { status?: string }[] = recurringData.data?.items || [];
        setActiveRecurring(items.filter((i) => i.status === 'active').length);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(true);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

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
      <div className="flex min-h-screen items-center justify-center bg-[#f8faff] dark:bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const firstName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || 'there';

  // ── Derived values (all from real data) ──────────────────────────────────
  const totalSpent = stats?.totalSpent || 0;
  const billCount = stats?.billCount || 0;
  const averageBill = billCount > 0 ? totalSpent / billCount : 0;
  const sortedCategories = (stats?.categoryBreakdown ?? []).slice().sort((a, b) => b.total - a.total);
  const topCat = stats?.topCategory ? categoryMeta(stats.topCategory) : null;
  const topCatEntry = sortedCategories.find((c) => c.category === stats?.topCategory) ?? sortedCategories[0];
  const topCatPct = totalSpent > 0 && topCatEntry ? Math.round((topCatEntry.total / totalSpent) * 100) : 0;

  const donutData: DonutSlice[] = sortedCategories.map((c) => ({
    label: categoryMeta(c.category).label,
    value: c.total,
    color: categoryMeta(c.category).color,
  }));

  // Next-14-day strip anchored to today, with due-date markers from the forecast
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDays = new Set(
    (upcoming?.occurrences ?? []).map((o) => {
      const d = new Date(o.dueDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );
  const strip = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { date: d, isToday: i === 0, hasDue: dueDays.has(d.getTime()) };
  });

  const upcomingCount = upcoming?.occurrences.length ?? 0;

  return (
    <AccountShell>
      {/* Dashboard header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Here&apos;s your financial overview</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/bills/scan"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-primary)] transition-all hover:bg-primary-hover hover:shadow-[var(--shadow-primary-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:flex-none"
          >
            <ScanLine className="h-4 w-4" aria-hidden />
            Scan Bill
          </Link>
          <Link
            href="/bills/new"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Manually
          </Link>
        </div>
      </div>

      {error && !loading ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted">We couldn&apos;t load your dashboard.</p>
          <button
            onClick={fetchData}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-primary)] hover:bg-primary-hover"
          >
            Try again
          </button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ── Upcoming bills feature card ── */}
          <Card>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center">
              {/* Left: total */}
              <div>
                <p className="text-sm text-muted">Upcoming bills · Next 14 days</p>
                {loading ? (
                  <SkeletonBlock className="mt-2 h-9 w-32" />
                ) : (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                    <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                      {fmt(upcoming?.totalUpcoming || 0)}
                    </p>
                    {upcomingCount === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                        On track
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {upcomingCount} incoming
                      </span>
                    )}
                  </div>
                )}
                <p className="mt-3 text-sm text-muted">
                  {upcomingCount === 0
                    ? 'Nothing scheduled in the next 14 days.'
                    : `${upcomingCount} ${upcomingCount === 1 ? 'bill is' : 'bills are'} due in the next 14 days.`}
                </p>
                <Link href="/bills/recurring" className="mt-1 inline-block text-sm font-semibold text-primary hover:underline">
                  {upcomingCount === 0 ? 'Add a recurring bill' : 'View recurring bills'} to forecast cash flow.
                </Link>
              </div>

              {/* Right: month nav + 14-day strip */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      aria-label="Previous month"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden />
                    </button>
                    <span className="min-w-[8.5rem] text-center text-sm font-semibold text-foreground" aria-live="polite">
                      {MONTHS[selectedMonth - 1]} {selectedYear}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      aria-label="Next month"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                  <Link
                    href="/bills/recurring"
                    className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
                  >
                    Manage recurring bills
                    <ChevronRightSm className="h-4 w-4" aria-hidden />
                  </Link>
                </div>

                <div className="-mx-1 overflow-x-auto pb-1">
                  <div className="flex min-w-max gap-1.5 px-1" role="list" aria-label="Next 14 days">
                    {strip.map((d) => (
                      <div
                        key={d.date.toISOString()}
                        role="listitem"
                        className={`flex w-11 shrink-0 flex-col items-center gap-1 rounded-xl border px-1 py-2 ${
                          d.isToday ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <span className="text-[10px] font-medium uppercase text-muted">
                          {d.date.toLocaleDateString('en-AU', { weekday: 'short' }).slice(0, 3)}
                        </span>
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                            d.isToday ? 'bg-primary text-white' : 'text-foreground'
                          }`}
                        >
                          {d.date.getDate()}
                        </span>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${d.hasDue ? 'bg-accent' : 'bg-transparent'}`}
                          aria-label={d.hasDue ? 'Bill due' : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Metric cards ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard
                  icon={CircleDollarSign}
                  tint="#3B4EF8"
                  label="Total Spent"
                  value={fmt(totalSpent)}
                  support={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
                />
                <MetricCard
                  icon={ReceiptText}
                  tint="#6C63FF"
                  label="Bills This Month"
                  value={billCount}
                  support={billCount === 1 ? 'Total bill' : 'Total bills'}
                />
                <MetricCard
                  icon={TrendingUp}
                  tint="#10B981"
                  label="Average Bill"
                  value={fmt(averageBill)}
                  support={billCount > 0 ? `Across ${billCount} ${billCount === 1 ? 'bill' : 'bills'}` : 'This month'}
                />
                <MetricCard
                  icon={Tags}
                  tint="#F59E0B"
                  label="Top Category"
                  value={topCat ? topCat.label : '—'}
                  support={topCatEntry ? `${fmt(topCatEntry.total)} · ${topCatPct}%` : 'This month'}
                >
                  {topCatEntry && (
                    <DonutChart
                      size={56}
                      thickness={9}
                      ariaLabel={`${topCat?.label} is ${topCatPct}% of spending`}
                      data={[
                        { label: 'top', value: topCatEntry.total, color: topCat?.color || '#6C63FF' },
                        { label: 'rest', value: Math.max(totalSpent - topCatEntry.total, 0), color: 'var(--secondary)' },
                      ]}
                    />
                  )}
                </MetricCard>
              </>
            )}
          </div>

          {/* ── Category + Recent bills ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Spending by category */}
            <Card>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-foreground">Spending by Category</h2>
                <span className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted">
                  {MONTHS[selectedMonth - 1]}
                </span>
              </div>

              {loading ? (
                <div className="flex items-center gap-6">
                  <SkeletonBlock className="h-44 w-44 !rounded-full" />
                  <div className="flex-1 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonBlock key={i} className="h-5 w-full" />
                    ))}
                  </div>
                </div>
              ) : donutData.length ? (
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <DonutChart
                    data={donutData}
                    ariaLabel={`Spending by category totalling ${fmt(totalSpent)}`}
                    centerTop={<span className="font-display text-2xl font-bold text-foreground">{fmt(totalSpent)}</span>}
                    centerBottom={<span className="text-xs text-muted">Total</span>}
                  />
                  <ul className="w-full flex-1 space-y-2.5">
                    {sortedCategories.map((c) => {
                      const meta = categoryMeta(c.category);
                      const pct = totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0;
                      return (
                        <li key={c.category} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                            <span className="truncate text-foreground">{meta.label}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-3">
                            <span className="font-semibold text-foreground">{fmt(c.total)}</span>
                            <span className="w-10 text-right text-xs text-muted">{pct}%</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted">
                    <CircleDollarSign className="h-6 w-6" aria-hidden />
                  </span>
                  <p className="text-sm text-muted">No spending recorded this month yet.</p>
                  <Link href="/bills/scan" className="text-sm font-semibold text-primary hover:underline">
                    Scan your first receipt
                  </Link>
                </div>
              )}
            </Card>

            {/* Recent bills */}
            <Card>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-foreground">Recent Bills</h2>
                <Link href="/bills" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  View All
                  <ChevronRightSm className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonBlock key={i} className="h-16 w-full !rounded-2xl" />
                  ))}
                </div>
              ) : recentBills.length ? (
                <ul className="space-y-2.5">
                  {recentBills.map((bill) => {
                    const meta = categoryMeta(bill.category);
                    const Icon = meta.icon;
                    return (
                      <li key={bill._id}>
                        <Link
                          href={`/bills/${bill._id}`}
                          className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                          >
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{bill.storeName}</p>
                            <p className="truncate text-xs text-muted">
                              {new Date(bill.date).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              {' · '}
                              {meta.label}
                            </p>
                          </div>
                          <p className="shrink-0 font-semibold text-foreground">{fmt(bill.total)}</p>
                          <ChevronRightSm className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted">
                    <ReceiptText className="h-6 w-6" aria-hidden />
                  </span>
                  <p className="text-sm text-muted">No bills recorded this month yet.</p>
                  <Link href="/bills/scan" className="text-sm font-semibold text-primary hover:underline">
                    Scan your first receipt
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* ── Smart insights ── */}
          <Card>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="lg:max-w-md">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="font-display text-lg font-semibold text-foreground">Smart Insights</h2>
                </div>
                {loading ? (
                  <SkeletonBlock className="mt-3 h-4 w-64" />
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {upcomingCount === 0
                      ? `You're on top of your bills — nothing is due in the next 14 days.`
                      : `${fmt(upcoming?.totalUpcoming || 0)} across ${upcomingCount} ${upcomingCount === 1 ? 'bill' : 'bills'} is due in the next 14 days.`}
                    {topCat && ` Your highest spending category is ${topCat.label}.`}
                  </p>
                )}
              </div>

              {!loading && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <InsightStat icon={Repeat} label="Active recurring" value={activeRecurring != null ? String(activeRecurring) : '—'} href="/bills/recurring" />
                  <InsightStat icon={ReceiptText} label="Bills this month" value={String(billCount)} href="/bills" />
                  <InsightStat icon={CircleDollarSign} label="Average bill" value={fmt(averageBill)} />
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </AccountShell>
  );
}

function InsightStat({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Repeat;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/60">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-[1.15rem] w-[1.15rem]" aria-hidden />
      </span>
      <p className="mt-3 font-display text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-2xl">
      {inner}
    </Link>
  ) : (
    inner
  );
}

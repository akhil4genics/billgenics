'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AppHeader } from '../components/AppHeader';
import { apiUrl, authHeaders } from '@/lib/api';
import { EBillCategory } from '@backend/shared/types';

const CATEGORY_COLORS: Record<string, string> = {
  grocery: 'bg-green-500/10 text-green-600',
  electronics: 'bg-blue-500/10 text-blue-600',
  telephone: 'bg-purple-500/10 text-purple-600',
  dining: 'bg-orange-500/10 text-orange-600',
  transport: 'bg-yellow-500/10 text-yellow-600',
  health: 'bg-red-500/10 text-red-600',
  utilities: 'bg-cyan-500/10 text-cyan-600',
  entertainment: 'bg-pink-500/10 text-pink-600',
  clothing: 'bg-indigo-500/10 text-indigo-600',
  other: 'bg-gray-500/10 text-gray-600',
};

const CATEGORY_LABELS: Record<string, string> = {
  grocery: 'Grocery', electronics: 'Electronics', telephone: 'Telephone', dining: 'Dining',
  transport: 'Transport', health: 'Health', utilities: 'Utilities', entertainment: 'Entertainment',
  clothing: 'Clothing', other: 'Other',
};

interface Bill {
  _id: string;
  storeName: string;
  date: string;
  total: number;
  category: string;
  entryMethod: string;
  tags: string[];
  items: { name: string; total: number }[];
}

export default function BillsPage() {
  const { status } = useSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (status === 'authenticated') fetchBills();
  }, [status, page, selectedCategory, selectedMonth, selectedYear, debouncedQuery]);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await authHeaders();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      // Only add date filters when not searching (search should span all time)
      if (!debouncedQuery) {
        params.set('month', selectedMonth.toString());
        params.set('year', selectedYear.toString());
      }
      if (selectedCategory) params.set('category', selectedCategory);
      if (debouncedQuery) params.set('q', debouncedQuery);

      const res = await fetch(`${apiUrl()}/api/bills?${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBills(data.data?.bills || []);
        setTotal(data.data?.total || 0);
      }
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [status, page, selectedCategory, selectedMonth, selectedYear, debouncedQuery]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const totalPages = Math.ceil(total / 20);

  return (
    <div className='min-h-screen bg-background'>
      <AppHeader />
      <div className='mx-auto max-w-4xl px-4 py-8 pb-24 md:pb-8'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>My Bills</h1>
          </div>
          <div className='flex gap-2'>
            <Link href='/bills/scan' className='btn-primary'>
              Scan
            </Link>
            <Link href='/bills/new' className='btn-ghost'>
              Add Manually
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className='mb-4'>
          <div className='relative'>
            <svg className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' />
            </svg>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by store name, items, tags, warranty...'
              className='w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground'
              >
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className='mb-6 flex flex-wrap items-center gap-3'>
          {!debouncedQuery && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setPage(1); }}
                className='rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground'
              >
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setPage(1); }}
                className='rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground'
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className='rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground'
          >
            <option value=''>All Categories</option>
            {Object.values(EBillCategory).map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
          {debouncedQuery && (
            <span className='text-sm text-muted'>
              Searching across all dates
            </span>
          )}
        </div>

        {/* Bills List */}
        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          </div>
        ) : bills.length ? (
          <>
            <div className='space-y-3'>
              {bills.map((bill) => (
                <Link
                  key={bill._id}
                  href={`/bills/${bill._id}`}
                  className='flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md'
                >
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-semibold text-foreground'>{bill.storeName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[bill.category] || CATEGORY_COLORS.other}`}>
                        {CATEGORY_LABELS[bill.category] || bill.category}
                      </span>
                    </div>
                    <p className='mt-1 text-sm text-muted'>
                      {new Date(bill.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {bill.items?.length ? ` \u00B7 ${bill.items.length} items` : ''}
                    </p>
                    {bill.tags?.length > 0 && (
                      <div className='mt-1.5 flex flex-wrap gap-1'>
                        {bill.tags.map((tag) => (
                          <span
                            key={tag}
                            onClick={(e) => { e.preventDefault(); setSearchQuery(tag); }}
                            className='cursor-pointer rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20'
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className='ml-4 shrink-0 text-lg font-bold text-foreground'>${bill.total.toFixed(2)}</p>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-center gap-2'>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className='rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50'
                >
                  Previous
                </button>
                <span className='text-sm text-muted'>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className='rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50'
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className='rounded-xl border border-dashed border-border py-16 text-center'>
            <p className='text-lg text-muted'>
              {debouncedQuery ? `No bills matching "${debouncedQuery}"` : 'No bills found for this period'}
            </p>
            <p className='mt-2 text-sm text-muted'>
              {debouncedQuery ? 'Try different search terms' : 'Scan a receipt or add a bill manually to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

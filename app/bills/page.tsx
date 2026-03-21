'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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

  useEffect(() => {
    if (status === 'authenticated') fetchBills();
  }, [status, page, selectedCategory, selectedMonth, selectedYear]);

  async function fetchBills() {
    try {
      setLoading(true);
      const headers = await authHeaders();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });
      if (selectedCategory) params.set('category', selectedCategory);

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
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const totalPages = Math.ceil(total / 20);

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-4xl px-4 py-8'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <Link href='/account' className='text-sm text-muted hover:text-foreground'>&larr; Dashboard</Link>
            <h1 className='mt-1 text-2xl font-bold text-foreground'>My Bills</h1>
          </div>
          <div className='flex gap-2'>
            <Link href='/bills/scan' className='rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-white hover:brightness-110'>
              Scan
            </Link>
            <Link href='/bills/new' className='rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary'>
              Add Manually
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className='mb-6 flex flex-wrap items-center gap-3'>
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
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='font-semibold text-foreground'>{bill.storeName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[bill.category] || CATEGORY_COLORS.other}`}>
                        {CATEGORY_LABELS[bill.category] || bill.category}
                      </span>
                    </div>
                    <p className='mt-1 text-sm text-muted'>
                      {new Date(bill.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {bill.items?.length ? ` \u00B7 ${bill.items.length} items` : ''}
                    </p>
                  </div>
                  <p className='text-lg font-bold text-foreground'>${bill.total.toFixed(2)}</p>
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
            <p className='text-lg text-muted'>No bills found for this period</p>
            <p className='mt-2 text-sm text-muted'>Scan a receipt or add a bill manually to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

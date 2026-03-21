'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { apiUrl, authHeaders } from '@/lib/api';
import { EBillCategory } from '@backend/shared/types';

const CATEGORY_LABELS: Record<string, string> = {
  grocery: 'Grocery', electronics: 'Electronics', telephone: 'Telephone', dining: 'Dining',
  transport: 'Transport', health: 'Health', utilities: 'Utilities', entertainment: 'Entertainment',
  clothing: 'Clothing', other: 'Other',
};

const CATEGORY_BADGE: Record<string, string> = {
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

interface Bill {
  _id: string;
  storeName: string;
  storeABN?: string;
  storeAddress?: string;
  date: string;
  category: string;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  notes?: string;
  entryMethod: string;
  createdAt: string;
}

export default function BillDetailPage() {
  useSession({ required: true });
  const router = useRouter();
  const params = useParams();
  const billId = params.billId as string;

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Bill>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBill();
  }, [billId]);

  async function fetchBill() {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/bills/${billId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBill(data.data);
      } else {
        toast.error('Bill not found');
        router.push('/bills');
      }
    } catch {
      toast.error('Failed to load bill');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/bills/${billId}`, { method: 'DELETE', headers });
      if (res.ok) {
        toast.success('Bill deleted');
        router.push('/bills');
      }
    } catch {
      toast.error('Failed to delete bill');
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/bills/${billId}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const data = await res.json();
        setBill(data.data);
        setEditing(false);
        toast.success('Bill updated');
      }
    } catch {
      toast.error('Failed to update bill');
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    if (!bill) return;
    setEditData({
      storeName: bill.storeName,
      storeABN: bill.storeABN,
      storeAddress: bill.storeAddress,
      date: bill.date.split('T')[0],
      category: bill.category,
      subtotal: bill.subtotal,
      tax: bill.tax,
      total: bill.total,
      paymentMethod: bill.paymentMethod,
      notes: bill.notes,
    });
    setEditing(true);
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-3xl px-4 py-8'>
        <Link href='/bills' className='text-sm text-muted hover:text-foreground'>&larr; All Bills</Link>

        <div className='mt-4 flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>{bill.storeName}</h1>
            <div className='mt-1 flex items-center gap-2'>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_BADGE[bill.category] || CATEGORY_BADGE.other}`}>
                {CATEGORY_LABELS[bill.category] || bill.category}
              </span>
              <span className='text-sm text-muted'>
                {new Date(bill.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className='text-xs text-muted capitalize'>({bill.entryMethod})</span>
            </div>
          </div>
          <div className='flex gap-2'>
            <button onClick={startEditing} className='rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-secondary'>
              Edit
            </button>
            <button onClick={handleDelete} className='rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/20'>
              Delete
            </button>
          </div>
        </div>

        {editing ? (
          <div className='mt-6 space-y-4 rounded-xl border border-border bg-card p-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label className='block text-sm font-medium text-foreground'>Store Name</label>
                <input type='text' value={editData.storeName || ''} onChange={(e) => setEditData({ ...editData, storeName: e.target.value })} className='mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground' />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground'>Date</label>
                <input type='date' value={editData.date || ''} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className='mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground' />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground'>Category</label>
                <select value={editData.category || ''} onChange={(e) => setEditData({ ...editData, category: e.target.value })} className='mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground'>
                  {Object.values(EBillCategory).map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground'>Total</label>
                <input type='number' value={editData.total || 0} onChange={(e) => setEditData({ ...editData, total: parseFloat(e.target.value) || 0 })} className='mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground' step='0.01' />
              </div>
            </div>
            <div className='flex gap-3'>
              <button onClick={handleSave} disabled={saving} className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50'>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} className='rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary'>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Details */}
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              {bill.storeABN && (
                <div className='rounded-xl border border-border bg-card p-4'>
                  <p className='text-xs text-muted'>ABN</p>
                  <p className='mt-1 font-medium text-foreground'>{bill.storeABN}</p>
                </div>
              )}
              {bill.storeAddress && (
                <div className='rounded-xl border border-border bg-card p-4'>
                  <p className='text-xs text-muted'>Address</p>
                  <p className='mt-1 font-medium text-foreground'>{bill.storeAddress}</p>
                </div>
              )}
              {bill.paymentMethod && (
                <div className='rounded-xl border border-border bg-card p-4'>
                  <p className='text-xs text-muted'>Payment Method</p>
                  <p className='mt-1 font-medium text-foreground'>{bill.paymentMethod}</p>
                </div>
              )}
            </div>

            {/* Items */}
            {bill.items.length > 0 && (
              <div className='mt-6 rounded-xl border border-border bg-card'>
                <div className='border-b border-border p-4'>
                  <h3 className='font-semibold text-foreground'>Items ({bill.items.length})</h3>
                </div>
                <div className='divide-y divide-border'>
                  {bill.items.map((item, i) => (
                    <div key={i} className='flex items-center justify-between p-4'>
                      <div>
                        <p className='font-medium text-foreground'>{item.name}</p>
                        <p className='text-sm text-muted'>{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                      </div>
                      <p className='font-semibold text-foreground'>${item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className='mt-6 rounded-xl border border-border bg-card p-4'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted'>Subtotal</span>
                  <span className='text-foreground'>${bill.subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted'>Tax</span>
                  <span className='text-foreground'>${bill.tax.toFixed(2)}</span>
                </div>
                <div className='border-t border-border pt-2'>
                  <div className='flex justify-between'>
                    <span className='font-semibold text-foreground'>Total</span>
                    <span className='text-xl font-bold text-foreground'>${bill.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {bill.notes && (
              <div className='mt-6 rounded-xl border border-border bg-card p-4'>
                <p className='text-xs text-muted'>Notes</p>
                <p className='mt-1 text-foreground'>{bill.notes}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

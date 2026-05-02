'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { AppHeader } from '../../components/AppHeader';
import { apiUrl, authHeaders } from '@/lib/api';
import { EBillCategory } from '@backend/shared/types';

const CATEGORY_LABELS: Record<string, string> = {
  grocery: 'Grocery', electronics: 'Electronics', telephone: 'Telephone', dining: 'Dining',
  transport: 'Transport', health: 'Health', utilities: 'Utilities', entertainment: 'Entertainment',
  clothing: 'Clothing', other: 'Other',
};

interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function NewBillPage() {
  useSession({ required: true });
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [storeABN, setStoreABN] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>(EBillCategory.OTHER);
  const [items, setItems] = useState<BillItem[]>([{ name: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [warrantyDetails, setWarrantyDetails] = useState('');

  function updateItem(index: number, field: string, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].total = updated[index].quantity * updated[index].unitPrice;
    }
    setItems(updated);
    recalculate(updated);
  }

  function recalculate(itemList: BillItem[]) {
    const sub = itemList.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(Math.round(sub * 100) / 100);
    setTotal(Math.round((sub + tax) * 100) / 100);
  }

  function addItem() {
    setItems([...items, { name: '', quantity: 1, unitPrice: 0, total: 0 }]);
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    recalculate(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!storeName.trim()) {
      toast.error('Store name is required');
      return;
    }
    if (total <= 0) {
      toast.error('Total must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      const headers = await authHeaders();

      const res = await fetch(`${apiUrl()}/api/bills`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: storeName.trim(),
          storeABN: storeABN.trim() || undefined,
          storeAddress: storeAddress.trim() || undefined,
          date,
          category,
          items: items.filter((i) => i.name.trim()),
          subtotal,
          tax,
          total,
          paymentMethod: paymentMethod.trim() || undefined,
          notes: notes.trim() || undefined,
          tags,
          warranty: (warrantyExpiry || warrantyDetails.trim()) ? {
            expiryDate: warrantyExpiry || undefined,
            details: warrantyDetails.trim() || undefined,
          } : undefined,
          entryMethod: 'manual',
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      toast.success('Bill saved!');
      router.push('/bills');
    } catch {
      toast.error('Failed to save bill');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <AppHeader />
      <div className='mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8'>
        <Link href='/bills' className='text-sm text-muted hover:text-foreground'>&larr; Bills</Link>
        <h1 className='mt-2 text-2xl font-bold text-foreground'>Add Bill Manually</h1>

        <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label className='block text-sm font-medium text-foreground'>Store Name *</label>
              <input
                type='text'
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-foreground'>Date *</label>
              <input
                type='date'
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-foreground'>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
              >
                {Object.values(EBillCategory).map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-foreground'>Payment Method</label>
              <input
                type='text'
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder='e.g. Cash, Card, EFTPOS'
                className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-foreground'>ABN</label>
              <input
                type='text'
                value={storeABN}
                onChange={(e) => setStoreABN(e.target.value)}
                className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-foreground'>Store Address</label>
              <input
                type='text'
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-foreground'>Items</h3>
              <button type='button' onClick={addItem} className='text-sm font-medium text-primary hover:underline'>+ Add Item</button>
            </div>
            <div className='mt-3 space-y-2'>
              {items.map((item, i) => (
                <div key={i} className='rounded-lg border border-border bg-card p-3'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='text'
                      value={item.name}
                      onChange={(e) => updateItem(i, 'name', e.target.value)}
                      placeholder='Item name'
                      className='min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none'
                    />
                    {items.length > 1 && (
                      <button type='button' onClick={() => removeItem(i)} className='shrink-0 text-red-500 hover:text-red-600'>
                        <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className='mt-2 flex items-center gap-2'>
                    <label className='text-xs text-muted'>Qty</label>
                    <input
                      type='number'
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                      className='w-16 rounded border border-border bg-background px-2 py-1 text-center text-sm text-foreground'
                      min='0'
                      step='1'
                    />
                    <span className='text-sm text-muted'>x $</span>
                    <input
                      type='number'
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className='w-20 min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-sm text-foreground'
                      min='0'
                      step='0.01'
                    />
                    <span className='shrink-0 text-right text-sm font-medium text-foreground'>${item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className='grid gap-4 sm:grid-cols-3'>
            <div>
              <label className='block text-sm font-medium text-foreground'>Subtotal</label>
              <input
                type='number'
                value={subtotal}
                onChange={(e) => { setSubtotal(parseFloat(e.target.value) || 0); setTotal((parseFloat(e.target.value) || 0) + tax); }}
                className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                step='0.01'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-foreground'>Tax</label>
              <input
                type='number'
                value={tax}
                onChange={(e) => { setTax(parseFloat(e.target.value) || 0); setTotal(subtotal + (parseFloat(e.target.value) || 0)); }}
                className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                step='0.01'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-foreground'>Total *</label>
              <input
                type='number'
                value={total}
                onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
                className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground font-bold'
                step='0.01'
                required
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className='block text-sm font-medium text-foreground'>Tags</label>
            <div className='mt-1 flex flex-wrap gap-1'>
              {tags.map((tag) => (
                <span key={tag} className='flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'>
                  {tag}
                  <button type='button' onClick={() => setTags(tags.filter((t) => t !== tag))} className='hover:text-red-500'>
                    <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' /></svg>
                  </button>
                </span>
              ))}
            </div>
            <div className='mt-2 flex gap-2'>
              <input
                type='text'
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const tag = tagInput.trim().toLowerCase();
                    if (tag && !tags.includes(tag)) { setTags([...tags, tag]); setTagInput(''); }
                  }
                }}
                placeholder='e.g. warranty, tax-deductible, reimbursable'
                className='flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground'
              />
              <button
                type='button'
                onClick={() => {
                  const tag = tagInput.trim().toLowerCase();
                  if (tag && !tags.includes(tag)) { setTags([...tags, tag]); setTagInput(''); }
                }}
                className='rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20'
              >
                Add
              </button>
            </div>
          </div>

          {/* Warranty */}
          <div>
            <label className='block text-sm font-medium text-foreground'>Warranty</label>
            <div className='mt-1 grid gap-3 sm:grid-cols-2'>
              <div>
                <label className='block text-xs text-muted'>Expiry Date</label>
                <input
                  type='date'
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground'
                />
              </div>
              <div>
                <label className='block text-xs text-muted'>Details</label>
                <input
                  type='text'
                  value={warrantyDetails}
                  onChange={(e) => setWarrantyDetails(e.target.value)}
                  placeholder='e.g. 2 year manufacturer warranty'
                  className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground'
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className='block text-sm font-medium text-foreground'>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
              placeholder='Any additional notes...'
            />
          </div>

          <button
            type='submit'
            disabled={saving}
            className='btn-primary-block'
          >
            {saving ? 'Saving...' : 'Save Bill'}
          </button>
        </form>
      </div>
    </div>
  );
}

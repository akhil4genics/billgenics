'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
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

interface ParsedBill {
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
  receiptImageKey?: string;
}

const SCAN_MAX_BYTES = 5 * 1024 * 1024;
const SCAN_MAX_DIMENSION = 1600;

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, SCAN_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    );
    if (!blob) throw new Error('Image encoding failed');
    if (blob.size <= SCAN_MAX_BYTES) return blob;
  }
  throw new Error('Could not compress image under 5MB');
}

export default function ScanBillPage() {
  useSession({ required: true });
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedBill | null>(null);
  const [scanKey, setScanKey] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be under 20MB');
      return;
    }

    setScanning(true);
    try {
      const compressed = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressed);
      setPreview(previewUrl);
      await scanReceipt(compressed);
    } catch {
      toast.error('Failed to process image. Please try again.');
      setScanning(false);
    }
  }

  async function scanReceipt(blob: Blob) {
    try {
      const headers = await authHeaders();
      const contentType = blob.type || 'image/jpeg';

      // 1. Get presigned upload URL for a temp scan key
      const urlRes = await fetch(`${apiUrl()}/api/bills/scan/upload-url`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { data: { uploadUrl, key } } = await urlRes.json();

      // 2. Upload directly to S3
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
      });
      if (!putRes.ok) throw new Error('Failed to upload image');

      // 3. Ask backend to validate + extract via OpenAI (single round-trip)
      const scanRes = await fetch(`${apiUrl()}/api/bills/scan`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await scanRes.json().catch(() => null);

      if (!scanRes.ok) {
        if (data?.code === 'NOT_A_RECEIPT') {
          setPreview(null);
          setScanKey(null);
          if (cameraInputRef.current) cameraInputRef.current.value = '';
          if (galleryInputRef.current) galleryInputRef.current.value = '';
          toast.error(data.error || 'That image does not look like a receipt.');
          return;
        }
        throw new Error('Scan failed');
      }

      setParsed(data.data);
      setScanKey(data.data.receiptImageKey || key);
      toast.success('Receipt scanned successfully!');
    } catch {
      toast.error('Failed to scan receipt. Try again or enter manually.');
    } finally {
      setScanning(false);
    }
  }

  async function handleSave() {
    if (!parsed) return;

    try {
      setSaving(true);
      const headers = await authHeaders();

      const res = await fetch(`${apiUrl()}/api/bills`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed,
          receiptImageKey: scanKey || parsed.receiptImageKey,
          entryMethod: 'scan',
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

  function updateField<K extends keyof ParsedBill>(key: K, value: ParsedBill[K]) {
    if (parsed) setParsed({ ...parsed, [key]: value });
  }

  function updateItem(index: number, field: string, value: string | number) {
    if (!parsed) return;
    const items = [...parsed.items];
    items[index] = { ...items[index], [field]: value };
    setParsed({ ...parsed, items });
  }

  function removeItem(index: number) {
    if (!parsed) return;
    const items = parsed.items.filter((_, i) => i !== index);
    setParsed({ ...parsed, items });
  }

  function addItem() {
    if (!parsed) return;
    setParsed({
      ...parsed,
      items: [...parsed.items, { name: '', quantity: 1, unitPrice: 0, total: 0 }],
    });
  }

  return (
    <div className='min-h-screen bg-background'>
      <AppHeader />
      <div className='mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8'>
        <Link href='/bills' className='text-sm text-muted hover:text-foreground'>&larr; Bills</Link>
        <h1 className='mt-2 text-2xl font-bold text-foreground'>Scan Receipt</h1>

        {!parsed ? (
          <div className='mt-8'>
            {/* Upload Area */}
            <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 sm:p-12'>
              {scanning ? (
                <div className='text-center'>
                  <div className='mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent' />
                  <p className='mt-4 text-lg font-medium text-foreground'>Scanning receipt...</p>
                  <p className='mt-1 text-sm text-muted'>Our AI is reading your receipt</p>
                </div>
              ) : preview ? (
                <div className='text-center'>
                  <img src={preview} alt='Receipt preview' className='mx-auto max-h-64 rounded-lg' />
                  <p className='mt-4 text-sm text-muted'>Processing...</p>
                </div>
              ) : (
                <div className='flex flex-col items-center'>
                  <svg className='h-16 w-16 text-muted' fill='none' viewBox='0 0 24 24' strokeWidth={1} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z' />
                    <path strokeLinecap='round' strokeLinejoin='round' d='M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z' />
                  </svg>
                  <p className='mt-4 text-lg font-medium text-foreground'>Add a receipt</p>
                  <p className='mt-1 text-sm text-muted'>JPG or PNG, up to 20MB</p>

                  <div className='mt-6 flex w-full flex-col gap-3 sm:max-w-md sm:flex-row'>
                    <button
                      type='button'
                      onClick={() => cameraInputRef.current?.click()}
                      className='btn-primary flex-1'
                    >
                      <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z' />
                        <path strokeLinecap='round' strokeLinejoin='round' d='M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z' />
                      </svg>
                      Take Photo
                    </button>
                    <button
                      type='button'
                      onClick={() => galleryInputRef.current?.click()}
                      className='btn-secondary flex-1'
                    >
                      <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z' />
                      </svg>
                      Choose from Gallery
                    </button>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={cameraInputRef}
              type='file'
              accept='image/*'
              capture='environment'
              onChange={handleFileSelect}
              className='hidden'
            />
            <input
              ref={galleryInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
            />

            <div className='mt-4 text-center'>
              <Link href='/bills/new' className='text-sm font-medium text-primary hover:underline'>
                Or enter bill details manually
              </Link>
            </div>
          </div>
        ) : (
          /* Review & Edit Parsed Data */
          <div className='mt-8 space-y-6'>
            <div className='rounded-xl border border-green-500/30 bg-green-500/5 p-4'>
              <p className='text-sm font-medium text-green-600'>Receipt scanned successfully! Review and edit the details below.</p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label className='block text-sm font-medium text-foreground'>Store Name</label>
                <input
                  type='text'
                  value={parsed.storeName}
                  onChange={(e) => updateField('storeName', e.target.value)}
                  className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground'>Date</label>
                <div className='mt-1 flex gap-2'>
                  <input
                    type='date'
                    value={parsed.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className='w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                  />
                  <button
                    type='button'
                    onClick={() => updateField('date', new Date().toISOString().slice(0, 10))}
                    className='whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10'
                  >
                    Today
                  </button>
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground'>Category</label>
                <select
                  value={parsed.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                >
                  {Object.values(EBillCategory).map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground'>ABN</label>
                <input
                  type='text'
                  value={parsed.storeABN || ''}
                  onChange={(e) => updateField('storeABN', e.target.value)}
                  className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                />
              </div>
              <div className='sm:col-span-2'>
                <label className='block text-sm font-medium text-foreground'>Store Address</label>
                <input
                  type='text'
                  value={parsed.storeAddress || ''}
                  onChange={(e) => updateField('storeAddress', e.target.value)}
                  className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-foreground'>Items</h3>
                <button onClick={addItem} className='text-sm font-medium text-primary hover:underline'>+ Add Item</button>
              </div>
              <div className='mt-3 space-y-2'>
                {parsed.items.map((item, i) => (
                  <div key={i} className='flex items-center gap-2 rounded-lg border border-border bg-card p-3'>
                    <input
                      type='text'
                      value={item.name}
                      onChange={(e) => updateItem(i, 'name', e.target.value)}
                      placeholder='Item name'
                      className='flex-1 bg-transparent text-sm text-foreground outline-none'
                    />
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
                      className='w-20 rounded border border-border bg-background px-2 py-1 text-sm text-foreground'
                      min='0'
                      step='0.01'
                    />
                    <span className='text-sm font-medium text-foreground'>= ${item.total.toFixed(2)}</span>
                    <button onClick={() => removeItem(i)} className='text-red-500 hover:text-red-600'>
                      <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' />
                      </svg>
                    </button>
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
                  value={parsed.subtotal}
                  onChange={(e) => updateField('subtotal', parseFloat(e.target.value) || 0)}
                  className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                  step='0.01'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground'>Tax</label>
                <input
                  type='number'
                  value={parsed.tax}
                  onChange={(e) => updateField('tax', parseFloat(e.target.value) || 0)}
                  className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
                  step='0.01'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground'>Total</label>
                <input
                  type='number'
                  value={parsed.total}
                  onChange={(e) => updateField('total', parseFloat(e.target.value) || 0)}
                  className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground font-bold'
                  step='0.01'
                />
              </div>
            </div>

            {/* Actions */}
            <div className='flex gap-3 pt-4'>
              <button
                onClick={handleSave}
                disabled={saving}
                className='btn-primary flex-1'
              >
                {saving ? 'Saving...' : 'Save Bill'}
              </button>
              <button
                onClick={() => { setParsed(null); setPreview(null); setScanKey(null); }}
                className='btn-ghost'
              >
                Rescan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

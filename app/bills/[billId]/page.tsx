'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from '@/components/AppHeader';
import { useConfirm } from '@/components/ConfirmDialog';
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

interface Attachment {
  key: string;
  filename: string;
  contentType: string;
  size?: number;
  url?: string;
}

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
  receiptImageUrl?: string;
  receiptImageKey?: string;
  tags: string[];
  warranty?: { expiryDate?: string; details?: string };
  attachments: Attachment[];
  entryMethod: string;
  createdAt: string;
}

export default function BillDetailPage() {
  useSession({ required: true });
  const router = useRouter();
  const params = useParams();
  const billId = params.billId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Bill>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');

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
    const ok = await confirm({
      title: 'Delete this bill?',
      message: 'This bill will be removed from your records. This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;

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

      const payload: Record<string, unknown> = { ...editData };
      if (editData.warranty) {
        payload.warranty = {
          expiryDate: editData.warranty.expiryDate || undefined,
          details: editData.warranty.details || undefined,
        };
      }

      const res = await fetch(`${apiUrl()}/api/bills/${billId}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Bill updated');
        setEditing(false);
        fetchBill();
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
      tags: [...(bill.tags || [])],
      warranty: bill.warranty ? {
        expiryDate: bill.warranty.expiryDate?.split('T')[0],
        details: bill.warranty.details,
      } : undefined,
    });
    setEditTagInput('');
    setEditing(true);
  }

  function addEditTag() {
    const tag = editTagInput.trim().toLowerCase();
    if (!tag || (editData.tags || []).includes(tag)) return;
    setEditData({ ...editData, tags: [...(editData.tags || []), tag] });
    setEditTagInput('');
  }

  function removeEditTag(tag: string) {
    setEditData({ ...editData, tags: (editData.tags || []).filter((t) => t !== tag) });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !bill) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    try {
      setUploading(true);
      const headers = await authHeaders();

      // 1. Get presigned upload URL
      const urlRes = await fetch(`${apiUrl()}/api/bills/${billId}/upload-url`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, filename: file.name }),
      });

      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { data: { uploadUrl, key } } = await urlRes.json();

      // 2. Upload file to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // 3. Register attachment on the bill
      const attachRes = await fetch(`${apiUrl()}/api/bills/${billId}/attachments`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, filename: file.name, contentType: file.type, size: file.size }),
      });

      if (!attachRes.ok) throw new Error('Failed to save attachment');

      toast.success('File attached!');
      fetchBill();
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveAttachment(key: string) {
    const ok = await confirm({
      title: 'Remove this attachment?',
      message: 'The file will be detached from this bill.',
      confirmText: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/bills/${billId}/attachments`, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        toast.success('Attachment removed');
        fetchBill();
      }
    } catch {
      toast.error('Failed to remove attachment');
    }
  }

  function isImage(contentType: string) {
    return contentType.startsWith('image/');
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      <AppHeader />
      <div className='mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8'>
        <Link href='/bills' className='text-sm text-muted hover:text-foreground'>&larr; All Bills</Link>

        <div className='mt-4 flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>{bill.storeName}</h1>
            <div className='mt-1 flex flex-wrap items-center gap-2'>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_BADGE[bill.category] || CATEGORY_BADGE.other}`}>
                {CATEGORY_LABELS[bill.category] || bill.category}
              </span>
              <span className='text-sm text-muted'>
                {new Date(bill.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className='text-xs text-muted capitalize'>({bill.entryMethod})</span>
            </div>
            {/* Tags */}
            {bill.tags?.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-1'>
                {bill.tags.map((tag) => (
                  <span key={tag} className='rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'>{tag}</span>
                ))}
              </div>
            )}
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
              <div>
                <label className='block text-sm font-medium text-foreground'>Notes</label>
                <input type='text' value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className='mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground' />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground'>Payment Method</label>
                <input type='text' value={editData.paymentMethod || ''} onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })} className='mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground' />
              </div>
            </div>

            {/* Tags editing */}
            <div>
              <label className='block text-sm font-medium text-foreground'>Tags</label>
              <div className='mt-1 flex flex-wrap gap-1'>
                {(editData.tags || []).map((tag) => (
                  <span key={tag} className='flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'>
                    {tag}
                    <button onClick={() => removeEditTag(tag)} className='hover:text-red-500'>
                      <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' /></svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className='mt-2 flex gap-2'>
                <input
                  type='text'
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEditTag(); } }}
                  placeholder='Add tag...'
                  className='flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground'
                />
                <button type='button' onClick={addEditTag} className='rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20'>Add</button>
              </div>
            </div>

            {/* Warranty editing */}
            <div>
              <label className='block text-sm font-medium text-foreground'>Warranty</label>
              <div className='mt-1 grid gap-3 sm:grid-cols-2'>
                <div>
                  <label className='block text-xs text-muted'>Expiry Date</label>
                  <input
                    type='date'
                    value={editData.warranty?.expiryDate || ''}
                    onChange={(e) => setEditData({ ...editData, warranty: { ...editData.warranty, expiryDate: e.target.value } })}
                    className='mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                  />
                </div>
                <div>
                  <label className='block text-xs text-muted'>Details</label>
                  <input
                    type='text'
                    value={editData.warranty?.details || ''}
                    onChange={(e) => setEditData({ ...editData, warranty: { ...editData.warranty, details: e.target.value } })}
                    placeholder='e.g. 2 year manufacturer warranty'
                    className='mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                  />
                </div>
              </div>
            </div>

            <div className='flex gap-3'>
              <button onClick={handleSave} disabled={saving} className='btn-primary'>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} className='btn-ghost'>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Warranty */}
            {bill.warranty && (bill.warranty.expiryDate || bill.warranty.details) && (
              <div className='mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4'>
                <div className='flex items-center gap-2'>
                  <svg className='h-5 w-5 text-amber-600' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z' />
                  </svg>
                  <h3 className='text-sm font-semibold text-amber-700 dark:text-amber-400'>Warranty</h3>
                </div>
                {bill.warranty.expiryDate && (
                  <p className='mt-1 text-sm text-foreground'>
                    Expires: {new Date(bill.warranty.expiryDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {new Date(bill.warranty.expiryDate) < new Date() && (
                      <span className='ml-2 text-xs text-red-500'>(Expired)</span>
                    )}
                  </p>
                )}
                {bill.warranty.details && <p className='mt-1 text-sm text-muted'>{bill.warranty.details}</p>}
              </div>
            )}

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

            {/* Receipt Image */}
            {bill.receiptImageUrl && (
              <div className='mt-6 rounded-xl border border-border bg-card'>
                <div className='border-b border-border p-4'>
                  <h3 className='font-semibold text-foreground'>Receipt</h3>
                </div>
                <div className='p-4'>
                  <a href={bill.receiptImageUrl} target='_blank' rel='noopener noreferrer'>
                    <img
                      src={bill.receiptImageUrl}
                      alt='Receipt'
                      className='max-h-96 rounded-lg border border-border object-contain'
                    />
                  </a>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className='mt-6 rounded-xl border border-border bg-card'>
              <div className='flex items-center justify-between border-b border-border p-4'>
                <h3 className='font-semibold text-foreground'>Attachments ({bill.attachments?.length || 0})</h3>
                <label className={`cursor-pointer rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                  {uploading ? 'Uploading...' : '+ Attach File'}
                  <input
                    ref={fileInputRef}
                    type='file'
                    onChange={handleFileUpload}
                    className='hidden'
                    accept='image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx'
                  />
                </label>
              </div>
              {bill.attachments?.length > 0 ? (
                <div className='divide-y divide-border'>
                  {bill.attachments.map((att) => (
                    <div key={att.key} className='p-4'>
                      {isImage(att.contentType) && att.url ? (
                        <a href={att.url} target='_blank' rel='noopener noreferrer'>
                          <img
                            src={att.url}
                            alt={att.filename}
                            className='mb-2 max-h-48 rounded-lg border border-border object-contain'
                          />
                        </a>
                      ) : null}
                      <div className='flex items-center justify-between'>
                        <div className='min-w-0'>
                          <a
                            href={att.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='truncate text-sm font-medium text-primary hover:underline'
                          >
                            {att.filename}
                          </a>
                          {att.size && <span className='ml-2 text-xs text-muted'>{formatFileSize(att.size)}</span>}
                        </div>
                        <button
                          onClick={() => handleRemoveAttachment(att.key)}
                          className='ml-2 shrink-0 text-red-500 hover:text-red-600'
                          title='Remove attachment'
                        >
                          <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' d='m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0' />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-8 text-center'>
                  <p className='text-sm text-muted'>No attachments yet</p>
                  <p className='mt-1 text-xs text-muted'>Attach invoices, receipts, or other files</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppHeader } from '@/components/AppHeader';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiUrl, authHeaders } from '@/lib/api';
import {
  EBillCategory,
  ECadence,
  ERecurringChannel,
  ERecurringStatus,
} from '@backend/shared/types';

const CATEGORY_LABELS: Record<string, string> = {
  grocery: 'Grocery', electronics: 'Electronics', telephone: 'Telephone', dining: 'Dining',
  transport: 'Transport', health: 'Health', utilities: 'Utilities', entertainment: 'Entertainment',
  clothing: 'Clothing', other: 'Other',
};

const CADENCE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  custom: 'Custom',
};

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  app: 'App',
  direct_debit: 'Direct debit',
  manual: 'Manual',
};

interface RecurringBill {
  _id: string;
  name: string;
  category: string;
  amount: number;
  cadence: string;
  intervalDays?: number;
  nextDueDate: string;
  endDate?: string;
  lastPaidDate?: string;
  reminderDaysBefore: number;
  channel: string;
  notes?: string;
  status: string;
  autoDetected: boolean;
}

interface ForecastItem {
  recurringBillId: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  channel: string;
}

interface Suggestion {
  name: string;
  category: string;
  amount: number;
  cadence: string;
  intervalDays?: number;
  nextDueDate: string;
  occurrences: number;
  confidence: 'high' | 'medium' | 'low';
}

const todayInput = () => new Date().toISOString().split('T')[0];

const blankForm = () => ({
  name: '',
  category: EBillCategory.UTILITIES as string,
  amount: '',
  cadence: ECadence.MONTHLY as string,
  intervalDays: '30',
  nextDueDate: todayInput(),
  hasEndDate: false,
  endDate: '',
  reminderDaysBefore: '3',
  channel: ERecurringChannel.MANUAL as string,
  notes: '',
});

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formToFromItem(item: RecurringBill) {
  return {
    name: item.name,
    category: item.category,
    amount: item.amount.toString(),
    cadence: item.cadence,
    intervalDays: (item.intervalDays ?? 30).toString(),
    nextDueDate: new Date(item.nextDueDate).toISOString().split('T')[0],
    hasEndDate: Boolean(item.endDate),
    endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
    reminderDaysBefore: item.reminderDaysBefore.toString(),
    channel: item.channel,
    notes: item.notes ?? '',
  };
}

export default function RecurringBillsPage() {
  const { status } = useSession();
  const confirm = useConfirm();
  const [items, setItems] = useState<RecurringBill[]>([]);
  const [forecast, setForecast] = useState<{ occurrences: ForecastItem[]; totalUpcoming: number } | null>(null);
  const [suggestionsList, setSuggestionsList] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await authHeaders();
      const [listRes, forecastRes, suggestionsRes] = await Promise.all([
        fetch(`${apiUrl()}/api/recurring`, { headers }),
        fetch(`${apiUrl()}/api/recurring/forecast?days=60`, { headers }),
        fetch(`${apiUrl()}/api/recurring/suggestions`, { headers }),
      ]);

      if (listRes.ok) {
        const data = await listRes.json();
        setItems(data.data?.items || []);
      }
      if (forecastRes.ok) {
        const data = await forecastRes.json();
        setForecast(data.data);
      }
      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setSuggestionsList(data.data?.suggestions || []);
      }
    } catch {
      toast.error('Failed to load recurring bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchAll();
  }, [status, fetchAll]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    const amountNum = parseFloat(form.amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    if (form.hasEndDate && !form.endDate) {
      toast.error('Pick an end date or untick "Set an end date"');
      return;
    }
    if (form.hasEndDate && new Date(form.endDate) < new Date(form.nextDueDate)) {
      toast.error('End date must be on or after the first due date');
      return;
    }
    setSaving(true);
    try {
      const headers = await authHeaders();
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        category: form.category,
        amount: amountNum,
        cadence: form.cadence,
        nextDueDate: new Date(form.nextDueDate).toISOString(),
        reminderDaysBefore: parseInt(form.reminderDaysBefore, 10) || 3,
        channel: form.channel,
        notes: form.notes || undefined,
      };
      if (form.cadence === ECadence.CUSTOM) {
        body.intervalDays = parseInt(form.intervalDays, 10) || 30;
      }
      // null on edit clears endDate; undefined on create just skips the field.
      if (form.hasEndDate && form.endDate) {
        body.endDate = new Date(form.endDate).toISOString();
      } else if (editingId) {
        body.endDate = null;
      }
      const isEdit = Boolean(editingId);
      const res = await fetch(
        `${apiUrl()}/api/recurring${isEdit ? `/${editingId}` : ''}`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers,
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        toast.error(isEdit ? 'Failed to save changes' : 'Failed to add recurring bill');
        return;
      }
      toast.success(isEdit ? 'Recurring bill updated' : 'Recurring bill added');
      closeForm();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(blankForm());
    setShowForm(true);
  }

  function openEditForm(item: RecurringBill) {
    setEditingId(item._id);
    setForm(formToFromItem(item));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(blankForm());
  }

  async function handleAcceptSuggestion(s: Suggestion) {
    try {
      const headers = await authHeaders();
      const body: Record<string, unknown> = {
        name: s.name,
        category: s.category,
        amount: s.amount,
        cadence: s.cadence,
        nextDueDate: s.nextDueDate,
        channel: ERecurringChannel.MANUAL,
        reminderDaysBefore: 3,
      };
      if (s.intervalDays) body.intervalDays = s.intervalDays;
      const res = await fetch(`${apiUrl()}/api/recurring`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error('Failed to add suggestion');
        return;
      }
      toast.success(`Tracking "${s.name}"`);
      fetchAll();
    } catch {
      toast.error('Failed to add suggestion');
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/recurring/${id}/mark-paid`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        toast.error('Failed to mark paid');
        return;
      }
      toast.success('Skipped to next cycle');
      fetchAll();
    } catch {
      toast.error('Failed to mark paid');
    }
  }

  async function handleStatus(id: string, newStatus: string) {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/recurring/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast.error('Failed to update');
        return;
      }
      fetchAll();
    } catch {
      toast.error('Failed to update');
    }
  }

  async function handleDelete(item: RecurringBill) {
    const ok = await confirm({
      title: `Delete "${item.name}"?`,
      message:
        'The schedule will be removed. Bills already auto-generated for past cycles stay in your records — only the future schedule goes away.',
      confirmText: 'Delete schedule',
      danger: true,
    });
    if (!ok) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/recurring/${item._id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        toast.error('Failed to delete');
        return;
      }
      toast.success('Deleted');
      if (editingId === item._id) closeForm();
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function handleDismissSuggestion(s: Suggestion) {
    const ok = await confirm({
      title: `Hide "${s.name}" suggestion?`,
      message: `We won't suggest this again. You can restore all dismissed suggestions any time.`,
      confirmText: 'Hide suggestion',
    });
    if (!ok) return;
    // Optimistic remove from the visible list.
    setSuggestionsList((prev) => prev.filter((x) => x.name !== s.name));
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/recurring/suggestions/dismiss`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: s.name }),
      });
      if (!res.ok) {
        toast.error('Failed to dismiss');
        fetchAll();
        return;
      }
      toast.success('Hidden');
    } catch {
      toast.error('Failed to dismiss');
      fetchAll();
    }
  }

  async function handleRestoreSuggestions() {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/recurring/suggestions/restore`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        toast.error('Failed to restore');
        return;
      }
      toast.success('Restored all dismissed suggestions');
      fetchAll();
    } catch {
      toast.error('Failed to restore');
    }
  }

  async function handleSync() {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/recurring/sync`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        toast.error('Failed to sync');
        return;
      }
      const data = await res.json();
      const billsGenerated = data.data?.billsGenerated ?? 0;
      const remindersCreated = data.data?.remindersCreated ?? 0;
      if (billsGenerated || remindersCreated) {
        toast.success(
          `Synced · ${billsGenerated} bill(s) added, ${remindersCreated} reminder(s) sent`
        );
      } else {
        toast.success('Already up to date');
      }
      fetchAll();
    } catch {
      toast.error('Failed to sync');
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <AppHeader />
      <div className='mx-auto max-w-5xl px-4 py-8 pb-24 md:pb-8'>
        <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Recurring bills</h1>
            <p className='text-sm text-muted'>
              Add a schedule once — we&apos;ll add each instance to your monthly bills automatically and remind you before it&apos;s due.
            </p>
          </div>
          <div className='flex gap-2'>
            <button onClick={handleSync} className='btn-ghost' type='button'>
              Sync now
            </button>
            <button
              onClick={() => (showForm ? closeForm() : openCreateForm())}
              className='btn-primary'
              type='button'
            >
              {showForm ? 'Close' : 'Add recurring bill'}
            </button>
          </div>
        </div>

        {/* Forecast banner */}
        {forecast && forecast.occurrences.length > 0 && (
          <div className='mb-6 rounded-2xl border border-border bg-card p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted'>Next 60 days · expected total</p>
                <p className='mt-1 text-3xl font-bold text-foreground'>
                  ${forecast.totalUpcoming.toFixed(2)}
                </p>
              </div>
              <div className='text-right text-sm text-muted'>
                {forecast.occurrences.length} bill{forecast.occurrences.length === 1 ? '' : 's'}
              </div>
            </div>
            <div className='mt-4 flex flex-wrap gap-2'>
              {forecast.occurrences.slice(0, 12).map((o, i) => {
                const due = daysUntil(o.dueDate);
                return (
                  <div
                    key={`${o.recurringBillId}-${i}`}
                    className='rounded-lg border border-border bg-secondary px-3 py-2 text-xs'
                  >
                    <div className='font-medium text-foreground'>{o.name}</div>
                    <div className='text-muted'>
                      {due <= 0 ? 'Today' : `in ${due}d`} · ${o.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
              {forecast.occurrences.length > 12 && (
                <div className='self-center text-xs text-muted'>
                  +{forecast.occurrences.length - 12} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add / edit form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className='mb-6 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2'
          >
            <div className='sm:col-span-2'>
              <h3 className='text-lg font-semibold text-foreground'>
                {editingId ? `Edit "${form.name || 'recurring bill'}"` : 'Add a recurring bill'}
              </h3>
              <p className='mt-1 text-xs text-muted'>
                {editingId
                  ? 'Update any field — the next sync picks up your changes.'
                  : 'Enter the schedule once; we auto-add each instance to your bills.'}
              </p>
            </div>
            <label className='flex flex-col gap-1 sm:col-span-2'>
              <span className='text-xs font-medium text-muted'>Name</span>
              <input
                className='input-base'
                placeholder='e.g. Origin Energy, Netflix'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-muted'>Category</span>
              <select
                className='input-base'
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.values(EBillCategory).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </label>
            <label className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-muted'>Amount (estimated)</span>
              <input
                type='number'
                step='0.01'
                className='input-base'
                placeholder='0.00'
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </label>
            <label className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-muted'>Cadence</span>
              <select
                className='input-base'
                value={form.cadence}
                onChange={(e) => setForm({ ...form, cadence: e.target.value })}
              >
                {Object.values(ECadence).map((c) => (
                  <option key={c} value={c}>{CADENCE_LABELS[c]}</option>
                ))}
              </select>
            </label>
            {form.cadence === ECadence.CUSTOM && (
              <label className='flex flex-col gap-1'>
                <span className='text-xs font-medium text-muted'>Interval (days)</span>
                <input
                  type='number'
                  min='1'
                  className='input-base'
                  value={form.intervalDays}
                  onChange={(e) => setForm({ ...form, intervalDays: e.target.value })}
                />
              </label>
            )}
            <label className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-muted'>Next due date</span>
              <input
                type='date'
                className='input-base'
                value={form.nextDueDate}
                onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
              />
            </label>
            <div className='flex flex-col gap-1 sm:col-span-2'>
              <label className='flex items-center gap-2 text-xs font-medium text-muted'>
                <input
                  type='checkbox'
                  checked={form.hasEndDate}
                  onChange={(e) => setForm({ ...form, hasEndDate: e.target.checked })}
                />
                Set an end date (otherwise it recurs until you stop it)
              </label>
              {form.hasEndDate && (
                <input
                  type='date'
                  className='input-base'
                  value={form.endDate}
                  min={form.nextDueDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              )}
            </div>
            <label className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-muted'>Remind me (days before)</span>
              <input
                type='number'
                min='0'
                max='60'
                className='input-base'
                value={form.reminderDaysBefore}
                onChange={(e) => setForm({ ...form, reminderDaysBefore: e.target.value })}
              />
            </label>
            <label className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-muted'>Bill arrives via</span>
              <select
                className='input-base'
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                {Object.values(ERecurringChannel).map((c) => (
                  <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
                ))}
              </select>
            </label>
            <label className='flex flex-col gap-1 sm:col-span-2'>
              <span className='text-xs font-medium text-muted'>Notes</span>
              <input
                className='input-base'
                placeholder='Optional'
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            <div className='flex justify-end gap-2 sm:col-span-2'>
              <button type='button' className='btn-ghost' onClick={closeForm}>
                Cancel
              </button>
              <button type='submit' disabled={saving} className='btn-primary'>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {/* Suggestions */}
        {suggestionsList.length > 0 && (
          <div className='mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6'>
            <div className='mb-3 flex flex-wrap items-start justify-between gap-3'>
              <div>
                <h2 className='text-lg font-semibold text-foreground'>Detected from your bills</h2>
                <p className='text-sm text-muted'>
                  We spotted these patterns in receipts you&apos;ve already scanned. Add them in one click — or hide ones you don&apos;t want to track.
                </p>
              </div>
              <button
                type='button'
                onClick={handleRestoreSuggestions}
                className='text-xs font-medium text-primary hover:underline'
              >
                Restore hidden
              </button>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              {suggestionsList.map((s, i) => (
                <div
                  key={`${s.name}-${i}`}
                  className='flex flex-col gap-3 rounded-xl border border-border bg-card p-4'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <p className='truncate font-semibold text-foreground'>{s.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            s.confidence === 'high'
                              ? 'bg-green-500/10 text-green-600'
                              : s.confidence === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-gray-500/10 text-gray-600'
                          }`}
                        >
                          {s.confidence}
                        </span>
                      </div>
                      <p className='mt-1 text-xs text-muted'>
                        {CADENCE_LABELS[s.cadence]} · ~${s.amount.toFixed(2)} · {s.occurrences} past bills
                      </p>
                      <p className='text-xs text-muted'>Next expected: {formatDate(s.nextDueDate)}</p>
                    </div>
                  </div>
                  <div className='flex items-center justify-end gap-2'>
                    <button
                      type='button'
                      onClick={() => handleDismissSuggestion(s)}
                      className='rounded-full px-3 py-1.5 text-sm text-muted hover:bg-secondary hover:text-foreground'
                      aria-label={`Hide ${s.name} suggestion`}
                    >
                      Hide
                    </button>
                    <button
                      type='button'
                      onClick={() => handleAcceptSuggestion(s)}
                      className='btn-primary'
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active list */}
        <div>
          <h2 className='mb-3 text-lg font-semibold text-foreground'>Your recurring bills</h2>
          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
            </div>
          ) : items.length === 0 ? (
            <div className='rounded-xl border border-dashed border-border py-12 text-center'>
              <p className='text-muted'>No recurring bills tracked yet.</p>
              <p className='mt-1 text-sm text-muted'>
                Add one manually, or accept a detected suggestion above.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {items.map((item) => {
                const due = daysUntil(item.nextDueDate);
                const overdue = due < 0;
                const dueSoon = due >= 0 && due <= item.reminderDaysBefore;
                return (
                  <div
                    key={item._id}
                    className={`rounded-xl border p-4 ${
                      item.status !== ERecurringStatus.ACTIVE
                        ? 'border-border bg-secondary/40 opacity-70'
                        : overdue
                        ? 'border-red-500/40 bg-red-500/5'
                        : dueSoon
                        ? 'border-yellow-500/40 bg-yellow-500/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='font-semibold text-foreground'>{item.name}</p>
                          <span className='rounded-full bg-secondary px-2 py-0.5 text-xs text-muted'>
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                          <span className='rounded-full bg-secondary px-2 py-0.5 text-xs text-muted'>
                            {CADENCE_LABELS[item.cadence]}
                            {item.cadence === 'custom' && item.intervalDays
                              ? ` (${item.intervalDays}d)`
                              : ''}
                          </span>
                          {item.status !== ERecurringStatus.ACTIVE && (
                            <span className='rounded-full bg-secondary px-2 py-0.5 text-xs uppercase text-muted'>
                              {item.status}
                            </span>
                          )}
                        </div>
                        <p className='mt-1 text-sm text-muted'>
                          {item.status === ERecurringStatus.COMPLETED
                            ? `Completed${item.endDate ? ` on ${formatDate(item.endDate)}` : ''}`
                            : <>Next: {formatDate(item.nextDueDate)} ·{' '}
                              {overdue
                                ? `${Math.abs(due)}d overdue`
                                : due === 0
                                ? 'today'
                                : `in ${due}d`}</>}
                          {' · '}
                          via {CHANNEL_LABELS[item.channel] || item.channel}
                          {item.endDate ? ` · ends ${formatDate(item.endDate)}` : ''}
                          {item.lastPaidDate ? ` · last paid ${formatDate(item.lastPaidDate)}` : ''}
                        </p>
                        {item.notes && (
                          <p className='mt-1 text-xs text-muted'>{item.notes}</p>
                        )}
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-bold text-foreground'>
                          ${item.amount.toFixed(2)}
                        </p>
                        <p className='text-xs text-muted'>
                          remind {item.reminderDaysBefore}d before
                        </p>
                      </div>
                    </div>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {item.status === ERecurringStatus.ACTIVE && (
                        <button
                          type='button'
                          onClick={() => handleMarkPaid(item._id)}
                          className='btn-secondary'
                          title='Already paid this cycle elsewhere — skip to the next due date'
                        >
                          Skip to next cycle
                        </button>
                      )}
                      {item.status !== ERecurringStatus.COMPLETED && (
                        <button
                          type='button'
                          onClick={() => openEditForm(item)}
                          className='btn-ghost'
                        >
                          Edit
                        </button>
                      )}
                      {item.status === ERecurringStatus.ACTIVE && (
                        <button
                          type='button'
                          onClick={() => handleStatus(item._id, ERecurringStatus.PAUSED)}
                          className='btn-ghost'
                        >
                          Pause
                        </button>
                      )}
                      {item.status === ERecurringStatus.PAUSED && (
                        <button
                          type='button'
                          onClick={() => handleStatus(item._id, ERecurringStatus.ACTIVE)}
                          className='btn-ghost'
                        >
                          Resume
                        </button>
                      )}
                      <button
                        type='button'
                        onClick={() => handleDelete(item)}
                        className='ml-auto rounded-full px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className='mt-8 text-center text-xs text-muted'>
          Want a one-off bill instead? <Link href='/bills/new' className='text-primary hover:underline'>Add a bill manually</Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiUrl } from '@/lib/api';
import { EBillCategory, ESplitType } from '@backend/shared/types';

const CATEGORY_LABELS: Record<string, string> = {
  grocery: 'Grocery', electronics: 'Electronics', telephone: 'Telephone', dining: 'Dining',
  transport: 'Transport', health: 'Health', utilities: 'Utilities', entertainment: 'Entertainment',
  clothing: 'Clothing', other: 'Other',
};

interface EventMember {
  userId?: string;
  email: string;
  name: string;
  status: string;
}

interface Event {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: EventMember[];
  status: string;
}

interface ExpenseSplit {
  userId: string;
  amount: number;
  settled: boolean;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: string;
  splits: ExpenseSplit[];
  category: string;
  date: string;
}

interface Balance {
  from: { userId: string; name: string };
  to: { userId: string; name: string };
  amount: number;
}

export default function EventDetailPage() {
  const { data: session, status } = useSession({ required: true });
  const params = useParams();
  const eventId = params.eventId as string;
  const confirm = useConfirm();

  const [event, setEvent] = useState<Event | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);

  // Add expense form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState(EBillCategory.OTHER);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expSplitType, setExpSplitType] = useState<ESplitType>(ESplitType.EQUAL);
  const [expParticipants, setExpParticipants] = useState<Record<string, boolean>>({});
  const [expSplitInputs, setExpSplitInputs] = useState<Record<string, string>>({});
  const [addingExpense, setAddingExpense] = useState(false);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  function getHeaders() {
    const accessToken = (session as unknown as { accessToken?: string })?.accessToken || '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
  }

  useEffect(() => {
    if (status === 'authenticated') fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, eventId]);

  async function fetchAll() {
    try {
      setLoading(true);
      const headers = getHeaders();

      const [eventRes, balanceRes] = await Promise.all([
        fetch(`${apiUrl()}/api/events/${eventId}`, { headers }),
        fetch(`${apiUrl()}/api/events/${eventId}/balances`, { headers }),
      ]);

      if (eventRes.ok) {
        const data = await eventRes.json();
        setEvent(data.data.event);
        setExpenses(data.data.expenses || []);
      }

      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setBalances(data.data || []);
      }
    } catch {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  }

  function openAddExpense() {
    if (!event) return;
    // Default: everyone with a userId is a participant
    const participants: Record<string, boolean> = {};
    const inputs: Record<string, string> = {};
    for (const m of event.members) {
      if (m.userId) {
        participants[m.userId] = true;
        inputs[m.userId] = '';
      }
    }
    setExpParticipants(participants);
    setExpSplitInputs(inputs);
    setExpSplitType(ESplitType.EQUAL);
    setShowAddExpense(true);
  }

  function toggleParticipant(userId: string) {
    setExpParticipants((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }

  function setSplitInput(userId: string, value: string) {
    setExpSplitInputs((prev) => ({ ...prev, [userId]: value }));
  }

  // Compute per-member amounts based on split type + inputs
  function computeSplits(): { userId: string; amount: number }[] {
    if (!event) return [];
    const amount = parseFloat(expAmount) || 0;
    const selected = event.members.filter((m) => m.userId && expParticipants[m.userId]);
    if (selected.length === 0 || amount <= 0) return [];

    if (expSplitType === ESplitType.EQUAL) {
      const per = amount / selected.length;
      const rounded = selected.map((m) => ({
        userId: m.userId!,
        amount: Math.round(per * 100) / 100,
      }));
      // Fix rounding drift on the last entry
      const sum = rounded.reduce((s, x) => s + x.amount, 0);
      const drift = Math.round((amount - sum) * 100) / 100;
      if (rounded.length > 0 && drift !== 0) {
        rounded[rounded.length - 1].amount = Math.round((rounded[rounded.length - 1].amount + drift) * 100) / 100;
      }
      return rounded;
    }

    if (expSplitType === ESplitType.PERCENTAGE) {
      return selected.map((m) => {
        const pct = parseFloat(expSplitInputs[m.userId!] || '0') || 0;
        return { userId: m.userId!, amount: Math.round(amount * (pct / 100) * 100) / 100 };
      });
    }

    if (expSplitType === ESplitType.SHARES) {
      const shares = selected.map((m) => ({
        userId: m.userId!,
        share: parseFloat(expSplitInputs[m.userId!] || '0') || 0,
      }));
      const totalShares = shares.reduce((s, x) => s + x.share, 0);
      if (totalShares <= 0) return selected.map((m) => ({ userId: m.userId!, amount: 0 }));
      return shares.map((s) => ({
        userId: s.userId,
        amount: Math.round(amount * (s.share / totalShares) * 100) / 100,
      }));
    }

    // CUSTOM — user types amount directly
    return selected.map((m) => ({
      userId: m.userId!,
      amount: Math.round((parseFloat(expSplitInputs[m.userId!] || '0') || 0) * 100) / 100,
    }));
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !session?.user) return;

    const amount = parseFloat(expAmount);
    if (!expDesc.trim() || !amount || amount <= 0) {
      toast.error('Please fill in description and amount');
      return;
    }

    const splits = computeSplits();
    if (splits.length === 0) {
      toast.error('Select at least one participant');
      return;
    }

    const splitSum = Math.round(splits.reduce((s, x) => s + x.amount, 0) * 100) / 100;

    if (expSplitType === ESplitType.PERCENTAGE) {
      const pctSum = Object.entries(expSplitInputs).reduce((s, [uid, val]) => {
        return expParticipants[uid] ? s + (parseFloat(val) || 0) : s;
      }, 0);
      if (Math.abs(pctSum - 100) > 0.01) {
        toast.error(`Percentages must total 100% (current: ${pctSum.toFixed(2)}%)`);
        return;
      }
    } else if (expSplitType === ESplitType.CUSTOM) {
      if (Math.abs(splitSum - amount) > 0.01) {
        toast.error(`Split amounts must total $${amount.toFixed(2)} (current: $${splitSum.toFixed(2)})`);
        return;
      }
    } else if (expSplitType === ESplitType.SHARES) {
      const totalShares = Object.entries(expSplitInputs).reduce((s, [uid, val]) => {
        return expParticipants[uid] ? s + (parseFloat(val) || 0) : s;
      }, 0);
      if (totalShares <= 0) {
        toast.error('Enter shares for at least one participant');
        return;
      }
    }

    try {
      setAddingExpense(true);
      const headers = getHeaders();

      const currentUserId = (session as unknown as { user: { id: string } }).user?.id ||
        event.members.find((m) => m.email === session.user?.email)?.userId;

      const res = await fetch(`${apiUrl()}/api/events/${eventId}/expenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description: expDesc.trim(),
          amount,
          paidBy: currentUserId,
          splitType: expSplitType,
          splits,
          category: expCategory,
          date: expDate,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Expense added!');
      setShowAddExpense(false);
      setExpDesc('');
      setExpAmount('');
      setExpSplitInputs({});
      fetchAll();
    } catch {
      toast.error('Failed to add expense');
    } finally {
      setAddingExpense(false);
    }
  }

  async function ensureInviteLink(): Promise<string | null> {
    if (inviteLink) return inviteLink;
    try {
      setGeneratingLink(true);
      const headers = getHeaders();
      const res = await fetch(`${apiUrl()}/api/events/${eventId}/invite-link`, {
        method: 'POST',
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setInviteLink(json.data.inviteUrl);
      return json.data.inviteUrl as string;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate invite link');
      return null;
    } finally {
      setGeneratingLink(false);
    }
  }

  async function handleCopyLink() {
    const url = await ensureInviteLink();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Invite link copied!');
    } catch {
      // Fallback: show the URL so user can manually copy
      toast(url, { duration: 6000 });
    }
  }

  async function handleShareWhatsApp() {
    const url = await ensureInviteLink();
    if (!url || !event) return;
    const inviterName = session?.user?.name || 'A friend';
    const message = `Hey! ${inviterName} invited you to join "${event.name}" on BillGenics to split expenses together.\n\nJoin here: ${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      const headers = getHeaders();

      const res = await fetch(`${apiUrl()}/api/events/${eventId}/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      toast.success('Invitation sent!');
      setShowInvite(false);
      setInviteEmail('');
      fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleToggleStatus() {
    if (!event) return;
    const isActive = event.status === 'active';
    const next = isActive ? 'closed' : 'active';
    if (isActive) {
      const ok = await confirm({
        title: 'Close this event?',
        message: 'Members will no longer be able to add expenses unless you reopen it.',
        confirmText: 'Close event',
      });
      if (!ok) return;
    }
    try {
      const headers = getHeaders();
      const res = await fetch(`${apiUrl()}/api/events/${eventId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed');
      }
      toast.success(next === 'closed' ? 'Event closed' : 'Event reopened');
      fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update event');
    }
  }

  async function handleSettle(balance: Balance) {
    try {
      const headers = getHeaders();
      const res = await fetch(`${apiUrl()}/api/events/${eventId}/settle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ toUserId: balance.to.userId, amount: balance.amount }),
      });

      if (!res.ok) throw new Error();

      toast.success('Settlement recorded!');
      fetchAll();
    } catch {
      toast.error('Failed to settle');
    }
  }

  function getMemberName(userId: string): string {
    return event?.members.find((m) => m.userId === userId)?.name || 'Unknown';
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
      </div>
    );
  }

  if (!event) return null;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentUserId = (session as unknown as { user?: { id?: string } })?.user?.id;
  const isCreator = !!currentUserId && currentUserId === event.createdBy;
  const isClosed = event.status !== 'active';

  return (
    <div className='min-h-screen bg-background'>
      <AppHeader />
      <div className='mx-auto max-w-4xl px-4 py-8 pb-24 md:pb-8'>
        <Link href='/events' className='text-sm text-muted hover:text-foreground'>&larr; Events</Link>

        {/* Event Header */}
        <div className='mt-4 flex items-start justify-between'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold text-foreground'>{event.name}</h1>
              {isClosed && (
                <span className='rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-600'>
                  Closed
                </span>
              )}
            </div>
            {event.description && <p className='mt-1 text-muted'>{event.description}</p>}
            <p className='mt-1 text-sm text-muted'>
              Total expenses: <span className='font-semibold text-foreground'>${totalExpenses.toFixed(2)}</span>
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {isCreator && (
              <button onClick={handleToggleStatus} className='btn-ghost'>
                {isClosed ? 'Reopen' : 'Close event'}
              </button>
            )}
            <button
              onClick={() => setShowInvite(!showInvite)}
              className='btn-ghost'
            >
              Invite
            </button>
            <button
              onClick={() => (showAddExpense ? setShowAddExpense(false) : openAddExpense())}
              className='btn-primary'
              disabled={isClosed}
            >
              Add Expense
            </button>
          </div>
        </div>

        {/* Invite Panel */}
        {showInvite && (
          <div className='mt-4 space-y-4 rounded-2xl border border-border bg-card p-5'>
            <div>
              <label className='text-xs font-semibold uppercase tracking-wider text-muted'>
                Share a link
              </label>
              <p className='mt-1 text-xs text-muted'>
                Anyone with the link can join this group after signing in to BillGenics.
              </p>
              <div className='mt-3 flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={handleCopyLink}
                  disabled={generatingLink}
                  className='btn-ghost'
                >
                  <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' strokeWidth={1.8} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' />
                  </svg>
                  {generatingLink ? 'Generating...' : 'Copy invite link'}
                </button>
                <button
                  type='button'
                  onClick={handleShareWhatsApp}
                  disabled={generatingLink}
                  className='inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(37,211,102,0.55)] transition-all hover:bg-[#1ebe5d] hover:shadow-[0_18px_40px_-10px_rgba(37,211,102,0.65)] disabled:opacity-50'
                >
                  <svg className='h-4 w-4' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.149-.669.15-.198.297-.768.967-.941 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z' />
                  </svg>
                  Share via WhatsApp
                </button>
              </div>
              {inviteLink && (
                <div className='mt-3 overflow-hidden rounded-lg border border-border bg-background p-3'>
                  <code className='block truncate text-xs text-muted'>{inviteLink}</code>
                </div>
              )}
            </div>

            <div className='border-t border-border pt-4'>
              <label className='text-xs font-semibold uppercase tracking-wider text-muted'>
                Or invite by email
              </label>
              <p className='mt-1 text-xs text-muted'>
                We&apos;ll send them an email with an invitation link.
              </p>
              <form onSubmit={handleInvite} className='mt-3 flex flex-col gap-2 sm:flex-row'>
                <input
                  type='email'
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder='friend@example.com'
                  className='flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                  required
                />
                <button type='submit' disabled={inviting} className='btn-primary'>
                  {inviting ? 'Sending...' : 'Send Email Invite'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Expense Form */}
        {showAddExpense && event && (() => {
          const amount = parseFloat(expAmount) || 0;
          const selectedMembers = event.members.filter((m) => m.userId && expParticipants[m.userId]);
          const computed = computeSplits();
          const computedMap = Object.fromEntries(computed.map((s) => [s.userId, s.amount]));
          const splitSum = Math.round(computed.reduce((s, x) => s + x.amount, 0) * 100) / 100;
          const pctSum = Object.entries(expSplitInputs).reduce(
            (s, [uid, val]) => (expParticipants[uid] ? s + (parseFloat(val) || 0) : s),
            0
          );
          const totalShares = Object.entries(expSplitInputs).reduce(
            (s, [uid, val]) => (expParticipants[uid] ? s + (parseFloat(val) || 0) : s),
            0
          );

          const splitTabs: { value: ESplitType; label: string }[] = [
            { value: ESplitType.EQUAL, label: 'Equal' },
            { value: ESplitType.PERCENTAGE, label: 'Percentage' },
            { value: ESplitType.SHARES, label: 'Shares' },
            { value: ESplitType.CUSTOM, label: 'Custom' },
          ];

          return (
            <form onSubmit={handleAddExpense} className='mt-4 space-y-4 rounded-xl border border-border bg-card p-5'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <input
                  type='text'
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder='Description (e.g. Dinner, Groceries)'
                  className='rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                  required
                />
                <input
                  type='number'
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder='Amount'
                  className='rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                  min='0.01'
                  step='0.01'
                  required
                />
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as EBillCategory)}
                  className='rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                >
                  {Object.values(EBillCategory).map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
                <input
                  type='date'
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className='rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
                />
              </div>

              {/* Split method tabs */}
              <div>
                <label className='mb-2 block text-xs font-semibold uppercase tracking-wider text-muted'>
                  Split method
                </label>
                <div className='inline-flex rounded-lg border border-border bg-background p-1'>
                  {splitTabs.map((tab) => (
                    <button
                      key={tab.value}
                      type='button'
                      onClick={() => setExpSplitType(tab.value)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        expSplitType === tab.value
                          ? 'bg-primary text-white'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants + per-member inputs */}
              <div>
                <div className='mb-2 flex items-center justify-between'>
                  <label className='text-xs font-semibold uppercase tracking-wider text-muted'>
                    Participants ({selectedMembers.length}/{event.members.filter((m) => m.userId).length})
                  </label>
                  <div className='flex gap-2 text-xs'>
                    <button
                      type='button'
                      onClick={() => {
                        const next: Record<string, boolean> = {};
                        for (const m of event.members) if (m.userId) next[m.userId] = true;
                        setExpParticipants(next);
                      }}
                      className='text-primary hover:underline'
                    >
                      Select all
                    </button>
                    <span className='text-muted'>·</span>
                    <button
                      type='button'
                      onClick={() => {
                        const next: Record<string, boolean> = {};
                        for (const m of event.members) if (m.userId) next[m.userId] = false;
                        setExpParticipants(next);
                      }}
                      className='text-muted hover:text-foreground'
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className='space-y-2 rounded-lg border border-border bg-background p-3'>
                  {event.members.filter((m) => m.userId).map((m) => {
                    const uid = m.userId!;
                    const checked = !!expParticipants[uid];
                    const shown = computedMap[uid];
                    return (
                      <div key={uid} className='flex items-center gap-3'>
                        <input
                          type='checkbox'
                          checked={checked}
                          onChange={() => toggleParticipant(uid)}
                          className='h-4 w-4 rounded border-border text-primary'
                        />
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className='flex-1 text-sm'>
                          <p className='font-medium text-foreground'>{m.name}</p>
                          <p className='text-xs text-muted'>{m.email}</p>
                        </div>

                        {expSplitType === ESplitType.EQUAL && (
                          <div className='text-sm font-medium text-foreground'>
                            {checked && amount > 0 ? `$${(shown ?? 0).toFixed(2)}` : '—'}
                          </div>
                        )}

                        {expSplitType === ESplitType.PERCENTAGE && (
                          <div className='flex items-center gap-2'>
                            <input
                              type='number'
                              disabled={!checked}
                              value={expSplitInputs[uid] ?? ''}
                              onChange={(e) => setSplitInput(uid, e.target.value)}
                              placeholder='0'
                              min='0'
                              max='100'
                              step='0.01'
                              className='w-20 rounded-md border border-border bg-background px-2 py-1 text-right text-sm text-foreground disabled:opacity-40'
                            />
                            <span className='text-xs text-muted'>%</span>
                            <div className='w-16 text-right text-xs text-muted'>
                              {checked && amount > 0 ? `$${(shown ?? 0).toFixed(2)}` : ''}
                            </div>
                          </div>
                        )}

                        {expSplitType === ESplitType.SHARES && (
                          <div className='flex items-center gap-2'>
                            <input
                              type='number'
                              disabled={!checked}
                              value={expSplitInputs[uid] ?? ''}
                              onChange={(e) => setSplitInput(uid, e.target.value)}
                              placeholder='1'
                              min='0'
                              step='1'
                              className='w-20 rounded-md border border-border bg-background px-2 py-1 text-right text-sm text-foreground disabled:opacity-40'
                            />
                            <span className='text-xs text-muted'>sh</span>
                            <div className='w-16 text-right text-xs text-muted'>
                              {checked && amount > 0 ? `$${(shown ?? 0).toFixed(2)}` : ''}
                            </div>
                          </div>
                        )}

                        {expSplitType === ESplitType.CUSTOM && (
                          <div className='flex items-center gap-2'>
                            <span className='text-xs text-muted'>$</span>
                            <input
                              type='number'
                              disabled={!checked}
                              value={expSplitInputs[uid] ?? ''}
                              onChange={(e) => setSplitInput(uid, e.target.value)}
                              placeholder='0.00'
                              min='0'
                              step='0.01'
                              className='w-24 rounded-md border border-border bg-background px-2 py-1 text-right text-sm text-foreground disabled:opacity-40'
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary / validation row */}
                <div className='mt-2 flex items-center justify-between text-xs'>
                  {expSplitType === ESplitType.PERCENTAGE && (
                    <>
                      <span className='text-muted'>Total percentage</span>
                      <span className={`font-medium ${Math.abs(pctSum - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                        {pctSum.toFixed(2)}% / 100%
                      </span>
                    </>
                  )}
                  {expSplitType === ESplitType.CUSTOM && (
                    <>
                      <span className='text-muted'>Sum of splits</span>
                      <span className={`font-medium ${Math.abs(splitSum - amount) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                        ${splitSum.toFixed(2)} / ${amount.toFixed(2)}
                      </span>
                    </>
                  )}
                  {expSplitType === ESplitType.SHARES && (
                    <>
                      <span className='text-muted'>Total shares</span>
                      <span className='font-medium text-foreground'>{totalShares}</span>
                    </>
                  )}
                  {expSplitType === ESplitType.EQUAL && selectedMembers.length > 0 && amount > 0 && (
                    <>
                      <span className='text-muted'>Each person pays</span>
                      <span className='font-medium text-foreground'>
                        ${(amount / selectedMembers.length).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className='flex gap-2'>
                <button
                  type='submit'
                  disabled={addingExpense}
                  className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50'
                >
                  {addingExpense ? 'Adding...' : 'Add Expense'}
                </button>
                <button
                  type='button'
                  onClick={() => setShowAddExpense(false)}
                  className='rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary'
                >
                  Cancel
                </button>
              </div>
            </form>
          );
        })()}

        <div className='mt-8 grid gap-8 lg:grid-cols-2'>
          {/* Balances */}
          <div>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>Who Owes Whom</h2>
            {balances.length ? (
              <div className='space-y-3'>
                {balances.map((b, i) => (
                  <div key={i} className='flex items-center justify-between rounded-xl border border-border bg-card p-4'>
                    <div>
                      <p className='text-sm text-foreground'>
                        <span className='font-medium'>{b.from.name}</span>{' '}
                        <span className='text-muted'>owes</span>{' '}
                        <span className='font-medium'>{b.to.name}</span>
                      </p>
                      <p className='text-lg font-bold text-primary'>${b.amount.toFixed(2)}</p>
                    </div>
                    {b.from.userId === (session as unknown as { user: { id: string } })?.user?.id && (
                      <button
                        onClick={() => handleSettle(b)}
                        className='rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-500/20'
                      >
                        Mark Settled
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='rounded-xl border border-dashed border-border py-8 text-center'>
                <p className='text-muted'>All settled up!</p>
              </div>
            )}
          </div>

          {/* Members */}
          <div>
            <h2 className='mb-4 text-lg font-semibold text-foreground'>Members ({event.members.length})</h2>
            <div className='space-y-2'>
              {event.members.map((m, i) => (
                <div key={i} className='flex items-center justify-between rounded-xl border border-border bg-card p-3'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary'>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className='text-sm font-medium text-foreground'>{m.name}</p>
                      <p className='text-xs text-muted'>{m.email}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      m.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className='mt-8'>
          <h2 className='mb-4 text-lg font-semibold text-foreground'>Expenses ({expenses.length})</h2>
          {expenses.length ? (
            <div className='space-y-3'>
              {expenses.map((exp) => (
                <div key={exp._id} className='rounded-xl border border-border bg-card p-4'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='font-medium text-foreground'>{exp.description}</p>
                      <p className='mt-1 text-sm text-muted'>
                        Paid by <span className='font-medium text-foreground'>{getMemberName(exp.paidBy)}</span>
                        {' \u00B7 '}{new Date(exp.date).toLocaleDateString()}
                        {' \u00B7 '}{CATEGORY_LABELS[exp.category] || exp.category}
                      </p>
                    </div>
                    <p className='text-lg font-bold text-foreground'>${exp.amount.toFixed(2)}</p>
                  </div>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {exp.splits.map((split, i) => (
                      <span
                        key={i}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          split.settled
                            ? 'bg-green-500/10 text-green-600 line-through'
                            : 'bg-secondary text-muted'
                        }`}
                      >
                        {getMemberName(split.userId)}: ${split.amount.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='rounded-xl border border-dashed border-border py-8 text-center'>
              <p className='text-muted'>No expenses yet</p>
              <button onClick={openAddExpense} className='mt-2 text-sm font-medium text-primary hover:underline'>
                Add the first expense
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

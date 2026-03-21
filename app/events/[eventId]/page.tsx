'use client';

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
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
  const { data: session } = useSession({ required: true });
  const params = useParams();
  const eventId = params.eventId as string;

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
  const [expSplitType, setExpSplitType] = useState('equal');
  const [addingExpense, setAddingExpense] = useState(false);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (session) fetchAll();
  }, [session, eventId]);

  async function fetchAll() {
    try {
      setLoading(true);
      const headers = await authHeaders();

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

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !session?.user) return;

    const amount = parseFloat(expAmount);
    if (!expDesc.trim() || !amount || amount <= 0) {
      toast.error('Please fill in description and amount');
      return;
    }

    const activeMembers = event.members.filter((m) => m.userId);
    if (activeMembers.length === 0) {
      toast.error('No active members to split with');
      return;
    }

    let splits;
    if (expSplitType === 'equal') {
      const splitAmount = Math.round((amount / activeMembers.length) * 100) / 100;
      splits = activeMembers.map((m) => ({ userId: m.userId!, amount: splitAmount }));
    } else {
      // For now, default to equal even in custom mode
      const splitAmount = Math.round((amount / activeMembers.length) * 100) / 100;
      splits = activeMembers.map((m) => ({ userId: m.userId!, amount: splitAmount }));
    }

    try {
      setAddingExpense(true);
      const headers = await authHeaders();

      const currentUserId = (session as unknown as { user: { id: string } }).user?.id ||
        event.members.find((m) => m.email === session.user?.email)?.userId;

      const res = await fetch(`${apiUrl()}/api/events/${eventId}/expenses`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
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
      fetchAll();
    } catch {
      toast.error('Failed to add expense');
    } finally {
      setAddingExpense(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      const headers = await authHeaders();

      const res = await fetch(`${apiUrl()}/api/events/${eventId}/invite`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
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

  async function handleSettle(balance: Balance) {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/events/${eventId}/settle`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
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

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-4xl px-4 py-8'>
        <Link href='/events' className='text-sm text-muted hover:text-foreground'>&larr; Events</Link>

        {/* Event Header */}
        <div className='mt-4 flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>{event.name}</h1>
            {event.description && <p className='mt-1 text-muted'>{event.description}</p>}
            <p className='mt-1 text-sm text-muted'>
              Total expenses: <span className='font-semibold text-foreground'>${totalExpenses.toFixed(2)}</span>
            </p>
          </div>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowInvite(!showInvite)}
              className='rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-secondary'
            >
              Invite
            </button>
            <button
              onClick={() => setShowAddExpense(!showAddExpense)}
              className='rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-sm font-medium text-white hover:brightness-110'
            >
              Add Expense
            </button>
          </div>
        </div>

        {/* Invite Form */}
        {showInvite && (
          <form onSubmit={handleInvite} className='mt-4 flex gap-2 rounded-xl border border-border bg-card p-4'>
            <input
              type='email'
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder='Enter email address'
              className='flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
              required
            />
            <button type='submit' disabled={inviting} className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50'>
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        )}

        {/* Add Expense Form */}
        {showAddExpense && (
          <form onSubmit={handleAddExpense} className='mt-4 space-y-3 rounded-xl border border-border bg-card p-4'>
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
            <div className='flex items-center gap-4'>
              <label className='flex items-center gap-2 text-sm text-foreground'>
                <input type='radio' name='splitType' value='equal' checked={expSplitType === 'equal'} onChange={() => setExpSplitType('equal')} />
                Split Equally
              </label>
            </div>
            <button type='submit' disabled={addingExpense} className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50'>
              {addingExpense ? 'Adding...' : 'Add Expense'}
            </button>
          </form>
        )}

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
              <button onClick={() => setShowAddExpense(true)} className='mt-2 text-sm font-medium text-primary hover:underline'>
                Add the first expense
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

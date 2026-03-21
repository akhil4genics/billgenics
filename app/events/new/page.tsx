'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { apiUrl, authHeaders } from '@/lib/api';

export default function NewEventPage() {
  useSession({ required: true });
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Event name is required');
      return;
    }

    try {
      setSaving(true);
      const headers = await authHeaders();

      const res = await fetch(`${apiUrl()}/api/events`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create event');

      const data = await res.json();
      toast.success('Event created!');
      router.push(`/events/${data.data._id}`);
    } catch {
      toast.error('Failed to create event');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-lg px-4 py-8'>
        <Link href='/events' className='text-sm text-muted hover:text-foreground'>&larr; Events</Link>
        <h1 className='mt-2 text-2xl font-bold text-foreground'>Create Event</h1>
        <p className='mt-1 text-sm text-muted'>Create an event to track shared expenses with others</p>

        <form onSubmit={handleSubmit} className='mt-8 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-foreground'>Event Name *</label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Weekend Trip, Dinner Party'
              className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-foreground'>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder='Optional description...'
              className='mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground'
            />
          </div>
          <button
            type='submit'
            disabled={saving}
            className='w-full rounded-lg bg-gradient-to-r from-primary to-accent py-3 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50'
          >
            {saving ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
}

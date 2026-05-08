'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppHeader } from '@/components/AppHeader';
import { apiUrl, authHeaders } from '@/lib/api';

interface Event {
  _id: string;
  name: string;
  description?: string;
  status: string;
  members: { name: string; email: string; status: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function EventsPage() {
  const { status } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'closed'>('active');

  useEffect(() => {
    if (status === 'authenticated') fetchEvents(filter);
  }, [status, filter]);

  async function fetchEvents(currentFilter: 'active' | 'closed') {
    try {
      setLoading(true);
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/events?status=${currentFilter}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.data || []);
      }
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <AppHeader />
      <div className='mx-auto max-w-4xl px-4 py-8 pb-24 md:pb-8'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Events</h1>
            <p className='text-sm text-muted'>Create events and split expenses with others</p>
          </div>
          <Link href='/events/new' className='btn-primary'>
            + New Event
          </Link>
        </div>

        <div className='mb-6 inline-flex rounded-lg border border-border bg-card p-1'>
          {(['active', 'closed'] as const).map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => setFilter(option)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === option
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          </div>
        ) : events.length ? (
          <div className='space-y-3'>
            {events.map((event) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className='block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md'
              >
                <div className='flex items-start justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-foreground'>{event.name}</h3>
                    {event.description && <p className='mt-1 text-sm text-muted'>{event.description}</p>}
                    <div className='mt-2 flex items-center gap-3'>
                      <span className='text-xs text-muted'>
                        {event.members.length} member{event.members.length !== 1 ? 's' : ''}
                      </span>
                      <span className='text-xs text-muted'>
                        Created {new Date(event.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      event.status === 'active'
                        ? 'bg-green-500/10 text-green-600'
                        : event.status === 'settled'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-gray-500/10 text-gray-600'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className='mt-3 flex -space-x-2'>
                  {event.members.slice(0, 5).map((m, i) => (
                    <div
                      key={i}
                      className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-xs font-medium text-primary'
                      title={m.name}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {event.members.length > 5 && (
                    <div className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-medium text-muted'>
                      +{event.members.length - 5}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className='rounded-xl border border-dashed border-border py-16 text-center'>
            <svg className='mx-auto h-12 w-12 text-muted' fill='none' viewBox='0 0 24 24' strokeWidth={1} stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' />
            </svg>
            <p className='mt-4 text-lg text-muted'>
              {filter === 'active' ? 'No active events' : 'No closed events'}
            </p>
            <p className='mt-1 text-sm text-muted'>
              {filter === 'active'
                ? 'Create an event to start splitting expenses'
                : 'Closed events will appear here once you close them'}
            </p>
            {filter === 'active' && (
              <Link href='/events/new' className='mt-4 inline-block text-sm font-medium text-primary hover:underline'>
                Create your first event
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

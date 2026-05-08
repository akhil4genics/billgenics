'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiUrl, authHeaders } from '@/lib/api';
import { Header } from '@/components/Header';

interface InvitePreview {
  name: string;
  description?: string;
  memberCount: number;
  invitedBy?: string | null;
}

export default function JoinEventPage() {
  const { code } = useParams();
  const router = useRouter();
  const { status } = useSession();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeStr = typeof code === 'string' ? code : Array.isArray(code) ? code[0] : '';

  useEffect(() => {
    async function fetchPreview() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl()}/api/events/join/${codeStr}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Invitation could not be loaded');
        } else {
          setPreview(json.data);
        }
      } catch {
        setError('Invitation could not be loaded');
      } finally {
        setLoading(false);
      }
    }
    if (codeStr) fetchPreview();
  }, [codeStr]);

  async function handleAccept() {
    if (status !== 'authenticated') {
      router.push(`/signin?callbackUrl=${encodeURIComponent(`/events/join/${codeStr}`)}`);
      return;
    }
    try {
      setJoining(true);
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/events/join/${codeStr}`, {
        method: 'POST',
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to join');
      toast.success(json.data?.alreadyMember ? 'Welcome back!' : 'Joined the group!');
      router.push(`/events/${json.data.eventId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to join');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className='min-h-screen bg-background font-sans'>
      <Header />
      <main className='flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 pt-28 pb-16'>
        <div className='w-full max-w-md'>
          <div className='card-elevated p-10 text-center'>
            {loading ? (
              <div className='flex justify-center py-8'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
              </div>
            ) : error ? (
              <>
                <h1 className='text-2xl font-bold text-foreground'>Invitation unavailable</h1>
                <p className='mt-3 text-sm text-muted'>{error}</p>
                <Link href='/' className='btn-ghost mt-6 inline-flex'>
                  Back to home
                </Link>
              </>
            ) : preview ? (
              <>
                <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <svg className='h-7 w-7' fill='none' viewBox='0 0 24 24' strokeWidth={1.8} stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' />
                  </svg>
                </div>
                <p className='mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted'>
                  You&apos;re invited to join
                </p>
                <h1 className='mt-2 text-3xl font-bold leading-tight text-foreground'>{preview.name}</h1>
                {preview.description && (
                  <p className='mt-3 text-sm leading-relaxed text-muted'>{preview.description}</p>
                )}
                <p className='mt-5 text-sm text-muted'>
                  {preview.invitedBy && (
                    <>
                      Invited by <span className='font-medium text-foreground'>{preview.invitedBy}</span> ·{' '}
                    </>
                  )}
                  {preview.memberCount} {preview.memberCount === 1 ? 'member' : 'members'}
                </p>

                <button
                  type='button'
                  onClick={handleAccept}
                  disabled={joining || status === 'loading'}
                  className='btn-primary-block mt-8'
                >
                  {joining
                    ? 'Joining...'
                    : status === 'authenticated'
                      ? 'Accept & Join'
                      : 'Sign in to Join'}
                </button>
                <p className='mt-4 text-xs text-muted'>
                  New to BillGenics?{' '}
                  <Link
                    href={`/signup?callbackUrl=${encodeURIComponent(`/events/join/${codeStr}`)}`}
                    className='font-semibold text-primary hover:underline'
                  >
                    Create a free account
                  </Link>
                </p>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

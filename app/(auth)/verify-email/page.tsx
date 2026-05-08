'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { apiUrl } from '@/lib/api';

type Status = 'verifying' | 'verified' | 'expired' | 'invalid' | 'failed';

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const email = searchParams.get('email');
  const [status, setStatus] = useState<Status>('verifying');
  // The verification endpoint mutates state (consumes the registration code),
  // so we must guard against React StrictMode firing the effect twice in dev.
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!code || !email) {
      setStatus('invalid');
      return;
    }

    (async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/verify'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, email }),
        });
        if (res.ok) {
          setStatus('verified');
          setTimeout(() => router.push('/signin?verified=true'), 1500);
          return;
        }
        const data = await res.json().catch(() => null);
        const errorCode = data?.error;
        if (errorCode === 'expired') setStatus('expired');
        else if (errorCode === 'invalid') setStatus('invalid');
        else setStatus('failed');
      } catch {
        setStatus('failed');
      }
    })();
  }, [code, email, router]);

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header showNav={false} showAuthButtons={false} />
      <main className='flex flex-1 items-center justify-center px-4 py-12 pt-32'>
        <div className='w-full max-w-md'>
          <div className='card-elevated p-8 text-center'>
            {status === 'verifying' && (
              <>
                <div className='mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent' />
                <h1 className='text-2xl font-bold text-foreground'>Verifying your email…</h1>
                <p className='mt-2 text-sm text-muted'>This will only take a moment.</p>
              </>
            )}

            {status === 'verified' && (
              <>
                <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
                  <svg
                    className='h-8 w-8 text-green-600 dark:text-green-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <h1 className='text-2xl font-bold text-foreground'>Email verified</h1>
                <p className='mt-2 text-sm text-muted'>
                  You&apos;re all set. Redirecting you to sign in…
                </p>
                <Link href='/signin?verified=true' className='btn-primary-block mt-6 block'>
                  Sign in now
                </Link>
              </>
            )}

            {(status === 'invalid' || status === 'expired' || status === 'failed') && (
              <>
                <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500'>
                  <svg
                    className='h-8 w-8'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.7}
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
                    />
                  </svg>
                </div>
                <h1 className='text-2xl font-bold text-foreground'>
                  {status === 'expired'
                    ? 'Link expired'
                    : status === 'invalid'
                    ? 'Invalid link'
                    : 'Something went wrong'}
                </h1>
                <p className='mt-2 text-sm text-muted'>
                  {status === 'expired'
                    ? 'This verification link has expired. Sign up again or contact support to resend.'
                    : status === 'invalid'
                    ? 'We couldn&apos;t verify this link. It may have already been used.'
                    : 'Please try again in a moment.'}
                </p>
                <div className='mt-6 flex flex-col gap-2'>
                  <Link href='/signin' className='btn-primary-block block'>
                    Go to sign in
                  </Link>
                  <Link href='/signup' className='btn-ghost-block block'>
                    Create a new account
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-background'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}

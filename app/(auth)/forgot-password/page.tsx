'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { apiUrl } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'An error occurred. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className='flex min-h-screen flex-col bg-background'>
        <Header showNav={false} showAuthButtons={false} />
        <main className='flex flex-1 items-center justify-center px-4 py-12 pt-32'>
          <div className='w-full max-w-md'>
            <div className='rounded-2xl border border-border bg-card p-8 shadow-lg'>
              <div className='mb-6 text-center'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
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
                      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <h1 className='text-2xl font-bold text-foreground'>Check your email</h1>
                <p className='mt-2 text-muted'>
                  If an account exists with {email}, you will receive a password reset link shortly.
                </p>
              </div>

              <div className='space-y-4'>
                <div className='rounded-lg border border-border bg-background p-4'>
                  <p className='text-sm text-muted'>
                    <strong className='text-foreground'>Didn&apos;t receive the email?</strong>
                    <br />
                    Check your spam folder or try again in a few minutes.
                  </p>
                </div>

                <Link
                  href='/signin'
                  className='block w-full rounded-lg border border-border bg-background px-4 py-3 text-center font-medium text-foreground transition-colors hover:bg-muted'
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header showNav={false} showAuthButtons={false} />

      <main className='flex flex-1 items-center justify-center px-4 py-12 pt-32'>
        <div className='w-full max-w-md'>
          <div className='rounded-2xl border border-border bg-card p-8 shadow-lg'>
            <div className='mb-8 text-center'>
              <h1 className='text-2xl font-bold text-foreground'>Forgot password?</h1>
              <p className='mt-2 text-muted'>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            {error && (
              <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label htmlFor='email' className='mb-2 block text-sm font-medium text-foreground'>
                  Email
                </label>
                <input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='you@example.com'
                  required
                  className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                />
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className='mt-6 text-center text-sm text-muted'>
              Remember your password?{' '}
              <Link href='/signin' className='font-medium text-primary hover:text-primary-hover'>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

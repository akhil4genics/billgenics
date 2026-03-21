'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '../../components/Header';
import { apiUrl } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const code = searchParams.get('code');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!code || !email) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [code, email]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/signin');
        }, 3000);
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
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
                <h1 className='text-2xl font-bold text-foreground'>Password reset successful!</h1>
                <p className='mt-2 text-muted'>
                  Your password has been updated. Redirecting you to sign in...
                </p>
              </div>

              <Link
                href='/signin'
                className='block w-full rounded-lg bg-primary px-4 py-3 text-center font-medium text-white transition-colors hover:bg-primary-hover'
              >
                Sign in now
              </Link>
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
              <h1 className='text-2xl font-bold text-foreground'>Reset your password</h1>
              <p className='mt-2 text-muted'>Enter your new password below.</p>
            </div>

            {error && (
              <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label htmlFor='password' className='mb-2 block text-sm font-medium text-foreground'>
                  New Password
                </label>
                <input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter new password'
                  required
                  className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                />
                <p className='mt-2 text-xs text-muted'>
                  Must be at least 8 characters with uppercase, lowercase, and a number
                </p>
              </div>

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='mb-2 block text-sm font-medium text-foreground'
                >
                  Confirm Password
                </label>
                <input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Confirm new password'
                  required
                  className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                />
              </div>

              <button
                type='submit'
                disabled={isLoading || !code || !email}
                className='w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isLoading ? 'Resetting password...' : 'Reset password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

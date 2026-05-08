'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Header } from '@/components/Header';
import { apiUrl } from '@/lib/api';

interface ChallengeState {
  challengeId: string;
  sentTo: string;
  expiresInMinutes: number;
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    const verified = searchParams.get('verified');
    const errorParam = searchParams.get('error');

    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now sign in.');
    } else if (errorParam) {
      switch (errorParam) {
        case 'invalid_verification':
          setError('Invalid verification link. Please try again or request a new verification email.');
          break;
        case 'expired_verification':
          setError('Verification link has expired. Please request a new verification email.');
          break;
        case 'verification_failed':
          setError('Verification failed. Please try again later.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('=== SIGNIN FORM SUBMITTED ===');
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    console.log('Email:', email, 'Password length:', password.length);

    if (!validateEmail(email)) {
      console.log('Email validation failed');
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      console.log('Password too short');
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    console.log('Basic validation passed, proceeding with API call');

    try {
      const checkResponse = await fetch(apiUrl('/api/auth/check-credentials'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        setError(checkData.error || 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      // New-device challenge — show the code input instead of completing sign-in.
      if (checkData?.requiresChallenge) {
        setChallenge({
          challengeId: checkData.challengeId,
          sentTo: checkData.sentTo,
          expiresInMinutes: checkData.expiresInMinutes ?? 10,
        });
        setIsLoading(false);
        return;
      }

      await completeSignIn();
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const completeSignIn = async () => {
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.ok) {
      router.push('/account');
    } else {
      setError('Sign in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/verify-login-challenge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, challengeId: challenge.challengeId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Code is incorrect.');
        setIsLoading(false);
        return;
      }
      // Device is now trusted — finish the NextAuth signin handshake.
      await completeSignIn();
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResendChallenge = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/check-credentials'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data?.requiresChallenge) {
        setChallenge({
          challengeId: data.challengeId,
          sentTo: data.sentTo,
          expiresInMinutes: data.expiresInMinutes ?? 10,
        });
        setSuccess('A fresh code has been sent.');
      } else {
        setError(data.error || 'Could not resend code.');
      }
    } catch {
      setError('Could not resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header
        showNav={false}
        showAuthButtons={false}
      />

      <main className='flex flex-1 items-center justify-center px-4 py-12 pt-32'>
        <div className='w-full max-w-md'>
          <div className='card-elevated p-8'>
            <div className='mb-8 text-center'>
              <h1 className='text-2xl font-bold text-foreground'>
                {challenge ? 'Confirm it’s you' : 'Welcome back'}
              </h1>
              <p className='mt-2 text-muted'>
                {challenge
                  ? `We sent a 6-digit code to ${challenge.sentTo}. Enter it to finish signing in.`
                  : 'Sign in to your account to continue'}
              </p>
            </div>

            {error && (
              <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
                {error}
              </div>
            )}

            {success && !challenge && (
              <div className='mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200'>
                {success}
              </div>
            )}

            {challenge ? (
              <form onSubmit={handleChallengeSubmit} className='space-y-4'>
                <div>
                  <label htmlFor='code' className='mb-2 block text-sm font-medium text-foreground'>
                    Verification code
                  </label>
                  <input
                    id='code'
                    type='text'
                    inputMode='numeric'
                    autoComplete='one-time-code'
                    pattern='[0-9]*'
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder='123456'
                    required
                    autoFocus
                    className='w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-xl font-semibold tracking-[0.4em] text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                  />
                  <p className='mt-2 text-xs text-muted'>
                    Code expires in {challenge.expiresInMinutes} minutes.
                  </p>
                </div>

                <button type='submit' disabled={isLoading || code.length < 6} className='btn-primary-block'>
                  {isLoading ? 'Verifying…' : 'Verify and sign in'}
                </button>

                <div className='flex items-center justify-between text-sm'>
                  <button
                    type='button'
                    onClick={handleResendChallenge}
                    disabled={isLoading}
                    className='text-primary hover:text-primary-hover disabled:opacity-50'
                  >
                    Send a new code
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setChallenge(null);
                      setCode('');
                      setError('');
                      setSuccess('');
                    }}
                    className='text-muted hover:text-foreground'
                  >
                    Use a different account
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label
                    htmlFor='email'
                    className='mb-2 block text-sm font-medium text-foreground'
                  >
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

                <div>
                  <div className='mb-2 flex items-center justify-between'>
                    <label
                      htmlFor='password'
                      className='block text-sm font-medium text-foreground'
                    >
                      Password
                    </label>
                    <Link
                      href='/forgot-password'
                      className='text-sm text-primary hover:text-primary-hover'
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id='password'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Enter your password'
                    required
                    className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                  />
                </div>

                <button
                  type='submit'
                  disabled={isLoading}
                  className='btn-primary-block'
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            )}

            {!challenge && (
              <p className='mt-6 text-center text-sm text-muted'>
                Don&apos;t have an account?{' '}
                <Link
                  href='/signup'
                  className='font-medium text-primary hover:text-primary-hover'
                >
                  Sign up
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}

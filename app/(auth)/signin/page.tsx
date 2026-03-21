'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Header } from '../../components/Header';
import { apiUrl } from '@/lib/api';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      // First, check credentials to get specific error messages
      const checkResponse = await fetch(apiUrl('/api/auth/check-credentials'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        console.log('Credential check failed:', checkData);
        setError(checkData.error || 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      console.log('Credentials validated, proceeding with NextAuth signin');

      // If credentials are valid, proceed with NextAuth signin
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('NextAuth signin result:', result);

      if (result?.error) {
        console.error('NextAuth error:', result.error);
        setError('Sign in failed. Please try again.');
      } else if (result?.ok) {
        console.log('Sign in successful, redirecting to /account');
        router.push('/account');
      } else {
        console.error('Unexpected result:', result);
        setError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      console.error('Signin exception:', err);
      setError('An error occurred. Please try again.');
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
          <div className='rounded-2xl border border-border bg-card p-8 shadow-lg'>
            <div className='mb-8 text-center'>
              <h1 className='text-2xl font-bold text-foreground'>Welcome back</h1>
              <p className='mt-2 text-muted'>Sign in to your account to continue</p>
            </div>

            {error && (
              <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
                {error}
              </div>
            )}

            {success && (
              <div className='mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200'>
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className='space-y-4'
            >
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
                className='w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className='mt-6 text-center text-sm text-muted'>
              Don&apos;t have an account?{' '}
              <Link
                href='/signup'
                className='font-medium text-primary hover:text-primary-hover'
              >
                Sign up
              </Link>
            </p>
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

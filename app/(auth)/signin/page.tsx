'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { apiUrl } from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthAlert, FormField, PasswordField, SubmitButton } from '@/components/auth/fields';

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
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

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
    <AuthLayout
      panelHeading="Every bill, reminder and shared expense in one place."
      panelSubtext="Scan receipts with AI, organise recurring payments and stay ahead of every due date."
    >
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {challenge ? 'Confirm it’s you' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {challenge
            ? `We sent a 6-digit code to ${challenge.sentTo}. Enter it to finish signing in.`
            : 'Sign in to manage your bills, reminders and shared expenses.'}
        </p>
      </div>

      {error && <AuthAlert type="error">{error}</AuthAlert>}
      {success && !challenge && <AuthAlert type="success">{success}</AuthAlert>}

      {challenge ? (
        <form onSubmit={handleChallengeSubmit} className="space-y-5">
          <div>
            <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-foreground">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              required
              autoFocus
              aria-describedby="code-hint"
              className="min-h-[52px] w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-xl font-semibold tracking-[0.4em] text-foreground shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
            <p id="code-hint" className="mt-2 text-xs text-muted">
              Code expires in {challenge.expiresInMinutes} minutes.
            </p>
          </div>

          <SubmitButton loading={isLoading} loadingText="Verifying…" disabled={code.length < 6}>
            Verify and sign in
          </SubmitButton>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResendChallenge}
              disabled={isLoading}
              className="font-medium text-primary hover:text-primary-hover disabled:opacity-50"
            >
              Send a new code
            </button>
            <button
              type="button"
              onClick={() => {
                setChallenge(null);
                setCode('');
                setError('');
                setSuccess('');
              }}
              className="text-muted hover:text-foreground"
            >
              Use a different account
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <PasswordField
            id="password"
            label="Password"
            labelRight={
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-hover">
                Forgot password?
              </Link>
            }
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <SubmitButton loading={isLoading} loadingText="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      )}

      {!challenge && (
        <p className="mt-7 text-center text-sm text-muted">
          New to BillGenics?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:text-primary-hover">
            Create an account
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>}>
      <SignInForm />
    </Suspense>
  );
}

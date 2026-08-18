'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck, ShieldCheck } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';
import {
  AuthAlert,
  FormField,
  PasswordField,
  PasswordRequirements,
  SubmitButton,
} from '@/components/auth/fields';

const SIGNUP_PANEL = {
  heading: 'Take control of your monthly bills from day one.',
  subtext: 'Add bills manually or scan a receipt and let BillGenics organise the details for you.',
} as const;

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('one number');
    return errors;
  };

  const validateUsername = (username: string) => {
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 30) return 'Username must be at most 30 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';

    const usernameError = validateUsername(username);
    if (usernameError) errors.username = usernameError;

    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.password = `Password must contain ${passwordErrors.join(', ')}`;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const newErrors: Record<string, string> = {};
          data.details.forEach((err: { field: string; message: string }) => {
            newErrors[err.field] = err.message;
          });
          setFieldErrors(newErrors);
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const confirmError =
    fieldErrors.confirmPassword ||
    (confirmPassword.length > 0 && confirmPassword !== password ? 'Passwords do not match' : undefined);

  if (isSubmitted) {
    return (
      <AuthLayout panelHeading={SIGNUP_PANEL.heading} panelSubtext={SIGNUP_PANEL.subtext}>
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/12 text-success">
            <MailCheck className="h-8 w-8" strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-muted">
            We&apos;ve sent a verification link to{' '}
            <span className="font-semibold text-foreground">{email}</span>. Click it to verify your account and start
            using BillGenics.
          </p>

          <div className="mt-7 rounded-2xl border border-border bg-secondary/40 p-4 text-left">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-sm text-muted">
                The verification link expires in 24 hours. If you don&apos;t see the email, check your spam folder.
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <Link
              href="/signin"
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-primary)] transition-all hover:bg-primary-hover hover:shadow-[var(--shadow-primary-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              Back to sign in
            </Link>
            <button
              onClick={() => setIsSubmitted(false)}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Use a different email
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout panelHeading={SIGNUP_PANEL.heading} panelSubtext={SIGNUP_PANEL.subtext}>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Create your BillGenics account
        </h1>
        <p className="mt-2 text-sm text-muted">Start organising your bills and expenses in minutes.</p>
      </div>

      {error && <AuthAlert type="error">{error}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="firstName"
            label="First name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            required
            error={fieldErrors.firstName}
          />
          <FormField
            id="lastName"
            label="Last name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            required
            error={fieldErrors.lastName}
          />
        </div>

        <FormField
          id="username"
          label="Username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="johndoe"
          required
          hint="Letters, numbers and underscores only (3–30 characters)"
          error={fieldErrors.username}
        />

        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          error={fieldErrors.email}
        />

        <div>
          <PasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
            error={fieldErrors.password}
          />
          {!fieldErrors.password && <PasswordRequirements value={password} />}
        </div>

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          required
          error={confirmError}
        />

        <SubmitButton loading={isLoading} loadingText="Creating account…">
          Create account
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-xs leading-relaxed text-muted">
        By signing up, you agree to our{' '}
        <Link href="#" className="text-primary hover:text-primary-hover">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-primary hover:text-primary-hover">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/signin" className="font-semibold text-primary hover:text-primary-hover">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { apiUrl } from '@/lib/api';

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
      />
    </svg>
  );
}

function EnvelopeIcon({ className }: { className?: string}) {
  return (
    <svg
      className={className}
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75'
      />
    </svg>
  );
}

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

  if (isSubmitted) {
    return (
      <div className='flex min-h-screen flex-col bg-background'>
        <Header
          showNav={false}
          showAuthButtons={false}
        />

        <main className='flex flex-1 items-center justify-center px-4 py-12 pt-32'>
          <div className='w-full max-w-md'>
            <div className='rounded-2xl border border-border bg-card p-8 text-center shadow-lg'>
              <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                <EnvelopeIcon className='h-8 w-8 text-green-600 dark:text-green-400' />
              </div>
              <h1 className='text-2xl font-bold text-foreground'>Check your email</h1>
              <p className='mt-4 text-muted'>
                We&apos;ve sent a verification link to <span className='font-medium text-foreground'>{email}</span>
              </p>
              <p className='mt-2 text-muted'>Click the link in the email to verify your account and start using BillGenics.</p>

              <div className='mt-8 rounded-lg bg-secondary/50 p-4'>
                <div className='flex items-start gap-3'>
                  <CheckCircleIcon className='mt-0.5 h-5 w-5 flex-shrink-0 text-primary' />
                  <p className='text-left text-sm text-muted'>
                    The verification link will expire in 24 hours. If you don&apos;t see the email, check your spam
                    folder.
                  </p>
                </div>
              </div>

              <div className='mt-8 space-y-3'>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className='w-full rounded-lg border border-border px-4 py-3 font-medium text-foreground transition-colors hover:bg-secondary'
                >
                  Use a different email
                </button>
                <Link
                  href='/signin'
                  className='block w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover'
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
      <Header
        showNav={false}
        showAuthButtons={false}
      />

      <main className='flex flex-1 items-center justify-center px-4 py-12 pt-32'>
        <div className='w-full max-w-md'>
          <div className='rounded-2xl border border-border bg-card p-8 shadow-lg'>
            <div className='mb-8 text-center'>
              <h1 className='text-2xl font-bold text-foreground'>Create your account</h1>
              <p className='mt-2 text-muted'>Start organizing your memories today</p>
            </div>

            {error && (
              <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className='space-y-4'
            >
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='firstName'
                    className='mb-2 block text-sm font-medium text-foreground'
                  >
                    First Name
                  </label>
                  <input
                    id='firstName'
                    type='text'
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder='John'
                    required
                    className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                  />
                  {fieldErrors.firstName && <p className='mt-1 text-xs text-red-600'>{fieldErrors.firstName}</p>}
                </div>

                <div>
                  <label
                    htmlFor='lastName'
                    className='mb-2 block text-sm font-medium text-foreground'
                  >
                    Last Name
                  </label>
                  <input
                    id='lastName'
                    type='text'
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder='Doe'
                    required
                    className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                  />
                  {fieldErrors.lastName && <p className='mt-1 text-xs text-red-600'>{fieldErrors.lastName}</p>}
                </div>
              </div>

              <div>
                <label
                  htmlFor='username'
                  className='mb-2 block text-sm font-medium text-foreground'
                >
                  Username
                </label>
                <input
                  id='username'
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder='johndoe'
                  required
                  className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                />
                <p className='mt-1 text-xs text-muted'>Letters, numbers, and underscores only (3-30 characters)</p>
                {fieldErrors.username && <p className='mt-1 text-xs text-red-600'>{fieldErrors.username}</p>}
              </div>

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
                {fieldErrors.email && <p className='mt-1 text-xs text-red-600'>{fieldErrors.email}</p>}
              </div>

              <div>
                <label
                  htmlFor='password'
                  className='mb-2 block text-sm font-medium text-foreground'
                >
                  Password
                </label>
                <input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Create a strong password'
                  required
                  className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                />
                <p className='mt-1 text-xs text-muted'>At least 8 characters with uppercase, lowercase, and number</p>
                {fieldErrors.password && <p className='mt-1 text-xs text-red-600'>{fieldErrors.password}</p>}
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
                  placeholder='Re-enter your password'
                  required
                  className='w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                />
                {fieldErrors.confirmPassword && <p className='mt-1 text-xs text-red-600'>{fieldErrors.confirmPassword}</p>}
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className='mt-6 text-center text-xs text-muted'>
              By signing up, you agree to our{' '}
              <Link
                href='#'
                className='text-primary hover:text-primary-hover'
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href='#'
                className='text-primary hover:text-primary-hover'
              >
                Privacy Policy
              </Link>
            </p>

            <p className='mt-4 text-center text-sm text-muted'>
              Already have an account?{' '}
              <Link
                href='/signin'
                className='font-medium text-primary hover:text-primary-hover'
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

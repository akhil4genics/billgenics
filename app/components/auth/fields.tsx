'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from 'lucide-react';

/* ─── Alert banner (server / success messages) ────────────────────────────── */
export function AuthAlert({
  type,
  children,
}: {
  type: 'error' | 'success';
  children: ReactNode;
}) {
  const error = type === 'error';
  return (
    <div
      role={error ? 'alert' : 'status'}
      aria-live={error ? 'assertive' : 'polite'}
      className={`mb-5 flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm ${
        error
          ? 'border-danger/25 bg-danger/8 text-danger'
          : 'border-success/25 bg-success/8 text-success'
      }`}
    >
      {error ? (
        <AlertCircle className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0" />
      ) : (
        <Check className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0 text-success" />
      )}
      <span>{children}</span>
    </div>
  );
}

/* ─── Text field ──────────────────────────────────────────────────────────── */
type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({ label, error, hint, id, className = '', ...props }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-[48px] w-full rounded-xl border bg-background px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-muted/70 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 [&:-webkit-autofill]:[transition:background-color_9999s] ${
          error
            ? 'border-danger focus:border-danger focus:ring-danger/15'
            : 'border-border focus:border-primary focus:ring-primary/15'
        }`}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Password field (show/hide) ──────────────────────────────────────────── */
export function PasswordField({
  label,
  labelRight,
  error,
  hint,
  id,
  ...props
}: FieldProps & { labelRight?: ReactNode }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const [show, setShow] = useState(false);
  const describedBy = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          id={fieldId}
          type={show ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`min-h-[48px] w-full rounded-xl border bg-background px-4 py-3 pr-12 text-foreground shadow-sm outline-none transition placeholder:text-muted/70 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 [&:-webkit-autofill]:[transition:background-color_9999s] ${
            error
              ? 'border-danger focus:border-danger focus:ring-danger/15'
              : 'border-border focus:border-primary focus:ring-primary/15'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          tabIndex={-1}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {show ? <EyeOff className="h-[1.15rem] w-[1.15rem]" /> : <Eye className="h-[1.15rem] w-[1.15rem]" />}
        </button>
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Live password requirement checklist ─────────────────────────────────── */
export function PasswordRequirements({ value }: { value: string }) {
  const rules = [
    { label: '8+ characters', ok: value.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(value) },
    { label: 'Lowercase', ok: /[a-z]/.test(value) },
    { label: 'Number', ok: /[0-9]/.test(value) },
  ];
  return (
    <ul className="mt-2.5 grid grid-cols-2 gap-1.5" aria-label="Password requirements">
      {rules.map((r) => (
        <li
          key={r.label}
          className={`flex items-center gap-1.5 text-xs transition-colors ${r.ok ? 'text-success' : 'text-muted'}`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
              r.ok ? 'bg-success/15' : 'bg-secondary'
            }`}
          >
            <Check className={`h-2.5 w-2.5 ${r.ok ? 'opacity-100' : 'opacity-30'}`} strokeWidth={3} />
          </span>
          {r.label}
        </li>
      ))}
    </ul>
  );
}

/* ─── Submit button (loading, no layout shift) ────────────────────────────── */
export function SubmitButton({
  loading,
  children,
  loadingText,
  ...props
}: {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
} & InputHTMLAttributes<HTMLButtonElement> & { type?: 'submit' | 'button' }) {
  return (
    <button
      {...props}
      type={props.type ?? 'submit'}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      className="relative inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-primary)] transition-all duration-200 hover:bg-primary-hover hover:shadow-[var(--shadow-primary-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      <span>{loading ? loadingText ?? children : children}</span>
    </button>
  );
}

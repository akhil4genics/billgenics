'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface PendingPrompt extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingPrompt | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...opts, resolve });
      }),
    []
  );

  const handleAnswer = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    cancelButtonRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleAnswer(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, handleAnswer]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className='fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-labelledby='confirm-title'
          onClick={() => handleAnswer(false)}
        >
          <div
            className='card-elevated w-full max-w-md p-6 sm:p-7'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-start gap-4'>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  pending.danger ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                }`}
              >
                {pending.danger ? (
                  <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.7} stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
                    />
                  </svg>
                ) : (
                  <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' strokeWidth={1.7} stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
                    />
                  </svg>
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <h2 id='confirm-title' className='text-lg font-semibold text-foreground'>
                  {pending.title}
                </h2>
                {pending.message && (
                  <p className='mt-1.5 text-sm leading-relaxed text-muted'>{pending.message}</p>
                )}
              </div>
            </div>
            <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
              <button
                ref={cancelButtonRef}
                type='button'
                className='btn-ghost'
                onClick={() => handleAnswer(false)}
              >
                {pending.cancelText ?? 'Cancel'}
              </button>
              <button
                type='button'
                className={pending.danger ? 'btn-danger' : 'btn-primary'}
                onClick={() => handleAnswer(true)}
              >
                {pending.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

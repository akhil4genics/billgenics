import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className='border-t border-[var(--color-border)] bg-[var(--color-card)] mt-auto'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--color-muted)]'>
        <p>&copy; {year} BillGenics. All rights reserved.</p>
        <nav className='flex items-center gap-4'>
          <Link href='/' className='hover:text-[var(--color-foreground)] transition-colors'>
            Home
          </Link>
          <Link href='/blogs' className='hover:text-[var(--color-foreground)] transition-colors'>
            Blog
          </Link>
          <Link href='/privacy' className='hover:text-[var(--color-foreground)] transition-colors'>
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}

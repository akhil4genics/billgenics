'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Header } from '../../../components/Header';
import { BlogEditor } from '../BlogEditor';

export default function NewBlogPage() {
  const { data: session, status } = useSession({ required: true });
  const isAdmin = session?.user?.adminUser === true;

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='min-h-screen bg-background font-sans'>
        <Header />
        <main className='pt-28 pb-24'>
          <div className='mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8'>
            <div className='rounded-3xl border border-border bg-card p-12'>
              <h1 className='text-2xl font-bold text-foreground'>Admins only</h1>
              <Link href='/account' className='mt-6 inline-block text-sm font-semibold text-primary hover:underline'>
                Back to your account
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background font-sans'>
      <Header />
      <main className='pt-28 pb-24'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
          <Link href='/admin/blogs' className='text-sm text-muted hover:text-foreground'>← Back to blogs</Link>
          <h1 className='mt-3 text-3xl font-bold tracking-tight text-foreground'>New post</h1>
          <p className='mt-1 text-sm text-muted'>Draft a new blog post. You can save as draft or publish immediately.</p>

          <div className='mt-8'>
            <BlogEditor mode='create' />
          </div>
        </div>
      </main>
    </div>
  );
}

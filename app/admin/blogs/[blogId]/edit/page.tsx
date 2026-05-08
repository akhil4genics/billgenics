'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { apiUrl, authHeaders } from '@/lib/api';
import { Header } from '@/components/Header';
import { BlogEditor } from '../../BlogEditor';
import type { IBlog } from '@backend/shared/types';

const fetcher = async (url: string) => {
  const headers = await authHeaders();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to load blog');
  return res.json();
};

export default function EditBlogPage() {
  const { data: session, status } = useSession({ required: true });
  const { blogId } = useParams();
  const isAdmin = session?.user?.adminUser === true;

  const { data, isLoading, error } = useSWR<{ data: IBlog }>(
    isAdmin && blogId ? `${apiUrl()}/api/blogs/admin/${blogId}` : null,
    fetcher
  );

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
          <h1 className='mt-3 text-3xl font-bold tracking-tight text-foreground'>Edit post</h1>

          <div className='mt-8'>
            {isLoading && (
              <div className='flex justify-center py-16'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
              </div>
            )}
            {error && (
              <div className='rounded-2xl border border-dashed border-border py-16 text-center text-muted'>
                Failed to load blog post.
              </div>
            )}
            {data?.data && <BlogEditor mode='edit' initial={data.data} />}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiUrl, authHeaders } from '@/lib/api';
import { Header } from '@/components/Header';
import { useConfirm } from '@/components/ConfirmDialog';
import { EBlogStatus, type IBlog } from '@backend/shared/types';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminBlogsPage() {
  const { data: session, status } = useSession({ required: true });
  const [blogs, setBlogs] = useState<IBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  const isAdmin = session?.user?.adminUser === true;

  async function fetchBlogs() {
    try {
      setLoading(true);
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/blogs?status=all&limit=100`, { headers });
      const json = await res.json();
      setBlogs(json?.data?.items || []);
    } catch {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) fetchBlogs();
  }, [status, isAdmin]);

  async function togglePublish(blog: IBlog) {
    try {
      const headers = await authHeaders();
      const path = blog.status === EBlogStatus.PUBLISHED ? 'unpublish' : 'publish';
      const res = await fetch(`${apiUrl()}/api/blogs/${blog._id}/${path}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error();
      toast.success(blog.status === EBlogStatus.PUBLISHED ? 'Unpublished' : 'Published');
      fetchBlogs();
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function removeBlog(blog: IBlog) {
    const ok = await confirm({
      title: `Delete "${blog.title}"?`,
      message: 'This blog post will be permanently removed. This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/blogs/${blog._id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      toast.success('Deleted');
      fetchBlogs();
    } catch {
      toast.error('Failed to delete');
    }
  }

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
              <p className='mt-3 text-muted'>This area is restricted to BillGenics administrators.</p>
              <Link href='/account' className='mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover'>
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
          <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-foreground'>Blog admin</h1>
              <p className='mt-1 text-sm text-muted'>Create, edit and publish posts for the public blog.</p>
            </div>
            <Link
              href='/admin/blogs/new'
              className='inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover'
            >
              + New Post
            </Link>
          </div>

          <div className='mt-8 overflow-hidden rounded-2xl border border-border bg-card'>
            {loading ? (
              <div className='flex justify-center py-16'>
                <div className='h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent' />
              </div>
            ) : blogs.length === 0 ? (
              <div className='py-16 text-center text-muted'>
                No blog posts yet.
              </div>
            ) : (
              <table className='w-full text-left text-sm'>
                <thead className='border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted'>
                  <tr>
                    <th className='px-5 py-3'>Title</th>
                    <th className='px-5 py-3'>Status</th>
                    <th className='px-5 py-3'>Published</th>
                    <th className='px-5 py-3'>Updated</th>
                    <th className='px-5 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((blog) => (
                    <tr key={blog._id} className='border-t border-border'>
                      <td className='px-5 py-4'>
                        <div className='font-medium text-foreground'>{blog.title}</div>
                        <div className='text-xs text-muted'>/{blog.slug}</div>
                      </td>
                      <td className='px-5 py-4'>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            blog.status === EBlogStatus.PUBLISHED
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-yellow-500/10 text-yellow-600'
                          }`}
                        >
                          {blog.status}
                        </span>
                      </td>
                      <td className='px-5 py-4 text-muted'>{formatDate(blog.publishedAt)}</td>
                      <td className='px-5 py-4 text-muted'>{formatDate(blog.updatedAt)}</td>
                      <td className='px-5 py-4 text-right'>
                        <div className='inline-flex gap-2'>
                          <Link
                            href={`/admin/blogs/${blog._id}/edit`}
                            className='rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary'
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => togglePublish(blog)}
                            className='rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20'
                          >
                            {blog.status === EBlogStatus.PUBLISHED ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => removeBlog(blog)}
                            className='rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/20'
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

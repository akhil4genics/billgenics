'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { apiUrl } from '@/lib/api';
import { Header } from '../../components/Header';
import type { IBlog } from '@backend/shared/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useSWR<{ data: IBlog; error?: string }>(
    slug ? `${apiUrl()}/api/blogs/slug/${slug}` : null,
    fetcher
  );

  const blog = data?.data;

  return (
    <div className='min-h-screen bg-background font-sans'>
      <Header />
      <main className='pt-28 pb-24'>
        <div className='mx-auto max-w-3xl px-4 sm:px-6 lg:px-8'>
          <Link
            href='/blogs'
            className='inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground'
          >
            ← Back to Blog
          </Link>

          {isLoading && (
            <div className='mt-16 flex justify-center'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
            </div>
          )}

          {error && (
            <div className='mt-16 rounded-2xl border border-dashed border-border py-16 text-center text-muted'>
              Failed to load blog post.
            </div>
          )}

          {blog && (
            <article>
              <header className='mt-8'>
                <div className='flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted'>
                  {blog.tags?.map((t) => (
                    <span key={t} className='rounded-full bg-secondary px-3 py-1'>{t}</span>
                  ))}
                </div>
                <h1 className='mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl'>
                  {blog.title}
                </h1>
                <p className='mt-5 text-lg leading-relaxed text-muted'>{blog.excerpt}</p>
                <div className='mt-6 text-sm text-muted'>
                  <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                </div>
              </header>

              {blog.coverImageUrl && (
                <div className='relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl bg-secondary'>
                  <Image
                    src={blog.coverImageUrl}
                    alt={blog.title}
                    fill
                    className='object-cover'
                    sizes='(max-width: 768px) 100vw, 768px'
                    priority
                  />
                </div>
              )}

              <div className='mt-12 space-y-10'>
                {blog.sections?.map((section, idx) => (
                  <section key={idx}>
                    <h2 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
                      {section.title}
                    </h2>
                    {section.imageUrl && (
                      <div className='relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl bg-secondary'>
                        <Image
                          src={section.imageUrl}
                          alt={section.title}
                          fill
                          className='object-cover'
                          sizes='(max-width: 768px) 100vw, 768px'
                        />
                      </div>
                    )}
                    <div className='mt-5 space-y-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/90'>
                      {section.description}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}

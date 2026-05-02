'use client';

import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { apiUrl } from '@/lib/api';
import { Header } from '../components/Header';
import type { IBlog } from '@backend/shared/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BlogsPage() {
  const { data, isLoading } = useSWR<{ data: { items: IBlog[]; total: number } }>(
    `${apiUrl()}/api/blogs?limit=50`,
    fetcher
  );

  const blogs = data?.data?.items || [];
  const featured = blogs[0];
  const rest = blogs.slice(1);

  return (
    <div className='min-h-screen bg-background font-sans'>
      <Header />
      <main>
        {/* Hero */}
        <section className='relative overflow-hidden pt-32 pb-16 sm:pt-40'>
          <div className='absolute inset-0 -z-10 overflow-hidden'>
            <div className='absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-3xl' />
          </div>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5'>
              <span className='text-xs font-semibold uppercase tracking-[0.18em] text-muted'>Blog</span>
            </div>
            <h1 className='mt-5 text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl'>
              Stories, tips <span className='design-text'>&amp;</span> money insights
            </h1>
            <p className='mt-5 max-w-2xl text-base leading-relaxed text-muted lg:text-lg'>
              Guides and updates on smarter expense tracking, receipt scanning, and splitting bills with friends.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className='pb-24'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            {isLoading ? (
              <div className='flex justify-center py-16'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
              </div>
            ) : blogs.length === 0 ? (
              <div className='rounded-3xl border border-dashed border-border py-20 text-center'>
                <p className='text-muted'>No blog posts yet. Check back soon.</p>
              </div>
            ) : (
              <>
                {featured && (
                  <Link
                    href={`/blogs/${featured.slug}`}
                    className='group block overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_25px_50px_-20px_rgba(5,85,241,0.25)]'
                  >
                    <div className='grid gap-0 md:grid-cols-[1.1fr_1fr]'>
                      <div className='relative h-72 overflow-hidden bg-secondary md:h-auto'>
                        {featured.coverImageUrl ? (
                          <Image
                            src={featured.coverImageUrl}
                            alt={featured.title}
                            fill
                            className='object-cover transition-transform duration-700 group-hover:scale-105'
                            sizes='(max-width: 768px) 100vw, 50vw'
                          />
                        ) : (
                          <div className='flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10' />
                        )}
                      </div>
                      <div className='flex flex-col justify-between p-8 sm:p-10'>
                        <div>
                          <div className='flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted'>
                            <span className='rounded-full bg-primary/10 px-3 py-1 text-primary'>Featured</span>
                            {featured.tags?.slice(0, 2).map((t) => (
                              <span key={t} className='rounded-full bg-secondary px-3 py-1'>{t}</span>
                            ))}
                          </div>
                          <h2 className='mt-5 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl'>
                            {featured.title}
                          </h2>
                          <p className='mt-4 text-base leading-relaxed text-muted'>{featured.excerpt}</p>
                        </div>
                        <div className='mt-8 text-sm text-muted'>
                          <span>{formatDate(featured.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {rest.length > 0 && (
                  <div className='mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                    {rest.map((blog) => (
                      <Link
                        key={blog._id}
                        href={`/blogs/${blog.slug}`}
                        className='group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_40px_-20px_rgba(5,85,241,0.25)]'
                      >
                        <div className='relative h-52 overflow-hidden bg-secondary'>
                          {blog.coverImageUrl ? (
                            <Image
                              src={blog.coverImageUrl}
                              alt={blog.title}
                              fill
                              className='object-cover transition-transform duration-700 group-hover:scale-105'
                              sizes='(max-width: 768px) 100vw, 33vw'
                            />
                          ) : (
                            <div className='flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10' />
                          )}
                        </div>
                        <div className='flex flex-1 flex-col p-6'>
                          <div className='flex flex-wrap gap-2 text-xs font-medium text-muted'>
                            {blog.tags?.slice(0, 2).map((t) => (
                              <span key={t} className='rounded-full bg-secondary px-2.5 py-1'>{t}</span>
                            ))}
                          </div>
                          <h3 className='mt-3 text-xl font-semibold leading-snug text-foreground'>{blog.title}</h3>
                          <p className='mt-2 line-clamp-3 text-sm leading-relaxed text-muted'>{blog.excerpt}</p>
                          <div className='mt-5 flex items-center justify-end text-xs text-muted'>
                            <span>{formatDate(blog.publishedAt)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

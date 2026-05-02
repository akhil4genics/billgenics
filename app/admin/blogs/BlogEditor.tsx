'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { apiUrl, authHeaders } from '@/lib/api';
import type { IBlog, IBlogSection } from '@backend/shared/types';

type EditorSection = IBlogSection & { _tempUrl?: string };

interface Props {
  initial?: IBlog;
  mode: 'create' | 'edit';
}

export function BlogEditor({ initial, mode }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [coverImageKey, setCoverImageKey] = useState(initial?.coverImageKey || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl || '');
  const [sections, setSections] = useState<EditorSection[]>(
    initial?.sections?.map((s) => ({ ...s, _tempUrl: s.imageUrl })) || [{ title: '', description: '' }]
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  function updateSection(i: number, patch: Partial<EditorSection>) {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addSection() {
    setSections((prev) => {
      const next = [...prev, { title: '', description: '' }];
      requestAnimationFrame(() => {
        const el = sectionRefs.current[next.length - 1];
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.querySelector<HTMLInputElement>('input[type="text"], input:not([type])')?.focus();
      });
      return next;
    });
  }

  function removeSection(i: number) {
    setSections((prev) => prev.filter((_, idx) => idx !== i));
  }

  function moveSection(i: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const target = i + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  }

  async function handleUpload(file: File, kind: 'cover' | 'section', sectionIndex?: number) {
    const uploadKey = kind === 'cover' ? 'cover' : `section-${sectionIndex}`;
    try {
      setUploading(uploadKey);
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl()}/api/blogs/upload-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contentType: file.type, kind }),
      });
      if (!res.ok) throw new Error('Failed to get upload URL');
      const { data } = await res.json();

      const putRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error('Upload failed');

      const previewUrl = URL.createObjectURL(file);
      if (kind === 'cover') {
        setCoverImageKey(data.key);
        setCoverImageUrl(previewUrl);
      } else if (sectionIndex !== undefined) {
        updateSection(sectionIndex, { imageKey: data.key, _tempUrl: previewUrl });
      }
      toast.success('Image uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  }

  function onCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, 'cover');
  }

  function onSectionImageChange(i: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, 'section', i);
  }

  function buildPayload() {
    return {
      title: title.trim(),
      slug: slug.trim() ? slug.trim() : undefined,
      excerpt: excerpt.trim(),
      coverImageKey: coverImageKey || undefined,
      sections: sections
        .filter((s) => s.title.trim() && s.description.trim())
        .map((s) => ({
          title: s.title.trim(),
          description: s.description,
          imageKey: s.imageKey || undefined,
        })),
      tags: tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    };
  }

  function validate(): string | null {
    if (!title.trim()) return 'Title is required';
    if (!excerpt.trim()) return 'Excerpt is required';
    if (sections.filter((s) => s.title.trim() && s.description.trim()).length === 0) {
      return 'Add at least one section with a title and description';
    }
    return null;
  }

  async function save(options: { publishAfter?: boolean } = {}): Promise<string | null> {
    const err = validate();
    if (err) {
      toast.error(err);
      return null;
    }
    try {
      setSaving(true);
      const headers = await authHeaders();
      const payload = buildPayload();

      let blogId = initial?._id;
      if (mode === 'create') {
        const res = await fetch(`${apiUrl()}/api/blogs`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Create failed');
        const json = await res.json();
        blogId = json.data?._id;
      } else {
        if (!initial?._id) throw new Error('Missing blog id');
        const res = await fetch(`${apiUrl()}/api/blogs/${initial._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Update failed');
      }

      if (options.publishAfter && blogId) {
        setPublishing(true);
        const res = await fetch(`${apiUrl()}/api/blogs/${blogId}/publish`, {
          method: 'POST',
          headers,
        });
        if (!res.ok) throw new Error('Publish failed');
      }

      toast.success(options.publishAfter ? 'Published' : 'Saved');
      return blogId || null;
    } catch (e) {
      console.error(e);
      toast.error('Save failed');
      return null;
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  }

  async function onSaveDraft() {
    const id = await save();
    if (id && mode === 'create') router.push(`/admin/blogs/${id}/edit`);
  }

  async function onPublish() {
    const id = await save({ publishAfter: true });
    if (id) router.push('/admin/blogs');
  }

  return (
    <div className='grid gap-8 lg:grid-cols-[1.4fr_1fr]'>
      {/* Editor */}
      <div className='space-y-6'>
        <div className='rounded-2xl border border-border bg-card p-6'>
          <label className='text-xs font-semibold uppercase tracking-wider text-muted'>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='A catchy blog post title'
            className='mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-lg font-semibold text-foreground focus:border-primary focus:outline-none'
          />

          <label className='mt-5 block text-xs font-semibold uppercase tracking-wider text-muted'>Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder='auto-generated from title if empty'
            className='mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none'
          />

          <label className='mt-5 block text-xs font-semibold uppercase tracking-wider text-muted'>Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder='Short summary shown on the blog list'
            className='mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none'
          />

          <label className='mt-5 block text-xs font-semibold uppercase tracking-wider text-muted'>Tags</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder='comma, separated, tags'
            className='mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none'
          />

          <label className='mt-5 block text-xs font-semibold uppercase tracking-wider text-muted'>Cover image</label>
          <div className='mt-2 flex items-start gap-4'>
            <label className='inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-sm text-muted hover:bg-secondary'>
              <input type='file' accept='image/*' className='hidden' onChange={onCoverChange} />
              {uploading === 'cover' ? 'Uploading...' : coverImageKey ? 'Replace image' : 'Upload image'}
            </label>
            {coverImageUrl && (
              <div className='relative h-24 w-40 overflow-hidden rounded-lg border border-border bg-secondary'>
                <Image src={coverImageUrl} alt='Cover' fill className='object-cover' sizes='160px' />
              </div>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className='rounded-2xl border border-border bg-card p-6'>
          <h2 className='text-lg font-semibold text-foreground'>Sections</h2>

          <div className='mt-5 space-y-6'>
            {sections.map((section, i) => {
              const uploadKey = `section-${i}`;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    sectionRefs.current[i] = el;
                  }}
                  className='rounded-xl border border-border bg-background p-5'
                >
                  <div className='flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted'>
                    <span>Section {i + 1}</span>
                    <div className='flex gap-2'>
                      <button type='button' onClick={() => moveSection(i, -1)} disabled={i === 0} className='rounded-md px-2 py-1 disabled:opacity-40 hover:bg-secondary'>↑</button>
                      <button type='button' onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} className='rounded-md px-2 py-1 disabled:opacity-40 hover:bg-secondary'>↓</button>
                      <button type='button' onClick={() => removeSection(i)} className='rounded-md px-2 py-1 text-red-600 hover:bg-red-500/10'>Remove</button>
                    </div>
                  </div>
                  <input
                    value={section.title}
                    onChange={(e) => updateSection(i, { title: e.target.value })}
                    placeholder='Section title'
                    className='mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-base font-semibold text-foreground focus:border-primary focus:outline-none'
                  />
                  <textarea
                    value={section.description}
                    onChange={(e) => updateSection(i, { description: e.target.value })}
                    rows={5}
                    placeholder='Section description. Line breaks are preserved.'
                    className='mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none'
                  />
                  <div className='mt-3 flex items-start gap-4'>
                    <label className='inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-card px-3 py-2 text-xs text-muted hover:bg-secondary'>
                      <input type='file' accept='image/*' className='hidden' onChange={(e) => onSectionImageChange(i, e)} />
                      {uploading === uploadKey ? 'Uploading...' : section.imageKey ? 'Replace image' : 'Add optional image'}
                    </label>
                    {section._tempUrl && (
                      <div className='relative h-20 w-32 overflow-hidden rounded-md border border-border bg-secondary'>
                        <Image src={section._tempUrl} alt='Section' fill className='object-cover' sizes='128px' />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type='button'
            onClick={addSection}
            className='mt-6 w-full rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5'
          >
            + Add section
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className='space-y-4 lg:sticky lg:top-28 lg:self-start'>
        <div className='rounded-2xl border border-border bg-card p-6'>
          <h3 className='text-sm font-semibold uppercase tracking-wider text-muted'>Publishing</h3>
          <p className='mt-2 text-xs text-muted'>
            Draft posts stay hidden from the public blog. Publish to make this post visible at
            <code className='ml-1 rounded bg-secondary px-1 py-0.5 text-[11px]'>/blogs/{slug || 'slug'}</code>.
          </p>
          <div className='mt-4 flex flex-col gap-2'>
            <button
              type='button'
              onClick={onSaveDraft}
              disabled={saving || publishing}
              className='rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50'
            >
              {saving && !publishing ? 'Saving...' : 'Save draft'}
            </button>
            <button
              type='button'
              onClick={onPublish}
              disabled={saving || publishing}
              className='rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50'
            >
              {publishing ? 'Publishing...' : 'Save & Publish'}
            </button>
          </div>
          {initial?.status && (
            <p className='mt-4 text-xs text-muted'>
              Current status: <span className='font-semibold text-foreground'>{initial.status}</span>
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

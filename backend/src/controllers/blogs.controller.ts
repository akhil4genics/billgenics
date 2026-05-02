import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Blog, { EBlogStatus } from '../models/Blog';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { getPresignedUrl, getPresignedUploadUrl } from '../lib/s3';

const sectionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  imageKey: z.string().optional(),
});

const blogSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens').optional(),
  excerpt: z.string().min(1).max(500),
  coverImageKey: z.string().optional(),
  sections: z.array(sectionSchema).default([]),
  tags: z.array(z.string()).default([]),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

async function buildUniqueSlug(desired: string, ignoreId?: string): Promise<string> {
  let base = slugify(desired) || 'post';
  let candidate = base;
  let suffix = 2;
  while (true) {
    const existing = await Blog.findOne({ slug: candidate }).select('_id').lean();
    if (!existing || (ignoreId && existing._id.toString() === ignoreId)) return candidate;
    candidate = `${base}-${suffix++}`;
    if (suffix > 100) {
      return `${base}-${Date.now()}`;
    }
  }
}

async function attachPresignedUrls(blog: Record<string, unknown>): Promise<Record<string, unknown>> {
  const out = { ...blog };
  if (typeof out.coverImageKey === 'string' && out.coverImageKey) {
    try {
      out.coverImageUrl = await getPresignedUrl(out.coverImageKey);
    } catch (e) {
      console.error('Failed to presign cover image', e);
    }
  }
  if (Array.isArray(out.sections)) {
    out.sections = await Promise.all(
      out.sections.map(async (s) => {
        const section = { ...(s as Record<string, unknown>) };
        if (typeof section.imageKey === 'string' && section.imageKey) {
          try {
            section.imageUrl = await getPresignedUrl(section.imageKey as string);
          } catch (e) {
            console.error('Failed to presign section image', e);
          }
        }
        return section;
      })
    );
  }
  return out;
}

// GET /api/blogs  (public: returns only published; admin can pass ?status=all)
export async function listBlogs(req: Request, res: Response): Promise<void> {
  try {
    const { q, tag, status } = req.query;
    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);
    const skip = parseInt((req.query.skip as string) || '0', 10);

    const query: Record<string, unknown> = {};

    // Only admins can request drafts
    const authReq = req as AuthRequest;
    const requestingAdmin = authReq.user?.id
      ? await User.findById(authReq.user.id).select('adminUser').lean()
      : null;
    const isAdmin = requestingAdmin?.adminUser === true;

    if (status === 'all' && isAdmin) {
      // no status filter
    } else if (status === 'draft' && isAdmin) {
      query.status = EBlogStatus.DRAFT;
    } else {
      query.status = EBlogStatus.PUBLISHED;
    }

    if (tag && typeof tag === 'string') {
      query.tags = tag.toLowerCase();
    }
    if (q && typeof q === 'string') {
      query.$text = { $search: q };
    }

    const [items, total] = await Promise.all([
      Blog.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    const withUrls = await Promise.all(items.map((b) => attachPresignedUrls(b as Record<string, unknown>)));

    res.json({ success: true, data: { items: withUrls, total, skip, limit } });
  } catch (error) {
    console.error('Error listing blogs:', error);
    res.status(500).json({ error: 'Failed to list blogs' });
  }
}

// GET /api/blogs/:slug
export async function getBlogBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug: slug.toLowerCase() }).lean();
    if (!blog) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }

    if (blog.status !== EBlogStatus.PUBLISHED) {
      // Only admins can view drafts
      const authReq = req as AuthRequest;
      const requestingAdmin = authReq.user?.id
        ? await User.findById(authReq.user.id).select('adminUser').lean()
        : null;
      if (requestingAdmin?.adminUser !== true) {
        res.status(404).json({ error: 'Blog not found' });
        return;
      }
    }

    const withUrls = await attachPresignedUrls(blog as Record<string, unknown>);
    res.json({ success: true, data: withUrls });
  } catch (error) {
    console.error('Error getting blog:', error);
    res.status(500).json({ error: 'Failed to get blog' });
  }
}

// GET /api/blogs/admin/:blogId  (admin edit — fetch by id)
export async function getBlogForAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findById(blogId).lean();
    if (!blog) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }
    const withUrls = await attachPresignedUrls(blog as Record<string, unknown>);
    res.json({ success: true, data: withUrls });
  } catch (error) {
    console.error('Error getting blog:', error);
    res.status(500).json({ error: 'Failed to get blog' });
  }
}

// POST /api/blogs  (admin)
export async function createBlog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const parsed = blogSchema.parse(req.body);
    const author = await User.findById(userId).select('name').lean();
    if (!author) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const slug = await buildUniqueSlug(parsed.slug || parsed.title);

    const blog = await Blog.create({
      ...parsed,
      slug,
      author: { userId: new mongoose.Types.ObjectId(userId), name: author.name },
      status: EBlogStatus.DRAFT,
    });

    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
}

// PUT /api/blogs/:blogId  (admin)
export async function updateBlog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { blogId } = req.params;
    const parsed = blogSchema.partial().parse(req.body);

    const existing = await Blog.findById(blogId);
    if (!existing) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }

    if (parsed.slug && parsed.slug !== existing.slug) {
      existing.slug = await buildUniqueSlug(parsed.slug, blogId);
    } else if (parsed.title && !parsed.slug && existing.status === EBlogStatus.DRAFT) {
      // Auto-regenerate slug from title while still in draft
      existing.slug = await buildUniqueSlug(parsed.title, blogId);
    }

    if (parsed.title !== undefined) existing.title = parsed.title;
    if (parsed.excerpt !== undefined) existing.excerpt = parsed.excerpt;
    if (parsed.coverImageKey !== undefined) existing.coverImageKey = parsed.coverImageKey;
    if (parsed.sections !== undefined) existing.sections = parsed.sections;
    if (parsed.tags !== undefined) existing.tags = parsed.tags;

    await existing.save();
    res.json({ success: true, data: existing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
}

// POST /api/blogs/:blogId/publish  (admin)
export async function publishBlog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findById(blogId);
    if (!blog) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }
    blog.status = EBlogStatus.PUBLISHED;
    if (!blog.publishedAt) blog.publishedAt = new Date();
    await blog.save();
    res.json({ success: true, data: blog });
  } catch (error) {
    console.error('Error publishing blog:', error);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
}

// POST /api/blogs/:blogId/unpublish  (admin)
export async function unpublishBlog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findById(blogId);
    if (!blog) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }
    blog.status = EBlogStatus.DRAFT;
    await blog.save();
    res.json({ success: true, data: blog });
  } catch (error) {
    console.error('Error unpublishing blog:', error);
    res.status(500).json({ error: 'Failed to unpublish blog' });
  }
}

// DELETE /api/blogs/:blogId  (admin)
export async function deleteBlog(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findByIdAndDelete(blogId);
    if (!blog) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
}

// POST /api/blogs/upload-url  (admin) — get a presigned PUT URL for a blog image
export async function getBlogUploadUrl(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { contentType, kind } = req.body as { contentType?: string; kind?: 'cover' | 'section' };
    if (!contentType || !contentType.startsWith('image/')) {
      res.status(400).json({ error: 'Invalid contentType — must be an image' });
      return;
    }
    const ext = contentType.split('/')[1]?.split('+')[0] || 'jpg';
    const key = `blogs/${kind || 'section'}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    res.json({ success: true, data: { key, uploadUrl } });
  } catch (error) {
    console.error('Error generating blog upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}

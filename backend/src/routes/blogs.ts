import { Router } from 'express';
import { requireAuth, requireAdmin, validateObjectId } from '../middleware/auth';
import {
  listBlogs,
  getBlogBySlug,
  getBlogForAdmin,
  createBlog,
  updateBlog,
  publishBlog,
  unpublishBlog,
  deleteBlog,
  getBlogUploadUrl,
} from '../controllers/blogs.controller';

const router = Router();

// Public reads
router.get('/', listBlogs);
router.get('/slug/:slug', getBlogBySlug);

// Admin-only
router.post('/upload-url', requireAuth, requireAdmin, getBlogUploadUrl);
router.post('/', requireAuth, requireAdmin, createBlog);
router.get('/admin/:blogId', requireAuth, requireAdmin, validateObjectId('blogId'), getBlogForAdmin);
router.put('/:blogId', requireAuth, requireAdmin, validateObjectId('blogId'), updateBlog);
router.post('/:blogId/publish', requireAuth, requireAdmin, validateObjectId('blogId'), publishBlog);
router.post('/:blogId/unpublish', requireAuth, requireAdmin, validateObjectId('blogId'), unpublishBlog);
router.delete('/:blogId', requireAuth, requireAdmin, validateObjectId('blogId'), deleteBlog);

export default router;

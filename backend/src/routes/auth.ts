import { Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter';
import {
  login,
  checkCredentials,
  register,
  verifyEmail,
  completeAccount,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';

const router = Router();

// Strict rate limits for sensitive auth endpoints
const authLimiter = rateLimiter(10, 15 * 60 * 1000); // 10 requests per 15 minutes
const registerLimiter = rateLimiter(5, 60 * 60 * 1000); // 5 requests per hour

router.post('/login', authLimiter, login);
router.post('/check-credentials', authLimiter, checkCredentials);
router.post('/register', registerLimiter, register);
router.get('/verify', verifyEmail);
router.post('/complete-account', authLimiter, completeAccount);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;

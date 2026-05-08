import { Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';
import {
  login,
  checkCredentials,
  register,
  verifyEmail,
  verifyEmailJson,
  verifyLoginChallengeEndpoint,
  completeAccount,
  forgotPassword,
  resetPassword,
  getSessions,
} from '../controllers/auth.controller';

const router = Router();

// Strict rate limits for sensitive auth endpoints
const authLimiter = rateLimiter(10, 15 * 60 * 1000); // 10 requests per 15 minutes
const registerLimiter = rateLimiter(5, 60 * 60 * 1000); // 5 requests per hour
const challengeLimiter = rateLimiter(20, 15 * 60 * 1000); // 20 attempts / 15 min — bcrypt verify is the real bottleneck

router.post('/login', authLimiter, login);
router.post('/check-credentials', authLimiter, checkCredentials);
router.post('/verify-login-challenge', challengeLimiter, verifyLoginChallengeEndpoint);
router.post('/register', registerLimiter, register);
router.get('/verify', verifyEmail);
router.post('/verify', authLimiter, verifyEmailJson);
router.post('/complete-account', authLimiter, completeAccount);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/sessions', requireAuth, getSessions);

export default router;

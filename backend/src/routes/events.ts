import { Router } from 'express';
import { requireAuth, validateObjectId } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import {
  listEvents,
  createEvent,
  getEvent,
  addExpense,
  updateExpense,
  deleteExpense,
  inviteMember,
  getBalances,
  settleBalance,
  getEventByInviteCode,
  joinEventByInviteCode,
  generateInviteLink,
  updateEventStatus,
} from '../controllers/events.controller';

const router = Router();

// Public routes (must come BEFORE the auth middleware below)
router.get('/join/:code', getEventByInviteCode);

// All routes below require authentication
router.use(requireAuth);

router.post('/join/:code', joinEventByInviteCode);
router.get('/', listEvents);
router.post('/', createEvent);
router.get('/:eventId', validateObjectId('eventId'), getEvent);
router.post('/:eventId/expenses', validateObjectId('eventId'), addExpense);
router.put('/:eventId/expenses/:expenseId', validateObjectId('eventId'), updateExpense);
router.delete('/:eventId/expenses/:expenseId', validateObjectId('eventId'), deleteExpense);
// Email invites can be abused for spam — rate-limit aggressively per IP.
const inviteLimiter = rateLimiter(20, 60 * 60 * 1000); // 20/hr per IP
router.post('/:eventId/invite', inviteLimiter, validateObjectId('eventId'), inviteMember);
router.post('/:eventId/invite-link', validateObjectId('eventId'), generateInviteLink);
router.get('/:eventId/balances', validateObjectId('eventId'), getBalances);
router.post('/:eventId/settle', validateObjectId('eventId'), settleBalance);
router.patch('/:eventId/status', validateObjectId('eventId'), updateEventStatus);

export default router;

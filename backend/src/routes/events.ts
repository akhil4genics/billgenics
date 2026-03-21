import { Router } from 'express';
import { requireAuth, validateObjectId } from '../middleware/auth';
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
} from '../controllers/events.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listEvents);
router.post('/', createEvent);
router.get('/:eventId', validateObjectId('eventId'), getEvent);
router.post('/:eventId/expenses', validateObjectId('eventId'), addExpense);
router.put('/:eventId/expenses/:expenseId', validateObjectId('eventId'), updateExpense);
router.delete('/:eventId/expenses/:expenseId', validateObjectId('eventId'), deleteExpense);
router.post('/:eventId/invite', validateObjectId('eventId'), inviteMember);
router.get('/:eventId/balances', validateObjectId('eventId'), getBalances);
router.post('/:eventId/settle', validateObjectId('eventId'), settleBalance);

export default router;

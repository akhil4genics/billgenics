import { Router } from 'express';
import { requireAuth, validateObjectId } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import {
  listRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  markPaid,
  forecast,
  suggestions,
  sync,
  dismissSuggestion,
  restoreSuggestions,
} from '../controllers/recurring.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listRecurring);
router.post('/', createRecurring);
router.get('/forecast', forecast);
router.get('/suggestions', suggestions);
router.post('/suggestions/dismiss', dismissSuggestion);
router.post('/suggestions/restore', restoreSuggestions);
// Sync runs on every dashboard mount — generous but capped to stop abuse.
const syncLimiter = rateLimiter(60, 60 * 60 * 1000); // 60/hr per IP
router.post('/sync', syncLimiter, sync);
router.put('/:id', validateObjectId('id'), updateRecurring);
router.delete('/:id', validateObjectId('id'), deleteRecurring);
router.post('/:id/mark-paid', validateObjectId('id'), markPaid);

export default router;

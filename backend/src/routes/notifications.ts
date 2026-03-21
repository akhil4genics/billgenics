import { Router } from 'express';
import { requireAuth, validateObjectId } from '../middleware/auth';
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notifications.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listNotifications);
router.patch('/:notificationId/read', validateObjectId('notificationId'), markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;

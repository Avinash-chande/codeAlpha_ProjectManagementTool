import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all notification routes
router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/read-all')
  .patch(markAllNotificationsAsRead);

router.route('/:id/read')
  .patch(markNotificationAsRead);

router.route('/:id')
  .delete(deleteNotification);

export default router;

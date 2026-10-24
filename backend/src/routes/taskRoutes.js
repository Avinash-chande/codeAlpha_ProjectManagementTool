import { Router } from 'express';
import { updateTask, deleteTask } from '../controllers/projectController.js';
import { createComment, getComments } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.route('/:id')
  .patch(updateTask)
  .delete(deleteTask);

// Task comments
router.route('/:taskId/comments')
  .get(getComments)
  .post(createComment);

export default router;

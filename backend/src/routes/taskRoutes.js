import { Router } from 'express';
import { updateTask, deleteTask } from '../controllers/projectController.js';
import { createComment, getComments } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

// Task comments
router.route('/:taskId/comments')
  .get(getComments)
  .post(createComment);

router.route('/:id')
  .patch(updateTask)
  .delete(deleteTask);

export default router;

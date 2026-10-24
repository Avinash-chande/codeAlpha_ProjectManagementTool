import { Router } from 'express';
import { deleteComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

// DELETE /api/comments/:commentId
router.route('/:commentId')
  .delete(deleteComment);

export default router;

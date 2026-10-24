import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  createTask,
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// All project routes are protected by JWT authentication
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

// Project Membership Management (Owner only)
router.route('/:id/members')
  .post(addProjectMember);

router.route('/:id/members/:memberId')
  .delete(removeProjectMember);

// Tasks in project
router.route('/:id/tasks')
  .post(createTask);

export default router;

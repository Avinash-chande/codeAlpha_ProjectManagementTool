import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import userRoutes from './userRoutes.js';
import commentRoutes from './commentRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const apiRouter = Router();

// Mount feature routers
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/comments', commentRoutes);
apiRouter.use('/notifications', notificationRoutes);

// Base route for API discovery
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'CodeAlpha Project Management Tool API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      projects: {
        list: 'GET /api/projects',
        create: 'POST /api/projects',
        get: 'GET /api/projects/:id',
        update: 'PUT /api/projects/:id',
        delete: 'DELETE /api/projects/:id',
        addMember: 'POST /api/projects/:id/members',
        removeMember: 'DELETE /api/projects/:id/members/:memberId',
        createTask: 'POST /api/projects/:id/tasks',
      },
      tasks: {
        update: 'PATCH /api/tasks/:id',
        delete: 'DELETE /api/tasks/:id',
        comments: {
          list: 'GET /api/tasks/:taskId/comments',
          create: 'POST /api/tasks/:taskId/comments',
        },
      },
      comments: {
        delete: 'DELETE /api/comments/:commentId',
      },
      users: {
        list: 'GET /api/users',
      },
    },
  });
});

export default apiRouter;

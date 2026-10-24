import { Router } from 'express';
import healthRoutes from './healthRoutes.js';

const apiRouter = Router();

// Mount feature routers
apiRouter.use('/health', healthRoutes);

// Base route for API discovery
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'CodeAlpha Project Management Tool API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      healthCheck: '/api/health',
      ping: '/api/health/ping',
    },
  });
});

export default apiRouter;

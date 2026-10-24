import { Router } from 'express';
import { getHealth, getPing } from '../controllers/healthController.js';

const router = Router();

// GET /api/health
router.get('/', getHealth);

// GET /api/health/ping
router.get('/ping', getPing);

export default router;

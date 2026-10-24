import { getDbStatus } from '../config/db.js';
import { env } from '../config/env.js';

export const checkHealth = () => {
  const dbStatus = getDbStatus();
  const uptimeSeconds = Math.floor(process.uptime());

  return {
    status: dbStatus.isConnected ? 'healthy' : 'degraded',
    service: 'CodeAlpha Project Management API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      formatted: `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`,
    },
    database: {
      provider: 'MongoDB',
      ...dbStatus,
    },
    system: {
      nodeVersion: process.version,
      memoryUsage: {
        rssMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      },
    },
  };
};

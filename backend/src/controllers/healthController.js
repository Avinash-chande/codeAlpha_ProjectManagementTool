import { checkHealth } from '../services/healthService.js';

export const getHealth = (req, res, next) => {
  try {
    const health = checkHealth();
    const httpStatus = health.database.isConnected ? 200 : 503;
    res.status(httpStatus).json({
      success: health.database.isConnected,
      data: health,
    });
  } catch (error) {
    next(error);
  }
};

export const getPing = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
};

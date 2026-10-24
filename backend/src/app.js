import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));

// app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check alias
app.get('/health', (req, res) => {
  res.redirect('/api/health');
});

// Primary API Router
app.use('/api', apiRouter);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CodeAlpha Project Management Tool Backend API',
    status: 'Running',
    phase: 'Phase 1 - Project Setup & Architecture',
    healthCheck: '/api/health',
  });
});

// 404 and Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

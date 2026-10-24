import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  try {
    // Attempt MongoDB connection
    console.log(`[Server] Connecting to MongoDB at ${env.MONGODB_URI}...`);
    await connectDB();
  } catch (error) {
    console.error(`[Server] Warning: Database connection failed. API starting in degraded state: ${error.message}`);
  }

  // Start HTTP listener
  const server = app.listen(env.PORT, () => {
    console.log(`[Server] Server successfully started!`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
    console.log(`[Server] Listening on: http://localhost:${env.PORT}`);
    console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown handling
  const handleShutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.once('SIGUSR2', () => {
    server.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  });
};

startServer();

import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocket } from './socket.js';

let isStarting = false;
let activeHttpServer = null;

const startServer = async () => {
  // Prevent duplicate execution if server is already starting or running
  if (isStarting || (activeHttpServer && activeHttpServer.listening)) {
    console.log('[Server] Startup already in progress or server is already listening. Skipping duplicate call.');
    return activeHttpServer;
  }
  isStarting = true;

  try {
    // 1. Establish MongoDB connection (with retry/graceful degraded mode)
    console.log(`[Server] Connecting to MongoDB at ${env.MONGODB_URI}...`);
    await connectDB();
  } catch (error) {
    console.error(`[Server] Warning: Database connection failed. API starting in degraded state: ${error.message}`);
  }

  // 2. Create a SINGLE native HTTP server instance wrapping Express
  const httpServer = http.createServer(app);

  // 3. Attach Socket.IO to the exact same HTTP server instance
  initSocket(httpServer);
  console.log('[Server] Socket.IO initialized on shared HTTP server');

  // 4. Attach proper error handler for EADDRINUSE and server-level errors
  httpServer.on('error', (err) => {
    isStarting = false;
    if (err.code === 'EADDRINUSE') {
      console.error(`\n======================================================`);
      console.error(`[Server Error] Port ${env.PORT} is already in use (EADDRINUSE).`);
      console.error(`[Server Error] Another backend instance is currently bound to port ${env.PORT}.`);
      console.error(`[Server Error] Please stop any duplicate 'npm run dev' terminals.`);
      console.error(`======================================================\n`);
      process.exit(1);
    } else {
      console.error('[Server Error] Unexpected server error:', err);
      process.exit(1);
    }
  });

  // 5. Start listening on configured port (default 5000)
  activeHttpServer = httpServer.listen(env.PORT, () => {
    isStarting = false;
    console.log(`[Server] Server successfully started!`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
    console.log(`[Server] Listening on: http://localhost:${env.PORT}`);
    console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
  });

  // 6. Graceful shutdown handler
  const handleShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    try {
      if (activeHttpServer && activeHttpServer.listening) {
        await new Promise((resolve) => activeHttpServer.close(resolve));
        console.log('[Server] HTTP listener closed and port released.');
      }
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('[Server] MongoDB connection closed.');
      }
    } catch (shutdownErr) {
      console.error('[Server] Error during graceful shutdown:', shutdownErr.message);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  // Nodemon restart signal handling (ensures port is closed before nodemon spawns new process)
  process.once('SIGUSR2', async () => {
    if (activeHttpServer && activeHttpServer.listening) {
      activeHttpServer.close(() => {
        process.kill(process.pid, 'SIGUSR2');
      });
    } else {
      process.kill(process.pid, 'SIGUSR2');
    }
  });

  return activeHttpServer;
};

// Start the server
startServer();

export default startServer;

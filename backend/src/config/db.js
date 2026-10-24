import mongoose from 'mongoose';
import { env } from './env.js';

const connectionStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial connection error: ${error.message}`);
    // In production we might exit, but during setup or health inspection we allow server to report DB state
    throw error;
  }
};

// Event listeners for connection monitoring
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Mongoose disconnected from database.');
});

export const getDbStatus = () => {
  const stateCode = mongoose.connection.readyState;
  return {
    state: connectionStates[stateCode] || 'unknown',
    readyState: stateCode,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    isConnected: stateCode === 1,
  };
};

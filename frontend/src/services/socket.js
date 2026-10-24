import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;

/**
 * Connect to Socket.IO server and join user's private notification room
 * @param {string} userId
 */
export const connectSocket = (userId) => {
  if (socket && socket.connected) {
    if (userId) {
      socket.emit('join_user', userId);
    }
    return socket;
  }

  socket = io(SOCKET_SERVER_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    if (userId) {
      socket.emit('join_user', userId);
    }
  });

  socket.on('reconnect', () => {
    if (userId) {
      socket.emit('join_user', userId);
    }
  });

  return socket;
};

/**
 * Get active socket instance
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket on logout
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join project room for live board updates
 * @param {string} projectId
 */
export const joinProjectRoom = (projectId) => {
  if (socket && projectId) {
    socket.emit('join_project', projectId);
  }
};

/**
 * Leave project room
 * @param {string} projectId
 */
export const leaveProjectRoom = (projectId) => {
  if (socket && projectId) {
    socket.emit('leave_project', projectId);
  }
};

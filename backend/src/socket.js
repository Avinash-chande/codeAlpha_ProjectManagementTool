import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.IO with HTTP Server
 * @param {import('http').Server} httpServer
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
      ],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    // User joins their personal room for private notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Also support 'join' shorthand
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // User joins project room for live collaborative task/board updates
    socket.on('join_project', (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on('leave_project', (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      // Socket automatically leaves rooms upon disconnect
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
  return io;
};

/**
 * Send real-time notification to a specific user
 * @param {string} userId
 * @param {object} notification
 */
export const sendNotificationToUser = (userId, notification) => {
  if (!io || !userId) return;
  const targetId = userId.toString();
  io.to(`user:${targetId}`).emit('notification', notification);
};

/**
 * Broadcast an event to everyone currently viewing a project
 * @param {string} projectId
 * @param {string} event
 * @param {object} data
 */
export const broadcastToProject = (projectId, event, data) => {
  if (!io || !projectId) return;
  const targetId = projectId.toString();
  io.to(`project:${targetId}`).emit(event, data);
};

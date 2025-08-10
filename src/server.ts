import { createServer as createHttpServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import app from './app.js';
import { setupChatSockets } from './sockets/chat.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';

const server = createHttpServer(app);

// Configure Socket.IO with CORS
const io = new SocketServer(server, {
  cors: {
    origin: process.env['CORS_ORIGIN'] || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Setup chat sockets
setupChatSockets(io);

const port = config.PORT;

// Graceful shutdown
const gracefulShutdown = (signal: string): void => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed');

    io.close(() => {
      logger.info('Socket.IO server closed');
      process.exit(0);
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    server.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`, {
        environment: config.NODE_ENV,
        port,
        timestamp: new Date().toISOString(),
      });

      logger.info('📡 Socket.IO server ready for connections');

      if (config.NODE_ENV === 'development') {
        logger.info(`🔗 Server URL: http://localhost:${port}`);
        logger.info(`🔗 Socket.IO URL: ws://localhost:${port}`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { server, io, app };

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { logger, logStream } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
// import userRoutes from './routes/user.routes.js';
// import conversationRoutes from './routes/conversation.routes.js';
// import messageRoutes from './routes/message.routes.js';

const app: Express = express();

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      config.NODE_ENV === 'production'
        ? process.env['CORS_ORIGIN']?.split(',') || false
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Request logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: logStream }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiRateLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: '2.0.0',
  });
});

// API routes
app.use('/api/v1', authRoutes);
// app.use('/api/v1', userRoutes);
// app.use('/api/v1', conversationRoutes);
// app.use('/api/v1', messageRoutes);

// API documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'ProChat Enterprise API',
    version: '2.0.0',
    description: 'Enterprise-grade real-time chat application backend',
    documentation: '/api/docs',
    health: '/health',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      conversations: '/api/v1/conversations',
      messages: '/api/v1/messages',
    },
    websocket: {
      endpoint: '/socket.io',
      events: [
        'send_message',
        'join_conversation',
        'leave_conversation',
        'start_typing',
        'stop_typing',
        'mark_messages_read',
      ],
    },
  });
});

// Catch-all route handler
app.use('*', notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Log startup
logger.info('Express app initialized', {
  environment: config.NODE_ENV,
  cors: config.NODE_ENV === 'production' ? 'production' : 'development',
});

export default app;

import { Router } from 'express';
import env from '../helpers/env.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json({
    success: true,
    message: 'Enterprise Chat Application API',
    data: {
      appName: env.APP_NAME,
      appVersion: env.APP_VERSION,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
  });
});

router.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/env.js';
import { createErrorResponse } from '@/utils/helpers.js';
import { logger } from '@/config/logger.js';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS, // Limit each IP to 100 requests per windowMs
  message: createErrorResponse('Too many requests from this IP, please try again later'),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      url: req.url,
      method: req.method,
    });

    res
      .status(429)
      .json(createErrorResponse('Too many requests from this IP, please try again later'));
  },
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: createErrorResponse('Too many authentication attempts, please try again later'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      url: req.url,
      method: req.method,
    });

    res
      .status(429)
      .json(createErrorResponse('Too many authentication attempts, please try again later'));
  },
});

// Rate limiter for password reset
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: createErrorResponse('Too many password reset attempts, please try again later'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      email: req.body.email,
    });

    res
      .status(429)
      .json(createErrorResponse('Too many password reset attempts, please try again later'));
  },
});

// Rate limiter for message sending
export const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each user to 30 messages per minute
  message: createErrorResponse('Too many messages sent, please slow down'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID instead of IP for authenticated users
    const authReq = req as any;
    return authReq.user?.id?.toString() || req.ip;
  },
  handler: (req: Request, res: Response) => {
    const authReq = req as any;
    logger.warn(`Message rate limit exceeded`, {
      userId: authReq.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(429).json(createErrorResponse('Too many messages sent, please slow down'));
  },
});

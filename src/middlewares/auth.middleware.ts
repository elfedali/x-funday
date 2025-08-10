import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtUser } from '../types/index.js';
import { logger } from '../config/logger.js';
import env from '../helpers/env.js';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.split(' ')[1]; // Expected format: "Bearer <token>"

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token format invalid',
      });
      return;
    }

    jwt.verify(token, env.JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        logger.warn(`Invalid token attempt from IP: ${req.ip}`);
        res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
        });
        return;
      }

      // Attach user info to the request object
      req.user = decoded as JwtUser;
      next();
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

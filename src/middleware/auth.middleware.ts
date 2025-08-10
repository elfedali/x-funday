import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { AuthenticatedRequest, JwtUser } from '../types/index.js';
import { createErrorResponse, AppError } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json(createErrorResponse('No token provided'));
      return;
    }

    const token = authHeader.split(' ')[1]; // Expected format: "Bearer <token>"

    if (!token) {
      res.status(401).json(createErrorResponse('Invalid token format'));
      return;
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn(`Invalid token attempt: ${err.message}`, {
          token: token.substring(0, 10) + '...',
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });

        res.status(403).json(createErrorResponse('Invalid or expired token'));
        return;
      }

      req.user = decoded as JwtUser;
      next();
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json(createErrorResponse('Authentication error'));
  }
};

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.user = decoded as JwtUser;
      }
      next();
    });
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json(createErrorResponse('Authentication required'));
    return;
  }

  if (!req.user.is_admin) {
    res.status(403).json(createErrorResponse('Admin access required'));
    return;
  }

  next();
};

export const socketAuthMiddleware = (socket: any, next: (err?: any) => void): void => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    jwt.verify(token, config.JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        logger.warn(`Socket auth failed: ${err.message}`, {
          socketId: socket.id,
          ip: socket.handshake.address,
        });
        return next(new Error('Invalid token'));
      }

      socket.user = decoded as JwtUser;
      next();
    });
  } catch (error) {
    logger.error('Socket auth middleware error:', error);
    next(new Error('Authentication error'));
  }
};

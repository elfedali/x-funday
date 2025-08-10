import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../config/logger.js';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error:', errorDetails);

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails,
      });
      return;
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Query validation error:', errorDetails);

      res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: errorDetails,
      });
      return;
    }

    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Params validation error:', errorDetails);

      res.status(400).json({
        success: false,
        message: 'Parameters validation failed',
        errors: errorDetails,
      });
      return;
    }

    next();
  };
};

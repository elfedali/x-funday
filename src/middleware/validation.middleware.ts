import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { createErrorResponse, AppError } from '@/utils/helpers.js';
import { validateRequest } from '@/utils/validation.js';
import { logger } from '@/config/logger.js';

export const validationMiddleware = (
  schema: ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[property];
      const validationErrors = validateRequest(schema, dataToValidate);

      if (validationErrors.length > 0) {
        logger.warn('Validation failed', {
          errors: validationErrors,
          url: req.url,
          method: req.method,
          ip: req.ip,
        });

        const errorMessages = validationErrors.map(error => error.message);
        res.status(400).json(createErrorResponse('Validation failed', errorMessages));
        return;
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json(createErrorResponse('Validation error'));
    }
  };
};

import Joi from 'joi';

export const updateUserValidation = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
  }),

  bio: Joi.string().max(500).optional().messages({
    'string.max': 'Bio must not exceed 500 characters',
  }),

  avatar: Joi.string().uri().optional().messages({
    'string.uri': 'Avatar must be a valid URL',
  }),
});

export const userSearchValidation = Joi.object({
  search: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character long',
    'string.max': 'Search term must not exceed 100 characters',
  }),

  limit: Joi.number().integer().min(1).max(50).default(10).optional().messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 50',
  }),

  offset: Joi.number().integer().min(0).default(0).optional().messages({
    'number.integer': 'Offset must be an integer',
    'number.min': 'Offset must be at least 0',
  }),
});

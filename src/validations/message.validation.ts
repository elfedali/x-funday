import Joi from 'joi';
import { MessageType } from '../types/index.js';

export const createMessageValidation = Joi.object({
  conversationId: Joi.number().integer().positive().required().messages({
    'number.integer': 'Conversation ID must be an integer',
    'number.positive': 'Conversation ID must be positive',
    'any.required': 'Conversation ID is required',
  }),

  content: Joi.string().min(1).max(2000).required().messages({
    'string.min': 'Message content cannot be empty',
    'string.max': 'Message content must not exceed 2000 characters',
    'any.required': 'Message content is required',
  }),

  type: Joi.string()
    .valid(...Object.values(MessageType))
    .default(MessageType.TEXT)
    .optional()
    .messages({
      'any.only': `Message type must be one of: ${Object.values(MessageType).join(', ')}`,
    }),

  replyToId: Joi.number().integer().positive().optional().messages({
    'number.integer': 'Reply to ID must be an integer',
    'number.positive': 'Reply to ID must be positive',
  }),
});

export const updateMessageValidation = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    'string.min': 'Message content cannot be empty',
    'string.max': 'Message content must not exceed 2000 characters',
    'any.required': 'Message content is required',
  }),
});

export const messageQueryValidation = Joi.object({
  search: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character long',
    'string.max': 'Search term must not exceed 100 characters',
  }),

  conversationId: Joi.number().integer().positive().optional().messages({
    'number.integer': 'Conversation ID must be an integer',
    'number.positive': 'Conversation ID must be positive',
  }),

  limit: Joi.number().integer().min(1).max(100).default(50).optional().messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),

  offset: Joi.number().integer().min(0).default(0).optional().messages({
    'number.integer': 'Offset must be an integer',
    'number.min': 'Offset must be at least 0',
  }),

  before: Joi.date().optional().messages({
    'date.base': 'Before must be a valid date',
  }),
});

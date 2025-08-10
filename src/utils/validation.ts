import Joi from 'joi';
import { ValidationError } from '@/types/index.js';

export const userRegistrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must contain only alphanumeric characters',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username must not exceed 30 characters',
    'any.required': 'Username is required',
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),

  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password confirmation does not match password',
    'any.required': 'Password confirmation is required',
  }),

  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
  }),
});

export const userLoginSchema = Joi.object({
  login: Joi.string().required().messages({
    'any.required': 'Username or email is required',
  }),

  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
  }),

  bio: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Bio must not exceed 500 characters',
  }),

  avatar: Joi.string().uri().optional().allow('').messages({
    'string.uri': 'Avatar must be a valid URL',
  }),
});

export const createMessageSchema = Joi.object({
  conversation_id: Joi.number().integer().positive().required().messages({
    'number.integer': 'Conversation ID must be an integer',
    'number.positive': 'Conversation ID must be positive',
    'any.required': 'Conversation ID is required',
  }),

  content: Joi.string().min(1).max(5000).required().messages({
    'string.min': 'Message content cannot be empty',
    'string.max': 'Message content must not exceed 5000 characters',
    'any.required': 'Message content is required',
  }),

  message_type: Joi.string()
    .valid('text', 'image', 'file', 'audio', 'video', 'system')
    .optional()
    .default('text'),

  reply_to_id: Joi.number().integer().positive().optional().messages({
    'number.integer': 'Reply to ID must be an integer',
    'number.positive': 'Reply to ID must be positive',
  }),
});

export const createConversationSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Conversation name cannot be empty',
    'string.max': 'Conversation name must not exceed 100 characters',
    'any.required': 'Conversation name is required',
  }),

  description: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Description must not exceed 500 characters',
  }),

  is_group: Joi.boolean().required().messages({
    'any.required': 'Group type is required',
  }),

  user_ids: Joi.array().items(Joi.number().integer().positive()).optional().messages({
    'array.base': 'User IDs must be an array',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be positive',
  }),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).optional().default(20).messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),

  sort: Joi.string().optional().default('created_at'),

  order: Joi.string().valid('asc', 'desc').optional().default('desc').messages({
    'any.only': 'Order must be either "asc" or "desc"',
  }),
});

export const validateRequest = (schema: Joi.ObjectSchema, data: any): ValidationError[] => {
  const { error } = schema.validate(data, { abortEarly: false });

  if (!error) {
    return [];
  }

  return error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value,
  }));
};

export const passwordResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),

  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),

  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password confirmation does not match password',
    'any.required': 'Password confirmation is required',
  }),
});

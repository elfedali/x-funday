import Joi from 'joi';

export const createConversationValidation = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Conversation name must be at least 1 character long',
    'string.max': 'Conversation name must not exceed 100 characters',
  }),

  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),

  isGroup: Joi.boolean().default(false).optional().messages({
    'boolean.base': 'isGroup must be a boolean value',
  }),

  participantIds: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
    'array.min': 'At least one participant is required',
    'number.integer': 'Participant ID must be an integer',
    'number.positive': 'Participant ID must be positive',
    'any.required': 'Participant IDs are required',
  }),
});

export const updateConversationValidation = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Conversation name must be at least 1 character long',
    'string.max': 'Conversation name must not exceed 100 characters',
  }),

  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
});

export const addParticipantValidation = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be positive',
    'any.required': 'User ID is required',
  }),
});

export const conversationQueryValidation = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20).optional().messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 50',
  }),

  offset: Joi.number().integer().min(0).default(0).optional().messages({
    'number.integer': 'Offset must be an integer',
    'number.min': 'Offset must be at least 0',
  }),
});

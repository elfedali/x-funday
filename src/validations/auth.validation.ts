import Joi from 'joi';

export const registerValidation = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must only contain alphanumeric characters',
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
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),

  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords must match',
    'any.required': 'Password confirmation is required',
  }),

  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
  }),
});

export const loginValidation = Joi.object({
  login: Joi.string().required().messages({
    'any.required': 'Username or email is required',
  }),

  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const updateProfileValidation = Joi.object({
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

export const changePasswordValidation = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),

  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base':
        'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required',
    }),

  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'New passwords must match',
    'any.required': 'New password confirmation is required',
  }),
});

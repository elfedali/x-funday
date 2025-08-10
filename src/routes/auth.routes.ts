import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken,
  logout,
} from '@/controllers/auth.controller.js';
import { authMiddleware } from '@/middleware/auth.middleware.js';
import { validationMiddleware } from '@/middleware/validation.middleware.js';
import { authRateLimiter, passwordResetRateLimiter } from '@/middleware/rateLimiter.middleware.js';
import {
  userRegistrationSchema,
  userLoginSchema,
  updateProfileSchema,
} from '@/utils/validation.js';

const router = Router();

// Public routes
router.post(
  '/auth/register',
  authRateLimiter,
  validationMiddleware(userRegistrationSchema),
  registerUser
);

router.post('/auth/login', authRateLimiter, validationMiddleware(userLoginSchema), loginUser);

router.post(
  '/auth/verify-token',
  validationMiddleware({
    body: {
      token: 'required|string',
    },
  } as any),
  verifyToken
);

// Protected routes
router.get('/auth/profile', authMiddleware, getProfile);

router.put(
  '/auth/profile',
  authMiddleware,
  validationMiddleware(updateProfileSchema),
  updateProfile
);

router.post(
  '/auth/change-password',
  authMiddleware,
  validationMiddleware({
    body: {
      currentPassword: 'required|string',
      newPassword: 'required|string|min:8',
      confirmPassword: 'required|string',
    },
  } as any),
  changePassword
);

router.post('/auth/logout', authMiddleware, logout);

export default router;

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
} from '../validations/auth.validation.js';

const router = Router();

// Authentication routes (with rate limiting)
router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerValidation),
  AuthController.register
);

router.post('/login', authRateLimiter, validateRequest(loginValidation), AuthController.login);

router.post('/logout', authMiddleware, AuthController.logout);

router.post('/refresh-token', authMiddleware, AuthController.refreshToken);

// Profile routes (protected)
router.get('/profile', authMiddleware, AuthController.getProfile);

router.put(
  '/profile',
  authMiddleware,
  validateRequest(updateProfileValidation),
  AuthController.updateProfile
);

router.put(
  '/change-password',
  authMiddleware,
  validateRequest(changePasswordValidation),
  AuthController.changePassword
);

export default router;

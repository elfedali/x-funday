import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { rateLimitMiddleware } from '../middlewares/rateLimit.middleware.js';
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
  rateLimitMiddleware,
  validateRequest(registerValidation),
  AuthController.register
);

router.post('/login', rateLimitMiddleware, validateRequest(loginValidation), AuthController.login);

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

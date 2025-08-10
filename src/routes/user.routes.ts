import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { updateUserValidation } from '../validations/user.validation.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// User profile routes
router.get('/me', UserController.getCurrentUser);
router.get('/search', UserController.searchUsers);
router.get('/:id', UserController.getUserById);
router.get('/:id/presence', UserController.getUserPresence);

router.put('/:id', validateRequest(updateUserValidation), UserController.updateUser);

router.delete('/:id', UserController.deleteUser);

export default router;

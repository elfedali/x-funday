import { Router } from 'express';
import { MessageController } from '../controllers/message.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  createMessageValidation,
  updateMessageValidation,
} from '../validations/message.validation.js';

const router = Router();

// All message routes require authentication
router.use(authMiddleware);

// Message CRUD routes
router.get('/search', MessageController.searchMessages);
router.get('/unread-count', MessageController.getUnreadMessagesCount);
router.get('/:id', MessageController.getMessageById);

router.post('/', validateRequest(createMessageValidation), MessageController.sendMessage);

router.put('/:id', validateRequest(updateMessageValidation), MessageController.updateMessage);

router.delete('/:id', MessageController.deleteMessage);

// Message status routes
router.post('/:id/read', MessageController.markMessageAsRead);

export default router;

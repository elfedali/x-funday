import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  createConversationValidation,
  updateConversationValidation,
  addParticipantValidation,
} from '../validations/conversation.validation.js';

const router = Router();

// All conversation routes require authentication
router.use(authMiddleware);

// Conversation CRUD routes
router.get('/', ConversationController.getUserConversations);
router.get('/:id', ConversationController.getConversationById);
router.get('/:id/messages', ConversationController.getConversationMessages);

router.post(
  '/',
  validateRequest(createConversationValidation),
  ConversationController.createConversation
);

router.put(
  '/:id',
  validateRequest(updateConversationValidation),
  ConversationController.updateConversation
);

router.delete('/:id', ConversationController.deleteConversation);

// Participant management
router.post(
  '/:id/participants',
  validateRequest(addParticipantValidation),
  ConversationController.addParticipant
);

router.delete('/:id/participants/:userId', ConversationController.removeParticipant);

export default router;

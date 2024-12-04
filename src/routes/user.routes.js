import { Router } from "express";
import {
  actionGetConnectedUser,
  actionGetUser,
  actionUpdateUser,
  actionDeleteUser,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  actionGetAllConversationsByConnectedUser,
  actionGetConversationById,
  actionCreateConversation,
  actionUpdateConversation,
  actionDeleteConversation,
} from "../controllers/conversation.controller.js";

const router = Router();
// Users routes
router
  .get("/u", authMiddleware, actionGetConnectedUser)
  .get("/u/:id", authMiddleware, actionGetUser)
  .put("/u/:id", authMiddleware, actionUpdateUser)
  .delete("/u/:id", authMiddleware, actionDeleteUser);

// Conversations Routes
router
  .get("/c", authMiddleware, actionGetAllConversationsByConnectedUser)
  .get("/c/:id", authMiddleware, actionGetConversationById)
  .post("/c", authMiddleware, actionCreateConversation)
  .put("/c/:id", authMiddleware, actionUpdateConversation)
  .delete("/c/:id", authMiddleware, actionDeleteConversation);

// Messages Routes
// router.get("/c/:id/m", authMiddleware, messageController.getMessagesByConversation); // Get all messages in a conversation
// router.post("/c/:id/m", authMiddleware, messageController.sendMessage); // Send a message in a conversation
// router.delete("/m/:id", authMiddleware, messageController.deleteMessage); // Delete a message

export default router;

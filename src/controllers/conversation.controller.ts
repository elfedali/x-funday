import { Response } from 'express';
import { ConversationService } from '../services/conversation.service.js';
import { MessageService } from '../services/message.service.js';
import {
  AuthenticatedRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
  ConversationQuery,
} from '../types/index.js';
import { logger } from '../config/logger.js';

export class ConversationController {
  static async getUserConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const query: ConversationQuery = {
        limit: parseInt(req.query['limit'] as string) || 20,
        offset: parseInt(req.query['offset'] as string) || 0,
      };

      const result = await ConversationService.getUserConversations(req.user.id, query);

      res.json({
        success: true,
        message: 'Conversations retrieved successfully',
        data: {
          conversations: result.conversations,
          total: result.total,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error: any) {
      logger.error('Get user conversations error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversations',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async getConversationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const conversationId = parseInt(req.params['id'] as string);

      if (isNaN(conversationId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid conversation ID',
        });
        return;
      }

      const conversation = await ConversationService.getConversationById(
        conversationId,
        req.user.id
      );

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Conversation retrieved successfully',
        data: { conversation },
      });
    } catch (error: any) {
      logger.error('Get conversation by ID error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversation',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async createConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const conversationData: CreateConversationRequest = req.body;

      const conversation = await ConversationService.createConversation(
        req.user.id,
        conversationData
      );

      logger.info(`Conversation created: ${conversation.id} by user: ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: { conversation },
      });
    } catch (error: any) {
      logger.error('Create conversation error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create conversation',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async updateConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const conversationId = parseInt(req.params['id'] as string);

      if (isNaN(conversationId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid conversation ID',
        });
        return;
      }

      const updateData: UpdateConversationRequest = req.body;

      const updatedConversation = await ConversationService.updateConversation(
        conversationId,
        updateData,
        req.user.id
      );

      logger.info(`Conversation updated: ${conversationId} by user: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Conversation updated successfully',
        data: { conversation: updatedConversation },
      });
    } catch (error: any) {
      logger.error('Update conversation error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update conversation',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async deleteConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const conversationId = parseInt(req.params['id'] as string);

      if (isNaN(conversationId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid conversation ID',
        });
        return;
      }

      await ConversationService.deleteConversation(conversationId, req.user.id);

      logger.info(`Conversation deleted: ${conversationId} by user: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Conversation deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete conversation error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete conversation',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async addParticipant(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const conversationId = parseInt(req.params['id'] as string);
      const userId = parseInt(req.body.userId);

      if (isNaN(conversationId) || isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid conversation ID or user ID',
        });
        return;
      }

      await ConversationService.addParticipant(conversationId, userId, req.user.id);

      logger.info(`User ${userId} added to conversation ${conversationId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Participant added successfully',
      });
    } catch (error: any) {
      logger.error('Add participant error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add participant',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async removeParticipant(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const conversationId = parseInt(req.params['id'] as string);
      const userId = parseInt(req.params['userId'] as string);

      if (isNaN(conversationId) || isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid conversation ID or user ID',
        });
        return;
      }

      await ConversationService.removeParticipant(conversationId, userId, req.user.id);

      logger.info(
        `User ${userId} removed from conversation ${conversationId} by ${req.user.username}`
      );

      res.json({
        success: true,
        message: 'Participant removed successfully',
      });
    } catch (error: any) {
      logger.error('Remove participant error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove participant',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async getConversationMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const conversationId = parseInt(req.params['id'] as string);

      if (isNaN(conversationId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid conversation ID',
        });
        return;
      }

      const query = {
        limit: parseInt(req.query['limit'] as string as string) || 50,
        offset: parseInt(req.query['offset'] as string as string) || 0,
        before: (req.query['before'] as string)
          ? new Date(req.query['before'] as string as string)
          : undefined,
      };

      const result = await MessageService.getConversationMessages(
        conversationId,
        req.user.id,
        query
      );

      res.json({
        success: true,
        message: 'Messages retrieved successfully',
        data: {
          messages: result.messages,
          total: result.total,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error: any) {
      logger.error('Get conversation messages error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve messages',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}

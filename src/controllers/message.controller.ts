import { Response } from 'express';
import { MessageService } from '../services/message.service.js';
import {
  AuthenticatedRequest,
  CreateMessageRequest,
  UpdateMessageRequest,
  MessageQuery,
} from '../types/index.js';
import { logger } from '../config/logger.js';

export class MessageController {
  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const messageData: CreateMessageRequest = req.body;

      const message = await MessageService.createMessage(req.user.id, messageData);

      logger.info(`Message sent: ${message.id} by user: ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message },
      });
    } catch (error: any) {
      logger.error('Send message error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send message',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async getMessageById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const messageId = parseInt(req.params['id'] as string);

      if (isNaN(messageId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid message ID',
        });
        return;
      }

      const message = await MessageService.getMessageById(messageId, req.user.id);

      if (!message) {
        res.status(404).json({
          success: false,
          message: 'Message not found or access denied',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Message retrieved successfully',
        data: { message },
      });
    } catch (error: any) {
      logger.error('Get message by ID error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve message',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async updateMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const messageId = parseInt(req.params['id'] as string);

      if (isNaN(messageId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid message ID',
        });
        return;
      }

      const updateData: UpdateMessageRequest = req.body;

      const updatedMessage = await MessageService.updateMessage(messageId, updateData, req.user.id);

      logger.info(`Message updated: ${messageId} by user: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Message updated successfully',
        data: { message: updatedMessage },
      });
    } catch (error: any) {
      logger.error('Update message error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update message',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const messageId = parseInt(req.params['id'] as string);

      if (isNaN(messageId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid message ID',
        });
        return;
      }

      await MessageService.deleteMessage(messageId, req.user.id);

      logger.info(`Message deleted: ${messageId} by user: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete message error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete message',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async markMessageAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const messageId = parseInt(req.params['id'] as string);

      if (isNaN(messageId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid message ID',
        });
        return;
      }

      await MessageService.markMessageAsRead(messageId, req.user.id);

      res.json({
        success: true,
        message: 'Message marked as read',
      });
    } catch (error: any) {
      logger.error('Mark message as read error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to mark message as read',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async searchMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const search = (req.query['search'] as string) || '';
      const conversationId = (req.query['conversationId'] as string)
        ? parseInt(req.query['conversationId'] as string)
        : undefined;
      const limit = parseInt(req.query['limit'] as string) || 20;
      const offset = parseInt(req.query['offset'] as string) || 0;
      const page = Math.floor(offset / limit) + 1;

      const result = await MessageService.searchMessages(
        search,
        req.user.id,
        conversationId,
        page,
        limit
      );

      res.json({
        success: true,
        message: 'Messages retrieved successfully',
        data: {
          messages: result.messages,
          total: result.pagination.total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      logger.error('Search messages error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to search messages',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async getUnreadMessagesCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const count = await MessageService.getUnreadMessagesCount(req.user.id);

      res.json({
        success: true,
        message: 'Unread messages count retrieved successfully',
        data: { count },
      });
    } catch (error: any) {
      logger.error('Get unread messages count error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get unread messages count',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}

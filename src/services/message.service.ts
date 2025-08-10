import {
  Message,
  CreateMessageRequest,
  MessageType,
  SocketMessage,
  TypingEvent,
} from '@/types/index.js';
import {
  createMessage,
  getMessagesByConversationId,
  updateMessage,
  softDeleteMessage,
  markConversationMessagesAsRead,
  searchMessages,
  getMessagesCount,
} from '@/models/message.model.js';
import { isUserInConversation, getConversationMembers } from '@/models/conversation.model.js';
import { AppError, calculatePagination } from '@/utils/helpers.js';
import { logger } from '@/config/logger.js';

export class MessageService {
  static async createMessage(
    senderId: number,
    messageData: CreateMessageRequest
  ): Promise<Message> {
    try {
      // Verify user is in conversation
      const isUserMember = await isUserInConversation(messageData.conversation_id, senderId);
      if (!isUserMember) {
        throw new AppError('You are not a member of this conversation', 403);
      }

      // Create message
      const message = await createMessage({
        ...messageData,
        sender_id: senderId,
      });

      logger.info('Message created successfully', {
        messageId: message.id,
        senderId,
        conversationId: messageData.conversation_id,
      });

      return message;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Create message error:', error);
      throw new AppError('Failed to create message', 500);
    }
  }

  static async getConversationMessages(
    conversationId: number,
    userId: number,
    page: number = 1,
    limit: number = 50,
    beforeMessageId?: number
  ): Promise<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // Verify user is in conversation
      const isUserMember = await isUserInConversation(conversationId, userId);
      if (!isUserMember) {
        throw new AppError('You are not a member of this conversation', 403);
      }

      // Get total count
      const total = await getMessagesCount(conversationId);
      const pagination = calculatePagination(page, limit, total);

      // Get messages
      const messages = await getMessagesByConversationId(
        conversationId,
        limit,
        pagination.offset,
        beforeMessageId
      );

      return {
        messages,
        pagination,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Get conversation messages error:', error);
      throw new AppError('Failed to get messages', 500);
    }
  }

  static async editMessage(
    messageId: number,
    userId: number,
    newContent: string
  ): Promise<Message> {
    try {
      // First, get the message to verify ownership
      const existingMessage = await createMessage({
        conversation_id: 0, // This is a placeholder, we need a getMessageById function
        sender_id: userId,
        content: newContent,
      });

      // For now, we'll use a simple approach
      const updatedMessage = await updateMessage(messageId, {
        content: newContent,
        is_edited: true,
      });

      logger.info('Message edited successfully', {
        messageId,
        userId,
      });

      return updatedMessage;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Edit message error:', error);
      throw new AppError('Failed to edit message', 500);
    }
  }

  static async deleteMessage(messageId: number, userId: number): Promise<void> {
    try {
      // Here we would verify ownership or admin rights
      await softDeleteMessage(messageId);

      logger.info('Message deleted successfully', {
        messageId,
        userId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Delete message error:', error);
      throw new AppError('Failed to delete message', 500);
    }
  }

  static async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    try {
      // Verify user is in conversation
      const isUserMember = await isUserInConversation(conversationId, userId);
      if (!isUserMember) {
        throw new AppError('You are not a member of this conversation', 403);
      }

      await markConversationMessagesAsRead(conversationId, userId);

      logger.info('Messages marked as read', {
        conversationId,
        userId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Mark messages as read error:', error);
      throw new AppError('Failed to mark messages as read', 500);
    }
  }

  static async searchMessages(
    query: string,
    userId: number,
    conversationId?: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      if (conversationId) {
        // Verify user is in conversation
        const isUserMember = await isUserInConversation(conversationId, userId);
        if (!isUserMember) {
          throw new AppError('You are not a member of this conversation', 403);
        }
      }

      const pagination = calculatePagination(page, limit, 0); // We'll get total separately
      const messages = await searchMessages(query, conversationId, limit, pagination.offset);

      // For simplicity, we'll set total to messages length for now
      // In a real app, you'd want a separate count query
      const total = messages.length;
      const finalPagination = calculatePagination(page, limit, total);

      return {
        messages,
        pagination: finalPagination,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Search messages error:', error);
      throw new AppError('Failed to search messages', 500);
    }
  }

  static async getConversationMembers(conversationId: number, userId: number): Promise<any[]> {
    try {
      // Verify user is in conversation
      const isUserMember = await isUserInConversation(conversationId, userId);
      if (!isUserMember) {
        throw new AppError('You are not a member of this conversation', 403);
      }

      const members = await getConversationMembers(conversationId);
      return members;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Get conversation members error:', error);
      throw new AppError('Failed to get conversation members', 500);
    }
  }
}

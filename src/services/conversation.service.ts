import {
  Conversation,
  CreateConversationRequest,
  ConversationRole,
  UserProfile,
} from '../types/index.js';
import {
  createConversation,
  getUserConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  addUserToConversation,
  removeUserFromConversation,
  isUserInConversation,
  getUserRoleInConversation,
  updateUserRoleInConversation,
  searchConversations,
  getDirectConversation,
  getConversationsCount,
} from '../models/conversation.model.js';
import { getUsersByIds } from '../models/user.model.js';
import { AppError, calculatePagination } from '../utils/helpers.js';
import { logger } from '../config/logger.js';

export class ConversationService {
  static async createConversation(
    ownerId: number,
    conversationData: CreateConversationRequest
  ): Promise<Conversation> {
    try {
      const { name, description, is_group, user_ids } = conversationData;

      // For direct messages, check if conversation already exists
      if (!is_group && user_ids && user_ids.length === 1) {
        const existingConversation = await getDirectConversation(ownerId, user_ids[0]!);
        if (existingConversation) {
          return existingConversation;
        }
      }

      // Create conversation
      const conversationPayload: CreateConversationRequest & { owner_id: number } = {
        name,
        is_group,
        owner_id: ownerId,
      };

      if (description !== undefined) {
        conversationPayload.description = description;
      }

      if (user_ids !== undefined) {
        conversationPayload.user_ids = user_ids;
      }

      const conversation = await createConversation(conversationPayload);

      // Add owner to conversation
      await addUserToConversation(conversation.id, ownerId, ConversationRole.ADMIN);

      // Add other users if specified
      if (user_ids && user_ids.length > 0) {
        const validUsers = await getUsersByIds(user_ids);

        for (const user of validUsers) {
          if (user.id !== ownerId) {
            await addUserToConversation(conversation.id, user.id, ConversationRole.MEMBER);
          }
        }
      }

      logger.info('Conversation created successfully', {
        conversationId: conversation.id,
        ownerId,
        isGroup: is_group,
        memberCount: (user_ids?.length || 0) + 1,
      });

      return conversation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Create conversation error:', error);
      throw new AppError('Failed to create conversation', 500);
    }
  }

  static async getUserConversations(
    userId: number,
    query: { limit: number; offset: number }
  ): Promise<{
    conversations: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { limit, offset } = query;
      const total = await getConversationsCount(userId);
      const page = Math.floor(offset / limit) + 1;
      const pagination = calculatePagination(page, limit, total);

      const conversations = await getUserConversations(userId, limit, offset);

      return {
        conversations,
        pagination,
      };
    } catch (error) {
      logger.error('Get user conversations error:', error);
      throw new AppError('Failed to get conversations', 500);
    }
  }

  static async getConversationById(conversationId: number, userId: number): Promise<Conversation> {
    try {
      // Verify user is in conversation
      const isUserMember = await isUserInConversation(conversationId, userId);
      if (!isUserMember) {
        throw new AppError('You are not a member of this conversation', 403);
      }

      const conversation = await getConversationById(conversationId);
      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      return conversation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Get conversation details error:', error);
      throw new AppError('Failed to get conversation details', 500);
    }
  }

  static async updateConversation(
    conversationId: number,
    updateData: Partial<Conversation>,
    userId: number
  ): Promise<Conversation> {
    try {
      // Verify user has admin role in conversation
      const userRole = await getUserRoleInConversation(conversationId, userId);
      if (userRole !== ConversationRole.ADMIN) {
        throw new AppError('Only admins can update conversation details', 403);
      }

      const updatedConversation = await updateConversation(conversationId, updateData);

      logger.info('Conversation updated successfully', {
        conversationId,
        userId,
        updatedFields: Object.keys(updateData),
      });

      return updatedConversation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Update conversation error:', error);
      throw new AppError('Failed to update conversation', 500);
    }
  }

  static async deleteConversation(conversationId: number, userId: number): Promise<void> {
    try {
      // Verify user has admin role in conversation
      const userRole = await getUserRoleInConversation(conversationId, userId);
      if (userRole !== ConversationRole.ADMIN) {
        throw new AppError('Only admins can delete conversations', 403);
      }

      await deleteConversation(conversationId);

      logger.info('Conversation deleted successfully', {
        conversationId,
        userId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Delete conversation error:', error);
      throw new AppError('Failed to delete conversation', 500);
    }
  }

  static async joinConversation(conversationId: number, userId: number): Promise<void> {
    try {
      const conversation = await getConversationById(conversationId);
      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      // Check if user is already in conversation
      const isAlreadyMember = await isUserInConversation(conversationId, userId);
      if (isAlreadyMember) {
        throw new AppError('User is already a member of this conversation', 400);
      }

      await addUserToConversation(conversationId, userId, ConversationRole.MEMBER);

      logger.info('User joined conversation successfully', {
        conversationId,
        userId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Join conversation error:', error);
      throw new AppError('Failed to join conversation', 500);
    }
  }

  static async leaveConversation(conversationId: number, userId: number): Promise<void> {
    try {
      // Verify user is in conversation
      const isUserMember = await isUserInConversation(conversationId, userId);
      if (!isUserMember) {
        throw new AppError('You are not a member of this conversation', 403);
      }

      const conversation = await getConversationById(conversationId);
      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      // If user is the owner, they cannot leave (they must delete the conversation)
      if (conversation.owner_id === userId) {
        throw new AppError(
          'Conversation owner cannot leave. Delete the conversation instead.',
          400
        );
      }

      await removeUserFromConversation(conversationId, userId);

      logger.info('User left conversation successfully', {
        conversationId,
        userId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Leave conversation error:', error);
      throw new AppError('Failed to leave conversation', 500);
    }
  }

  static async addParticipant(
    conversationId: number,
    userId: number,
    adminUserId: number
  ): Promise<void> {
    try {
      // Verify admin has permission
      const adminRole = await getUserRoleInConversation(conversationId, adminUserId);
      if (adminRole !== ConversationRole.ADMIN && adminRole !== ConversationRole.MODERATOR) {
        throw new AppError('Only admins and moderators can add members', 403);
      }

      // Check if user is already in conversation
      const isAlreadyMember = await isUserInConversation(conversationId, userId);
      if (isAlreadyMember) {
        throw new AppError('User is already a member of this conversation', 400);
      }

      await addUserToConversation(conversationId, userId, ConversationRole.MEMBER);

      logger.info('Member added to conversation successfully', {
        conversationId,
        adminUserId,
        userId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Add member error:', error);
      throw new AppError('Failed to add member', 500);
    }
  }

  static async removeParticipant(
    conversationId: number,
    adminUserId: number,
    memberUserId: number
  ): Promise<void> {
    try {
      // Verify admin has permission
      const adminRole = await getUserRoleInConversation(conversationId, adminUserId);
      if (adminRole !== ConversationRole.ADMIN && adminRole !== ConversationRole.MODERATOR) {
        throw new AppError('Only admins and moderators can remove members', 403);
      }

      // Cannot remove the conversation owner
      const conversation = await getConversationById(conversationId);
      if (conversation?.owner_id === memberUserId) {
        throw new AppError('Cannot remove conversation owner', 400);
      }

      await removeUserFromConversation(conversationId, memberUserId);

      logger.info('Member removed from conversation successfully', {
        conversationId,
        adminUserId,
        memberUserId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Remove member error:', error);
      throw new AppError('Failed to remove member', 500);
    }
  }

  static async updateMemberRole(
    conversationId: number,
    adminUserId: number,
    memberUserId: number,
    newRole: ConversationRole
  ): Promise<void> {
    try {
      // Verify admin has permission
      const adminRole = await getUserRoleInConversation(conversationId, adminUserId);
      if (adminRole !== ConversationRole.ADMIN) {
        throw new AppError('Only admins can change member roles', 403);
      }

      // Cannot change the conversation owner's role
      const conversation = await getConversationById(conversationId);
      if (conversation?.owner_id === memberUserId) {
        throw new AppError('Cannot change conversation owner role', 400);
      }

      await updateUserRoleInConversation(conversationId, memberUserId, newRole);

      logger.info('Member role updated successfully', {
        conversationId,
        adminUserId,
        memberUserId,
        newRole,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Update member role error:', error);
      throw new AppError('Failed to update member role', 500);
    }
  }

  static async searchConversations(
    query: string,
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    conversations: Conversation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const pagination = calculatePagination(page, limit, 0); // We'll get total separately
      const conversations = await searchConversations(query, userId, limit, pagination.offset);

      // For simplicity, we'll set total to conversations length for now
      const total = conversations.length;
      const finalPagination = calculatePagination(page, limit, total);

      return {
        conversations,
        pagination: finalPagination,
      };
    } catch (error) {
      logger.error('Search conversations error:', error);
      throw new AppError('Failed to search conversations', 500);
    }
  }
}

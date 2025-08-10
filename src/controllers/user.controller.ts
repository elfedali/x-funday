import { Response } from 'express';
import { UserService } from '../services/user.service.js';
import { AuthenticatedRequest, UpdateUserRequest, UserSearchQuery } from '../types/index.js';
import { logger } from '../config/logger.js';

export class UserController {
  static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const user = await UserService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Current user retrieved successfully',
        data: { user },
      });
    } catch (error: any) {
      logger.error('Get current user error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve current user',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params['id'] as string);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      const user = await UserService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: { user },
      });
    } catch (error: any) {
      logger.error('Get user by ID error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const userId = parseInt(req.params['id'] as string);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      // Users can only update their own profile
      if (userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only update your own profile',
        });
        return;
      }

      const updateData: UpdateUserRequest = req.body;
      const updatedUser = await UserService.updateUser(userId, updateData);

      logger.info(`User updated: ${req.user.username}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser },
      });
    } catch (error: any) {
      logger.error('Update user error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const userId = parseInt(req.params['id'] as string);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      // Users can only delete their own account
      if (userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only delete your own account',
        });
        return;
      }

      await UserService.deleteUser(userId);

      logger.info(`User deleted: ${req.user.username}`);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete user error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const query: UserSearchQuery = {
        search: req.query['search'] as string as string,
        limit: parseInt(req.query['limit'] as string as string) || 10,
        offset: parseInt(req.query['offset'] as string as string) || 0,
      };

      const result = await UserService.searchUsers(query);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: result.users,
          total: result.total,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error: any) {
      logger.error('Search users error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to search users',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async getUserPresence(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params['id'] as string);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      const presence = await UserService.getUserPresence(userId);

      res.json({
        success: true,
        message: 'User presence retrieved successfully',
        data: { presence },
      });
    } catch (error: any) {
      logger.error('Get user presence error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user presence',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}

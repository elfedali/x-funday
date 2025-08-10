import * as UserModel from '../models/user.model.js';
import { UserProfile, UpdateUserRequest, UserSearchQuery, UserPresence } from '../types/index.js';
import { logger } from '../config/logger.js';

export class UserService {
  static async getUserById(userId: number): Promise<UserProfile | null> {
    try {
      const user = await UserModel.getUserById(userId);

      if (!user) {
        return null;
      }

      // Return user without sensitive information
      const { password, verify_token, ...userProfile } = user;
      return userProfile as UserProfile;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  static async updateUser(userId: number, updateData: UpdateUserRequest): Promise<UserProfile> {
    try {
      // Validate that user exists
      const existingUser = await UserModel.getUserById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Update user
      const updatedUser = await UserModel.updateUser(userId, updateData);

      // Return user without sensitive information
      const { password, verify_token, ...userProfile } = updatedUser;
      return userProfile as UserProfile;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(userId: number): Promise<void> {
    try {
      // Validate that user exists
      const existingUser = await UserModel.getUserById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      await UserModel.deleteUser(userId);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  static async searchUsers(
    query: UserSearchQuery
  ): Promise<{ users: UserProfile[]; total: number }> {
    try {
      const result = await UserModel.searchUsers(query);

      // Remove sensitive information from all users
      const users = result.users.map(user => {
        const { password, verify_token, ...userProfile } = user;
        return userProfile as UserProfile;
      });

      return {
        users,
        total: result.total,
      };
    } catch (error) {
      logger.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  static async getUserPresence(userId: number): Promise<UserPresence> {
    try {
      const user = await UserModel.getUserById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Simple presence logic - in a real app, this might come from a cache/Redis
      const now = new Date();
      const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
      const isOnline = lastSeen && now.getTime() - lastSeen.getTime() < 5 * 60 * 1000; // 5 minutes

      return {
        userId: user.id,
        isOnline: isOnline || false,
        lastSeen: lastSeen || user.created_at,
        status: isOnline ? 'online' : 'offline',
      };
    } catch (error) {
      logger.error('Error getting user presence:', error);
      throw error;
    }
  }

  static async updateUserPresence(userId: number): Promise<void> {
    try {
      await UserModel.updateUser(userId, { last_seen: new Date() });
    } catch (error) {
      logger.error('Error updating user presence:', error);
      throw new Error('Failed to update user presence');
    }
  }
}

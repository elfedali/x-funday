import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import {
  CreateUserRequest,
  LoginRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../types/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logger } from '../config/logger.js';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;

      const result = await AuthService.register(userData);

      logger.info(`New user registered: ${userData.username}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      logger.error('Registration error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
        error:
          process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
            ? error.stack
            : undefined,
        details: process.env.NODE_ENV === 'test' ? error.toString() : undefined,
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;

      const result = await AuthService.login(loginData);

      logger.info(`User logged in: ${loginData.login}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      logger.error('Login error:', error);

      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success message

      logger.info(`User logged out: ${req.user?.username}`);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error: any) {
      logger.error('Logout error:', error);

      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const profile = await AuthService.getProfile(req.user.id);

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: profile },
      });
    } catch (error: any) {
      logger.error('Get profile error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const updateData: UpdateProfileRequest = req.body;

      const updatedProfile = await AuthService.updateProfile(req.user.id, updateData);

      logger.info(`User profile updated: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedProfile },
      });
    } catch (error: any) {
      logger.error('Update profile error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const passwordData: ChangePasswordRequest = req.body;

      await AuthService.changePassword(req.user.id, passwordData);

      logger.info(`Password changed for user: ${req.user.username}`);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Change password error:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  static async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const newToken = await AuthService.refreshToken(req.user.id);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token: newToken },
      });
    } catch (error: any) {
      logger.error('Refresh token error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types/index.js';
import { AuthService } from '@/services/auth.service.js';
import {
  createSuccessResponse,
  createErrorResponse,
  asyncHandler,
  AppError,
} from '@/utils/helpers.js';
import { logger } from '@/config/logger.js';

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, confirmPassword, name } = req.body;

  try {
    const result = await AuthService.register({
      username,
      email,
      password,
      confirmPassword,
      name,
    });

    logger.info('User registered successfully', {
      userId: result.user.id,
      username: result.user.username,
      ip: req.ip,
    });

    res.status(201).json(
      createSuccessResponse('User registered successfully', {
        user: result.user,
        token: result.token,
      })
    );
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Registration failed', {
        error: error.message,
        username,
        email,
        ip: req.ip,
      });
      res.status(error.statusCode).json(createErrorResponse(error.message));
    } else {
      logger.error('Registration error:', error);
      res.status(500).json(createErrorResponse('Registration failed'));
    }
  }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { login, password } = req.body;

  try {
    const result = await AuthService.login({ login, password });

    logger.info('User logged in successfully', {
      userId: result.user.id,
      username: result.user.username,
      ip: req.ip,
    });

    res.status(200).json(
      createSuccessResponse('Login successful', {
        user: result.user,
        token: result.token,
      })
    );
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Login failed', {
        error: error.message,
        login,
        ip: req.ip,
      });
      res.status(error.statusCode).json(createErrorResponse(error.message));
    } else {
      logger.error('Login error:', error);
      res.status(500).json(createErrorResponse('Login failed'));
    }
  }
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const user = await AuthService.getProfile(req.user.id);

    res.status(200).json(createSuccessResponse('Profile retrieved successfully', { user }));
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json(createErrorResponse(error.message));
    } else {
      logger.error('Get profile error:', error);
      res.status(500).json(createErrorResponse('Failed to get profile'));
    }
  }
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const { name, bio, avatar } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await AuthService.updateProfile(req.user.id, updateData);

    logger.info('Profile updated successfully', {
      userId: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    res.status(200).json(createSuccessResponse('Profile updated successfully', { user }));
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json(createErrorResponse(error.message));
    } else {
      logger.error('Update profile error:', error);
      res.status(500).json(createErrorResponse('Failed to update profile'));
    }
  }
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      res.status(400).json(createErrorResponse('New passwords do not match'));
      return;
    }

    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    logger.info('Password changed successfully', { userId: req.user.id });

    res.status(200).json(createSuccessResponse('Password changed successfully'));
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json(createErrorResponse(error.message));
    } else {
      logger.error('Change password error:', error);
      res.status(500).json(createErrorResponse('Failed to change password'));
    }
  }
});

export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json(createErrorResponse('Token is required'));
      return;
    }

    const user = await AuthService.verifyToken(token);

    res.status(200).json(createSuccessResponse('Token is valid', { user }));
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json(createErrorResponse(error.message));
    } else {
      logger.error('Token verification error:', error);
      res.status(500).json(createErrorResponse('Token verification failed'));
    }
  }
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    // In a more sophisticated setup, you would invalidate the token
    // For now, we'll just log the logout
    logger.info('User logged out', { userId: req.user.id });

    res.status(200).json(createSuccessResponse('Logout successful'));
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json(createErrorResponse('Logout failed'));
  }
});

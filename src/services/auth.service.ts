import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User, CreateUserRequest, LoginRequest, JwtUser, UserProfile } from '../types/index.js';
import {
  AppError,
  generateVerificationToken,
  isValidEmail,
  isValidUsername,
  isValidPassword,
  sanitizeUser,
} from '../utils/helpers.js';
import {
  getUserByUsername,
  getUserByEmail,
  createUser,
  getUserById,
  updateUser,
} from '../models/user.model.js';
import { logger } from '../config/logger.js';

export class AuthService {
  static async register(
    userData: CreateUserRequest
  ): Promise<{ user: UserProfile; token: string }> {
    const { username, email, password, confirmPassword, name } = userData;

    // Validate passwords match
    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      throw new AppError('Invalid email format', 400);
    }

    // Validate username format
    if (!isValidUsername(username)) {
      throw new AppError(
        'Username must be 3-30 characters and contain only letters, numbers, and underscores',
        400
      );
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    try {
      // Check if username or email already exists
      const [existingUser, existingEmail] = await Promise.all([
        getUserByUsername(username),
        getUserByEmail(email),
      ]);

      if (existingUser) {
        throw new AppError('Username already exists', 409);
      }

      if (existingEmail) {
        throw new AppError('Email already exists', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

      // Generate verification token
      const verifyToken = generateVerificationToken();

      // Create user
      const newUser = await createUser({
        username,
        email,
        password: hashedPassword,
        name: name || username,
        verify_token: verifyToken,
      });

      // Generate JWT token
      const token = this.generateAccessToken(newUser);

      logger.info('User registered successfully', {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
      });

      return {
        user: sanitizeUser(newUser),
        token,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Registration error:', error);
      throw new AppError('Registration failed', 500);
    }
  }

  static async login(loginData: LoginRequest): Promise<{ user: UserProfile; token: string }> {
    const { login, password } = loginData;

    try {
      // Find user by username or email
      let user: User | null = null;

      if (isValidEmail(login)) {
        user = await getUserByEmail(login);
      } else {
        user = await getUserByUsername(login);
      }

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user is active
      if (!user.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn('Failed login attempt', {
          login,
          userId: user.id,
          reason: 'Invalid password',
        });
        throw new AppError('Invalid credentials', 401);
      }

      // Update last seen
      await updateUser(user.id, { last_seen: new Date() });

      // Generate JWT token
      const token = this.generateAccessToken(user);

      logger.info('User logged in successfully', {
        userId: user.id,
        username: user.username,
      });

      return {
        user: sanitizeUser(user),
        token,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Login error:', error);
      throw new AppError('Login failed', 500);
    }
  }

  static async getProfile(userId: number): Promise<UserProfile> {
    try {
      const user = await getUserById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      return sanitizeUser(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Get profile error:', error);
      throw new AppError('Failed to get profile', 500);
    }
  }

  static async updateProfile(userId: number, updateData: Partial<User>): Promise<UserProfile> {
    try {
      const user = await getUserById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // Update user
      const updatedUser = await updateUser(userId, {
        ...updateData,
        updated_at: new Date(),
      });

      logger.info('User profile updated', {
        userId,
        updatedFields: Object.keys(updateData),
      });

      return sanitizeUser(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Update profile error:', error);
      throw new AppError('Failed to update profile', 500);
    }
  }

  static async verifyToken(token: string): Promise<JwtUser> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtUser;

      // Verify user still exists and is active
      const user = await getUserById(decoded.id);
      if (!user || !user.is_active) {
        throw new AppError('Invalid token', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      }
      throw error;
    }
  }

  private static generateAccessToken(user: User): string {
    const payload: JwtUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  static async changePassword(
    userId: number,
    passwordData: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    const { currentPassword, newPassword } = passwordData;

    try {
      const user = await getUserById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Validate new password
      if (!isValidPassword(newPassword)) {
        throw new AppError('New password must be at least 8 characters long', 400);
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

      // Update password
      await updateUser(userId, {
        password: hashedNewPassword,
        updated_at: new Date(),
      });

      logger.info('Password changed successfully', { userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Change password error:', error);
      throw new AppError('Failed to change password', 500);
    }
  }

  static async refreshToken(userId: number): Promise<string> {
    try {
      const user = await getUserById(userId);

      if (!user || !user.is_active) {
        throw new AppError('Invalid user', 401);
      }

      // Generate new token
      const token = this.generateAccessToken(user);

      logger.info('Token refreshed successfully', { userId });

      return token;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Refresh token error:', error);
      throw new AppError('Failed to refresh token', 500);
    }
  }
}
